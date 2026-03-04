import { useState, useMemo } from 'react'
import { getBookings, getClients, getClientById, getMonthlyRevenue } from '../utils/storage'
import { exportFutureBookingsICS } from '../utils/icsExport'
import { exportClientsCSV, exportBookingsCSV } from '../utils/csvExport'
import { getStoredClientId, setStoredClientId, initGapi, initGis } from '../utils/googleCalendar'

export default function Reports({ addToast, onGoogleInit }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [showGoogleSettings, setShowGoogleSettings] = useState(false)
    const [clientId, setClientId] = useState(getStoredClientId())
    const [maxCapacity, setMaxCapacity] = useState(localStorage.getItem('dogets_max_capacity') || '10')

    const bookings = useMemo(() => getBookings(), [selectedYear])

    const yearBookings = useMemo(() => {
        return bookings.filter(b => b.checkIn.startsWith(String(selectedYear)))
    }, [bookings, selectedYear])

    const yearStats = useMemo(() => {
        let totalRevenue = 0, totalNights = 0, paidCount = 0, unpaidAmount = 0
        yearBookings.forEach(b => {
            totalRevenue += b.total || 0
            totalNights += b.nights || 0
            if (b.paid) paidCount++
            else unpaidAmount += b.total || 0
        })
        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalBookings: yearBookings.length,
            totalNights,
            avgPerBooking: yearBookings.length ? Math.round(totalRevenue / yearBookings.length) : 0,
            paidCount,
            unpaidCount: yearBookings.length - paidCount,
            unpaidAmount: Math.round(unpaidAmount * 100) / 100,
        }
    }, [yearBookings])

    const monthlyData = useMemo(() => {
        const months = []
        for (let i = 0; i < 12; i++) {
            const m = String(i + 1).padStart(2, '0')
            const prefix = `${selectedYear}-${m}`
            let sum = 0
            yearBookings.forEach(b => {
                if (b.checkIn.startsWith(prefix)) sum += b.total || 0
            })
            months.push({ month: i, revenue: Math.round(sum * 100) / 100 })
        }
        return months
    }, [yearBookings, selectedYear])

    const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1)
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    const unpaidBookings = useMemo(() => {
        return yearBookings.filter(b => !b.paid).map(b => ({ ...b, client: getClientById(b.clientId) }))
    }, [yearBookings])

    const handleSaveGoogleSettings = () => {
        setStoredClientId(clientId)
        localStorage.setItem('dogets_max_capacity', maxCapacity)
        onGoogleInit?.()
        setShowGoogleSettings(false)
        addToast('Ajustes guardados correctamente', 'success')
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💰 Informes</h1>
                    <p className="page-subtitle">Informes financieros y exportación de datos</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                    <select className="form-input" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{ width: 'auto' }}>
                        {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="btn btn-secondary" onClick={() => setShowGoogleSettings(true)}>⚙️ Ajustes</button>
                </div>
            </div>

            <div className="stats-grid stagger">
                <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">{yearStats.totalRevenue}€</span>
                    <span className="stat-label">Ingresos {selectedYear}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📋</span>
                    <span className="stat-value">{yearStats.totalBookings}</span>
                    <span className="stat-label">Reservas</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🌙</span>
                    <span className="stat-value">{yearStats.totalNights}</span>
                    <span className="stat-label">Noches</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📊</span>
                    <span className="stat-value">{yearStats.avgPerBooking}€</span>
                    <span className="stat-label">Media por reserva</span>
                </div>
            </div>

            {/* Monthly revenue chart */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem' }}>📊 Ingresos mensuales</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-xs)', height: 200 }}>
                    {monthlyData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {d.revenue > 0 ? `${d.revenue}€` : ''}
                            </span>
                            <div style={{
                                width: '100%', maxWidth: 40,
                                height: `${Math.max(4, (d.revenue / maxRevenue) * 160)}px`,
                                background: d.revenue > 0 ? 'linear-gradient(to top, var(--amber-600), var(--amber-500))' : 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'height 0.5s ease',
                            }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{monthLabels[i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment status + Export */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>💳 Estado de pagos</h3>
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{yearStats.paidCount}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pagadas</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{yearStats.unpaidCount}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pendientes</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{yearStats.unpaidAmount}€</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Por cobrar</div>
                        </div>
                    </div>
                    {unpaidBookings.length > 0 && (
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {unpaidBookings.slice(0, 5).map(b => (
                                <div key={b.id} className="booking-row" style={{ padding: 'var(--space-sm)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.client?.dogName || '?'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.checkIn} → {b.checkOut}</div>
                                    </div>
                                    <span style={{ color: 'var(--amber-500)', fontWeight: 700 }}>{b.total}€</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>📤 Exportar datos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <button className="btn btn-secondary" onClick={() => { exportClientsCSV(); addToast('Clientes exportados a CSV', 'success') }}>
                            📄 Exportar clientes (CSV)
                        </button>
                        <button className="btn btn-secondary" onClick={() => { exportBookingsCSV(); addToast('Reservas exportadas a CSV', 'success') }}>
                            📄 Exportar reservas (CSV)
                        </button>
                        <button className="btn btn-secondary" onClick={() => { exportFutureBookingsICS(); addToast('Calendario .ics exportado', 'success') }}>
                            📅 Exportar calendario (ICS)
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showGoogleSettings && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowGoogleSettings(false)}>
                    <div className="modal" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">⚙️ Ajustes</h3>
                            <button className="modal-close" onClick={() => setShowGoogleSettings(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-section-title">📅 Google Calendar</div>
                            <div className="form-group">
                                <label className="form-label">Client ID de OAuth2</label>
                                <input className="form-input" value={clientId} onChange={(e) => setClientId(e.target.value)}
                                    placeholder="xxxx.apps.googleusercontent.com" />
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                    Para obtener tu Client ID:
                                    <br />1. Ve a <a href="https://console.cloud.google.com" target="_blank" rel="noopener" style={{ color: 'var(--amber-500)' }}>Google Cloud Console</a>
                                    <br />2. Crea un proyecto y activa la API de Google Calendar
                                    <br />3. En Credenciales → OAuth 2.0 → Crear credencial web
                                    <br />4. Añade <code>http://localhost:5173</code> como origen autorizado
                                    <br />5. Copia el Client ID aquí
                                </p>
                            </div>

                            <div className="form-section-title" style={{ marginTop: 'var(--space-lg)' }}>🐕 Negocio</div>
                            <div className="form-group">
                                <label className="form-label">Capacidad máxima de perros</label>
                                <input className="form-input" type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)}
                                    min="1" max="100" style={{ width: 100 }} />
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Número máximo de perros que puedes alojar simultáneamente
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowGoogleSettings(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveGoogleSettings}>Guardar ajustes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
