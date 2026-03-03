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

    const handleCheckOut = (booking) => {
        saveBooking({ ...booking, checkedOut: new Date().toISOString(), client: undefined })
        refreshData()
        addToast(`🏠 ${booking.client?.dogName} se ha ido`, 'success')
        setActiveBookings(getActiveBookings().map(b => ({ ...b, client: getClientById(b.clientId) })))
        setStats(getStats())
    }

    const dailyTasks = ['🌅 Paseo mañana', '🍖 Comida', '🌇 Paseo tarde', '🍗 Cena']

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

            {/* Active Bookings with Check-in/out */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '1.2rem' }}>🏠 Hospedados ahora</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reservas')}>Ver todas →</button>
                </div>
                {activeBookings.length === 0 ? (
                    <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay perros hospedados actualmente
                    </div>
                ) : (
                    activeBookings.map(b => (
                        <div key={b.id} className="booking-row">
                            <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={40} />
                            <div className="booking-dog-name">{b.client?.dogName || 'Desconocido'}</div>
                            <div className="booking-dates">
                                {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                            </div>
                            <span className="badge badge-success">Hospedado</span>
                            <div className="booking-price">{b.total}€</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {!b.checkedIn && (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleCheckIn(b)} title="Marcar llegada">
                                        ✅ Check-in
                                    </button>
                                )}
                                {b.checkedIn && !b.checkedOut && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleCheckOut(b)} title="Marcar salida">
                                        🏠 Check-out
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Daily Checklist */}
            {activeBookings.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>📝 Tareas del día</h2>
                    <div className="card" style={{ padding: 'var(--space-lg)', overflowX: 'auto' }}>
                        <table className="table" style={{ minWidth: 500 }}>
                            <thead>
                                <tr>
                                    <th>Perro</th>
                                    {dailyTasks.map(t => <th key={t} style={{ textAlign: 'center', textTransform: 'none', letterSpacing: 0 }}>{t}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {activeBookings.map(b => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={28} />
                                                {b.client?.dogName}
                                            </div>
                                        </td>
                                        {dailyTasks.map(task => (
                                            <td key={task} style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isTaskDone(b.clientId, task)}
                                                    onChange={() => toggleTask(b.clientId, task)}
                                                    style={{ width: 20, height: 20, accentColor: 'var(--amber-500)', cursor: 'pointer' }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                        <div key={b.id} className="booking-row">
                            <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={40} />
                            <div className="booking-dog-name">{b.client?.dogName || 'Desconocido'}</div>
                            <div className="booking-dates">Llega: {formatDate(b.checkIn)}</div>
                            <span className="badge badge-info">Próxima</span>
                            <div className="booking-price">{b.total}€</div>
                            {b.client?.phone && (
                                <a
                                    href={`https://wa.me/34${b.client.phone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hola ${b.client.ownerName}, te escribo desde Dogets para confirmar la reserva de ${b.client.dogName} el ${formatDate(b.checkIn)}.`)}`}
                                    target="_blank"
                                    rel="noopener"
                                    className="btn btn-ghost btn-sm"
                                    title="Enviar WhatsApp"
                                    style={{ color: '#25D366' }}
                                >
                                    📱 WhatsApp
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
