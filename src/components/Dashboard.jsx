import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getActiveBookings, getUpcomingBookings, getClientById, getBookings, saveBooking } from '../utils/storage'
import { DogAvatar } from '../utils/dogBreeds'

const MAX_CAPACITY = parseInt(localStorage.getItem('dogets_max_capacity') || '10');

export default function Dashboard({ addToast, refreshData }) {
    const [stats, setStats] = useState({ totalClients: 0, totalBookings: 0, activeBookings: 0, upcomingBookings: 0, monthRevenue: 0 })
    const [activeBookings, setActiveBookings] = useState([])
    const [upcomingBookings, setUpcomingBookings] = useState([])
    const [checklist, setChecklist] = useState({})
    const navigate = useNavigate()

    useEffect(() => {
        setStats(getStats())
        setActiveBookings(getActiveBookings().map(b => ({ ...b, client: getClientById(b.clientId) })))
        setUpcomingBookings(getUpcomingBookings(7).map(b => ({ ...b, client: getClientById(b.clientId) })))
        loadChecklist()
    }, [])

    const loadChecklist = () => {
        const today = new Date().toISOString().split('T')[0]
        const stored = JSON.parse(localStorage.getItem('dogets_checklist') || '{}')
        if (stored.date !== today) {
            setChecklist({ date: today, tasks: {} })
        } else {
            setChecklist(stored)
        }
    }

    const toggleTask = (dogId, task) => {
        setChecklist(prev => {
            const key = `${dogId}_${task}`
            const updated = {
                ...prev,
                tasks: { ...prev.tasks, [key]: !prev.tasks?.[key] }
            }
            localStorage.setItem('dogets_checklist', JSON.stringify(updated))
            return updated
        })
    }

    const isTaskDone = (dogId, task) => checklist.tasks?.[`${dogId}_${task}`] || false

    const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

    const occupancyPct = Math.min(100, Math.round((stats.activeBookings / MAX_CAPACITY) * 100))
    const occupancyColor = occupancyPct >= 100 ? 'var(--danger)' : occupancyPct >= 80 ? 'var(--warning)' : 'var(--success)'

    const handleCheckIn = (booking) => {
        saveBooking({ ...booking, checkedIn: new Date().toISOString(), client: undefined })
        refreshData()
        addToast(`✅ ${booking.client?.dogName} ha llegado`, 'success')
        setActiveBookings(getActiveBookings().map(b => ({ ...b, client: getClientById(b.clientId) })))
        setStats(getStats())
    }

    const handleCheckOut = (booking, paymentMethod = null) => {
        const updates = { checkedOut: new Date().toISOString(), client: undefined }
        if (paymentMethod) {
            updates.paid = true
            updates.notes = booking.notes
                ? `${booking.notes}\n[Cobrado por ${paymentMethod}]`
                : `[Cobrado por ${paymentMethod}]`
        }

        saveBooking({ ...booking, ...updates })
        refreshData()
        addToast(`🏠 ${booking.client?.dogName} se ha ido${paymentMethod ? ` (Cobrado por ${paymentMethod})` : ''}`, 'success')
        setActiveBookings(getActiveBookings().map(b => ({ ...b, client: getClientById(b.clientId) })))
        setStats(getStats())
    }

    const dailyTasks = ['🌅 Paseo mañana', '🍖 Comida', '🌇 Paseo tarde', '🍗 Cena', '📷 Foto enviada']

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Resumen de tu negocio de hospedaje canino</p>
                </div>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card">
                    <span className="stat-icon">🐕</span>
                    <span className="stat-value">{stats.activeBookings}</span>
                    <span className="stat-label">Perros hospedados ahora</span>
                    {/* Occupancy Bar */}
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            <span>Capacidad</span>
                            <span style={{ color: occupancyColor, fontWeight: 600 }}>{occupancyPct}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${occupancyPct}%`, background: occupancyColor, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📅</span>
                    <span className="stat-value">{stats.upcomingBookings}</span>
                    <span className="stat-label">Próximas llegadas (7 días)</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">{stats.monthRevenue}€</span>
                    <span className="stat-label">Ingresos este mes</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{stats.totalClients}</span>
                    <span className="stat-label">Total clientes</span>
                </div>
            </div>

            {/* Daily Care Dashboard (Replaces old tasks table) */}
            {activeBookings.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>📝 Panel de Cuidados Diarios</h2>

                    <div className="cards-grid">
                        {activeBookings.map(b => (
                            <div key={`care-${b.id}`} className="card" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={48} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{b.client?.dogName}</h3>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.client?.ownerName}</div>
                                    </div>
                                </div>

                                {/* Vital Info Tags */}
                                {(b.client?.allergies || b.client?.behaviorTags || b.alerts) && (
                                    <div className="tags-container" style={{ margin: 'var(--space-xs) 0' }}>
                                        {b.alerts && <span className="allergy-tag">⚠️ {b.alerts}</span>}
                                        {b.client?.allergies && b.client.allergies.split(',').slice(0, 2).map((a, i) => <span key={`ca-${i}`} className="allergy-tag">⚠️ {a.trim()}</span>)}
                                        {b.client?.behaviorTags && b.client.behaviorTags.split(',').slice(0, 3).map((t, i) => <span key={`cb-${i}`} className="behavior-tag">🏷️ {t.trim()}</span>)}
                                    </div>
                                )}

                                {/* Feeding Instructions */}
                                {b.client?.feedingNotes && (
                                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                        <div style={{ color: 'var(--amber-500)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 2 }}>🥩 Alimentación:</div>
                                        <div style={{ color: 'var(--text-primary)' }}>{b.client.feedingNotes}</div>
                                    </div>
                                )}

                                {/* Checklist */}
                                <div style={{ marginTop: 'var(--space-xs)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {dailyTasks.map(task => (
                                        <label key={task} className="checklist-item" style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                            padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                            background: isTaskDone(b.clientId, task) ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-card-hover)',
                                            border: `1px solid ${isTaskDone(b.clientId, task) ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-default)'}`
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={isTaskDone(b.clientId, task)}
                                                onChange={() => toggleTask(b.clientId, task)}
                                                style={{ width: 22, height: 22, accentColor: task.includes('Foto enviada') ? '#25D366' : 'var(--amber-500)', cursor: 'pointer' }}
                                            />
                                            <span style={{
                                                fontSize: '0.95rem',
                                                textDecoration: isTaskDone(b.clientId, task) ? 'line-through' : 'none',
                                                color: isTaskDone(b.clientId, task) ? 'var(--text-muted)' : 'var(--text-primary)'
                                            }}>
                                                {task}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {/* Send Video Action */}
                                {b.client?.phone && (
                                    <a
                                        href={`https://wa.me/34${b.client.phone.replace(/\s/g, '')}?text=${encodeURIComponent(`¡Hola ${b.client.ownerName}! 🐾 ¡Todo genial por aquí hoy con ${b.client.dogName}! Ya ha hecho sus cosas y comido sin problema. Te paso vídeo/foto del día:`)}`}
                                        target="_blank"
                                        rel="noopener"
                                        className="btn btn-secondary w-full"
                                        style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderColor: '#25D366', justifyContent: 'center', marginTop: 'var(--space-xs)' }}
                                    >
                                        📱 Abrir WhatsApp
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Bookings (Check-in/out Management) */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>🏠 Gestión de Entradas/Salidas</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reservas')}>Ver todas →</button>
                </div>
                {activeBookings.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay perros hospedados actualmente
                    </div>
                ) : (
                    <div className="cards-grid">
                        {activeBookings.map(b => (
                            <div key={b.id} className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', position: 'relative', overflow: 'hidden' }}>
                                {/* Header: Dog Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={56} />
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{b.client?.dogName || 'Desconocido'}</h3>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>{b.client?.breed}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <span className="badge badge-success" style={{ marginBottom: 4, display: 'inline-block' }}>Hospedado</span>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sale el {formatDate(b.checkOut)}</div>
                                    </div>
                                </div>

                                {/* Alerts (Maleta) */}
                                {(b.alerts || b.photoUrl) && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-sm) var(--space-md)',
                                        color: 'var(--danger)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--space-sm)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                                            <span style={{ fontSize: '1.1rem' }}>🎒</span>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                {b.alerts || 'Maleta adjunta'}
                                            </div>
                                        </div>
                                        {b.photoUrl && (
                                            <div style={{ marginTop: 'var(--space-xs)' }}>
                                                <img
                                                    src={b.photoUrl}
                                                    alt="Foto de la maleta"
                                                    onClick={() => window.open(b.photoUrl, '_blank')}
                                                    style={{
                                                        width: '100%',
                                                        height: 140,
                                                        objectFit: 'cover',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer: Check-in/out info */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-default)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', flex: 1 }}>
                                        {!b.checkedIn && (
                                            <button className="btn btn-primary btn-sm" onClick={() => handleCheckIn(b)}>✅ Marcar Llegada</button>
                                        )}
                                        {b.checkedIn && !b.checkedOut && (
                                            b.paid ? (
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleCheckOut(b)}>🏠 Check-out (Ya pagado)</button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                                                    <button className="btn btn-sm" style={{ backgroundColor: '#00c3a5', color: 'white', border: 'none', flex: 1 }} onClick={() => handleCheckOut(b, 'Bizum')}>
                                                        💸 Bizum
                                                    </button>
                                                    <button className="btn btn-sm" style={{ backgroundColor: '#fbbf24', color: '#78350f', border: 'none', flex: 1 }} onClick={() => handleCheckOut(b, 'Efectivo')}>
                                                        💵 Efectivo
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'var(--space-md)', fontSize: '1.1rem' }}>{b.total}€</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>📅 Próximas llegadas</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>Ver calendario →</button>
                </div>
                {upcomingBookings.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay llegadas próximas en los próximos 7 días
                    </div>
                ) : (
                    upcomingBookings.map(b => (
                        <div key={b.id} className="booking-row" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flex: 1, minWidth: 220 }}>
                                <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={44} />
                                <div>
                                    <div className="booking-dog-name">{b.client?.dogName || 'Desconocido'}</div>
                                    <div className="booking-dates" style={{ marginTop: 2 }}>Llega: {formatDate(b.checkIn)}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-xs)' }}>
                                <span className="badge badge-info" style={{ alignSelf: 'flex-end', marginBottom: 2 }}>Próxima</span>
                                <div className="booking-price">{b.total}€</div>
                                {b.client?.phone && (
                                    <a
                                        href={`https://wa.me/34${b.client.phone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hola ${b.client.ownerName}, te escribo desde Dogets para confirmar la reserva de ${b.client.dogName} el ${formatDate(b.checkIn)}.`)}`}
                                        target="_blank"
                                        rel="noopener"
                                        className="btn btn-ghost btn-sm"
                                        title="Enviar WhatsApp"
                                        style={{ color: '#25D366', padding: '2px 8px', fontSize: '0.8rem' }}
                                    >
                                        📱 WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
