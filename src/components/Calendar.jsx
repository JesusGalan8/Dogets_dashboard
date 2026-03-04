import { useState, useMemo } from 'react'
import { getBookings, getClientById, saveBooking } from '../utils/storage'
import { getDogColor } from '../utils/dogBreeds'
import BookingForm from './BookingForm'

export default function Calendar({ addToast, refreshData, googleStatus }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState(null)
    const [showBookingForm, setShowBookingForm] = useState(false)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        let startDow = firstDay.getDay() - 1
        if (startDow < 0) startDow = 6

        const days = []
        for (let i = startDow - 1; i >= 0; i--) {
            const d = new Date(year, month, -i)
            days.push({ date: d, otherMonth: true })
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), otherMonth: false })
        }
        const remaining = 7 - (days.length % 7)
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                days.push({ date: new Date(year, month + 1, i), otherMonth: true })
            }
        }
        return days
    }, [year, month])

    const bookings = useMemo(() => {
        return getBookings().map(b => ({
            ...b,
            client: getClientById(b.clientId),
        }))
    }, [year, month])

    // Get unique dogs in current view for the legend
    const activeDogs = useMemo(() => {
        const seen = new Map()
        bookings.forEach(b => {
            if (b.client && !seen.has(b.clientId)) {
                seen.set(b.clientId, { id: b.clientId, name: b.client.dogName, breed: b.client.breed, color: getDogColor(b.clientId) })
            }
        })
        return Array.from(seen.values())
    }, [bookings])

    const toLocalDateStr = (d) => {
        const yr = d.getFullYear()
        const mo = String(d.getMonth() + 1).padStart(2, '0')
        const dy = String(d.getDate()).padStart(2, '0')
        return `${yr}-${mo}-${dy}`
    }

    const getEventsForDay = (date) => {
        const dayStr = toLocalDateStr(date)
        const events = []

        bookings.forEach(b => {
            const checkIn = b.checkIn
            const checkOut = b.checkOut
            const checkInDate = new Date(checkIn + 'T00:00:00')
            const checkOutDate = new Date(checkOut + 'T00:00:00')
            const current = new Date(date)
            current.setHours(0, 0, 0, 0)
            const dogColor = getDogColor(b.clientId)

            if (checkIn === dayStr) {
                events.push({ type: 'arrival', booking: b, label: `↘ ${b.client?.dogName || '?'}`, color: dogColor })
            } else if (checkOut === dayStr) {
                events.push({ type: 'departure', booking: b, label: `↗ ${b.client?.dogName || '?'}`, color: dogColor })
            } else if (current > checkInDate && current < checkOutDate) {
                events.push({ type: 'staying', booking: b, label: `• ${b.client?.dogName || '?'}`, color: dogColor })
            }
        })

        return events
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isToday = (date) => {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const goToday = () => setCurrentDate(new Date())

    const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📅 Calendario</h1>
                    <p className="page-subtitle">Vista de llegadas y salidas</p>
                </div>
                <button className="btn btn-secondary" onClick={goToday}>Hoy</button>
            </div>

            <div className="calendar-container">
                <div className="calendar-header">
                    <button className="btn btn-ghost btn-icon" onClick={prevMonth}>◀</button>
                    <span className="calendar-month-title">{monthNames[month]} {year}</span>
                    <button className="btn btn-ghost btn-icon" onClick={nextMonth}>▶</button>
                </div>

                <div className="calendar-grid">
                    {dayNames.map(d => (
                        <div key={d} className="calendar-day-header">{d}</div>
                    ))}

                    {calendarDays.map((day, i) => {
                        const events = getEventsForDay(day.date)
                        return (
                            <div
                                key={i}
                                className={`calendar-day ${day.otherMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''} ${selectedDay && toLocalDateStr(selectedDay) === toLocalDateStr(day.date) ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedDay(day.date)
                                    if (!day.otherMonth) {
                                        setShowBookingForm(true)
                                    }
                                }}
                            >
                                <span className="day-number">{day.date.getDate()}</span>
                                {events.slice(0, 3).map((ev, j) => (
                                    <div key={j}
                                        className="calendar-event"
                                        style={{
                                            background: ev.color.bg,
                                            borderLeft: `3px solid ${ev.color.border}`,
                                            color: ev.color.text,
                                        }}
                                    >
                                        {ev.label}
                                    </div>
                                ))}
                                {events.length > 3 && (
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        +{events.length - 3} más
                                    </div>
                                )}
                                <span className="calendar-day-plus">+</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Day Detail */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: '1.3rem' }}>📅</span>
                        <h3 style={{ fontSize: '1.1rem', flex: 1 }}>
                            {selectedDay
                                ? selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                : 'Selecciona un día para ver el detalle'
                            }
                        </h3>
                        {selectedDay && (
                            <button className="btn btn-primary btn-sm" onClick={() => setShowBookingForm(true)}>➕ Nueva Reserva</button>
                        )}
                    </div>

                    {!selectedDay ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Haz click en un día del calendario para ver las llegadas y salidas</p>
                    ) : selectedDayEvents.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay eventos para este día</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {selectedDayEvents.map((ev, i) => (
                                <div key={i} className="booking-row" style={{ borderLeft: `4px solid ${ev.color.border}` }}>
                                    <span style={{ fontSize: '1.2rem' }}>
                                        {ev.type === 'arrival' ? '🟢' : ev.type === 'departure' ? '🔴' : '🔵'}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: ev.color.text }}>{ev.booking.client?.dogName || 'Desconocido'}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {ev.type === 'arrival' ? 'Llegada' : ev.type === 'departure' ? 'Salida' : 'Hospedado'} ·
                                            Dueño: {ev.booking.client?.ownerName || '-'} ·
                                            {ev.booking.client?.phone ? ` Tel: ${ev.booking.client.phone}` : ''}
                                            {ev.booking.client?.emergencyName && ` · 🚨 Emergencia: ${ev.booking.client.emergencyName} (${ev.booking.client.emergencyPhone || '-'})`}
                                        </div>
                                    </div>
                                    <span className={`badge`} style={{ background: ev.color.bg, color: ev.color.text, border: `1px solid ${ev.color.border}` }}>
                                        {ev.type === 'arrival' ? '↘ Llegada' : ev.type === 'departure' ? '↗ Salida' : '• Hospedado'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Dog Color Legend */}
            {activeDogs.length > 0 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', textAlign: 'center' }}>Leyenda de colores</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {activeDogs.map(dog => (
                            <div key={dog.id} style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                                fontSize: '0.82rem', color: dog.color.text,
                                background: dog.color.bg, border: `1px solid ${dog.color.border}`,
                                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                            }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dog.color.border }} />
                                {dog.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Event type legend */}
            <div style={{ display: 'flex', gap: 'var(--space-xl)', marginTop: 'var(--space-md)', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    🟢 Llegada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    🔵 Hospedado
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    🔴 Salida
                </div>
            </div>

            {showBookingForm && selectedDay && (
                <BookingForm
                    booking={{ checkIn: toLocalDateStr(selectedDay) }}
                    onSave={async (data) => {
                        await saveBooking({ id: Date.now().toString(), ...data })
                        if (refreshData) refreshData()
                        setShowBookingForm(false)
                        addToast(`Reserva creada para el ${toLocalDateStr(selectedDay)}`, 'success')
                    }}
                    onClose={() => setShowBookingForm(false)}
                    googleStatus={googleStatus}
                />
            )}
        </div>
    )
}
