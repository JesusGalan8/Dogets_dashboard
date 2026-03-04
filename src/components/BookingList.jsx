import { useState, useEffect, useMemo } from 'react'
import { getBookings, getClientById, saveBooking, deleteBooking } from '../utils/storage'
import { downloadBookingICS } from '../utils/icsExport'
import { createCalendarEvents, deleteCalendarEvents, isConnected } from '../utils/googleCalendar'
import { DogAvatar } from '../utils/dogBreeds'
import BookingForm from './BookingForm'

export default function BookingList({ addToast, refreshData, googleStatus }) {
    const [bookings, setBookings] = useState([])
    const [filter, setFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [editBooking, setEditBooking] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)

    useEffect(() => { loadBookings() }, [])

    const loadBookings = () => {
        setBookings(getBookings().map(b => ({
            ...b,
            client: getClientById(b.clientId),
        })))
    }

    const now = useMemo(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d
    }, [])

    const getStatus = (b) => {
        const checkIn = new Date(b.checkIn + 'T00:00:00')
        const checkOut = new Date(b.checkOut + 'T00:00:00')
        if (now >= checkIn && now <= checkOut) return 'active'
        if (checkIn > now) return 'upcoming'
        return 'past'
    }

    const filtered = bookings.filter(b => {
        if (filter === 'all') return true
        return getStatus(b) === filter
    })

    const handleSave = async (data) => {
        const savedBooking = await saveBooking(data)

        // Auto-sync to Google Calendar when connected
        if (isConnected()) {
            const result = await createCalendarEvents(savedBooking)
            if (result) {
                await saveBooking({
                    ...savedBooking,
                    googleArrivalEventId: result.arrivalEventId,
                    googleDepartureEventId: result.departureEventId,
                })
                addToast('📅 Reserva sincronizada con Google Calendar', 'success')
            }
        }

        loadBookings()
        setShowForm(false)
        setEditBooking(null)
        refreshData()
        addToast(data.id ? 'Reserva actualizada' : `Reserva creada · ${data.total}€`, 'success')
    }

    const handleDelete = async (booking) => {
        if (booking.googleArrivalEventId || booking.googleDepartureEventId) {
            await deleteCalendarEvents(booking)
        }
        await deleteBooking(booking.id)
        loadBookings()
        setConfirmDelete(null)
        refreshData()
        addToast('Reserva eliminada', 'warning')
    }

    const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

    const statusLabels = { active: 'Activa', upcoming: 'Próxima', past: 'Finalizada' }
    const statusClass = { active: 'badge-success', upcoming: 'badge-info', past: 'badge-muted' }
    const filters = [
        { key: 'all', label: 'Todas' },
        { key: 'active', label: 'Activas' },
        { key: 'upcoming', label: 'Próximas' },
        { key: 'past', label: 'Pasadas' },
    ]

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📋 Reservas</h1>
                    <p className="page-subtitle">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''} en total</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditBooking(null); setShowForm(true); }}>+ Nueva Reserva</button>
            </div>

            <div className="filter-tabs">
                {filters.map(f => (
                    <button key={f.key} className={`filter-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3 className="empty-state-title">No hay reservas {filter !== 'all' ? `${filters.find(f => f.key === filter)?.label.toLowerCase()}` : ''}</h3>
                </div>
            ) : (
                <div className="card" style={{ overflow: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Perro</th>
                                <th>Dueño</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Noches</th>
                                <th>Tarifa</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(b => {
                                const status = getStatus(b)
                                return (
                                    <tr key={b.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <DogAvatar breed={b.client?.breed} dogId={b.clientId} size={32} />
                                                <strong>{b.client?.dogName || '?'}</strong>
                                            </div>
                                        </td>
                                        <td>{b.client?.ownerName || '-'}</td>
                                        <td>{formatDate(b.checkIn)}</td>
                                        <td>{formatDate(b.checkOut)}</td>
                                        <td>{b.nights || '-'}</td>
                                        <td>{b.rate}€/noche</td>
                                        <td>
                                            <span style={{ color: 'var(--amber-500)', fontWeight: 700 }}>{b.total}€</span>
                                            {parseFloat(b.discount) > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'block' }}>-{b.discount}%</span>}
                                        </td>
                                        <td><span className={`badge ${statusClass[status]}`}>{statusLabels[status]}</span></td>
                                        <td>
                                            <span className={`badge ${b.paid ? 'badge-success' : 'badge-warning'}`}>
                                                {b.paid ? '✅ Pagado' : '⏳ Pendiente'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => { setEditBooking(b); setShowForm(true); }}>✏️</button>
                                                <button className="btn btn-ghost btn-sm" title="Exportar .ics" onClick={() => { downloadBookingICS(b); addToast('Archivo .ics descargado', 'success'); }}>📅</button>
                                                <button className="btn btn-ghost btn-sm" title="Eliminar" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(b)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && <BookingForm booking={editBooking} onSave={handleSave} onClose={() => { setShowForm(false); setEditBooking(null); }} googleStatus={googleStatus} />}

            {confirmDelete && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
                    <div className="modal" style={{ maxWidth: 420 }}>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <div className="confirm-dialog-icon">⚠️</div>
                                <h3 style={{ marginBottom: 'var(--space-sm)' }}>¿Eliminar esta reserva?</h3>
                                <p className="confirm-dialog-text">{confirmDelete.client?.dogName} · {formatDate(confirmDelete.checkIn)} → {formatDate(confirmDelete.checkOut)} · {confirmDelete.total}€</p>
                                <div className="confirm-dialog-actions">
                                    <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Sí, eliminar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
