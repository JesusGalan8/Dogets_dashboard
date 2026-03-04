import { useState, useMemo, useEffect } from 'react'
import { getClients } from '../utils/storage'

export default function BookingForm({ booking, onSave, onClose, googleStatus }) {
    const clients = useMemo(() => getClients(), [])
    const [form, setForm] = useState({
        clientId: '',
        checkIn: '',
        checkOut: '',
        rate: 15,
        paid: false,
        notes: '',
        alerts: '',
        discount: 0,
        customTotal: '',
        useCustomTotal: false,
        syncGoogle: googleStatus === 'connected',
        ...booking,
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const nights = useMemo(() => {
        if (!form.checkIn || !form.checkOut) return 0
        const diff = new Date(form.checkOut + 'T00:00:00') - new Date(form.checkIn + 'T00:00:00')
        return Math.floor(diff / 86400000)
    }, [form.checkIn, form.checkOut])

    const calcTotal = useMemo(() => {
        const units = Math.max(1, nights)
        const base = units * form.rate
        const disc = Math.max(0, Math.min(100, parseFloat(form.discount) || 0))
        return Math.round(base * (1 - disc / 100) * 100) / 100
    }, [nights, form.rate, form.discount])

    const finalTotal = form.useCustomTotal && form.customTotal !== '' ? parseFloat(form.customTotal) : calcTotal

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.clientId || !form.checkIn || !form.checkOut || nights < 0) return
        onSave({
            ...form,
            nights,
            total: finalTotal,
            customTotal: form.useCustomTotal ? form.customTotal : '',
            syncGoogle: form.syncGoogle,
        })
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{booking?.id ? '✏️ Editar Reserva' : '📋 Nueva Reserva'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Perro *</label>
                            <select className="form-input" name="clientId" value={form.clientId} onChange={handleChange} required>
                                <option value="">Seleccionar perro...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.dogName} — {c.ownerName}</option>)}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Fecha entrada *</label>
                                <input className="form-input" type="date" name="checkIn" value={form.checkIn} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha salida *</label>
                                <input className="form-input" type="date" name="checkOut" value={form.checkOut} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tarifa por noche</label>
                            <div className="rate-selector">
                                <button type="button" className={`rate-option ${form.rate === 15 ? 'active' : ''}`}
                                    onClick={() => setForm(prev => ({ ...prev, rate: 15 }))}>
                                    <div className="rate-amount">15€</div>
                                    <div className="rate-label">Estándar</div>
                                </button>
                                <button type="button" className={`rate-option ${form.rate === 18 ? 'active' : ''}`}
                                    onClick={() => setForm(prev => ({ ...prev, rate: 18 }))}>
                                    <div className="rate-amount">18€</div>
                                    <div className="rate-label">Premium</div>
                                </button>
                            </div>
                        </div>

                        {/* Price calculation */}
                        {nights >= 0 && (
                            <div className="pricing-summary">
                                <div className="pricing-row">
                                    <span>{nights === 0 ? 'Guardería (Día)' : `${nights} noche${nights !== 1 ? 's' : ''}`} × {form.rate}€</span>
                                    <span>{Math.max(1, nights) * form.rate}€</span>
                                </div>

                                {/* Manual discount field */}
                                <div className="pricing-row" style={{ alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                                        Descuento (%)
                                    </label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        name="discount"
                                        value={form.discount}
                                        onChange={handleChange}
                                        min="0" max="100" step="1"
                                        style={{ width: 80, textAlign: 'center' }}
                                    />
                                </div>

                                {parseFloat(form.discount) > 0 && (
                                    <div className="pricing-row" style={{ color: 'var(--success)' }}>
                                        <span>Descuento {form.discount}%</span>
                                        <span>-{Math.round(Math.max(1, nights) * form.rate * (form.discount / 100) * 100) / 100}€</span>
                                    </div>
                                )}

                                <div className="pricing-total">
                                    <span>Total calculado</span>
                                    <span>{calcTotal}€</span>
                                </div>

                                {/* Custom total override */}
                                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" name="useCustomTotal" checked={form.useCustomTotal} onChange={handleChange}
                                            style={{ accentColor: 'var(--amber-500)' }} />
                                        <span>Usar precio personalizado</span>
                                    </label>
                                    {form.useCustomTotal && (
                                        <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            <input className="form-input" type="number" name="customTotal" value={form.customTotal}
                                                onChange={handleChange} placeholder="Precio total..." step="0.01" min="0"
                                                style={{ width: 140, textAlign: 'center', fontWeight: 600 }} autoFocus />
                                            <span style={{ fontSize: '1.1rem' }}>€</span>
                                        </div>
                                    )}
                                </div>

                                {form.useCustomTotal && form.customTotal !== '' && (
                                    <div className="pricing-total" style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' }}>
                                        <span style={{ fontWeight: 700 }}>💰 Total final</span>
                                        <span style={{ fontSize: '1.3rem' }}>{finalTotal}€</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment */}
                        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }}>
                                <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange}
                                    style={{ width: 20, height: 20, accentColor: 'var(--amber-500)' }} />
                                <span>✅ Marcado como pagado</span>
                                <span className={`badge ${form.paid ? 'badge-success' : 'badge-warning'}`}>
                                    {form.paid ? 'Pagado' : 'Pendiente'}
                                </span>
                            </label>
                        </div>

                        {/* Google Calendar sync */}
                        {googleStatus === 'connected' && (
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }}>
                                    <input type="checkbox" name="syncGoogle" checked={form.syncGoogle} onChange={handleChange}
                                        style={{ width: 20, height: 20, accentColor: 'var(--amber-500)' }} />
                                    <span>📅 Sincronizar con Google Calendar</span>
                                </label>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--danger)', fontWeight: 600 }}>🎒 Avisos / Maleta (Opcional)</label>
                            <textarea className="form-input" name="alerts" value={form.alerts} onChange={handleChange}
                                placeholder="Ej: Alergia al pollo, medicación a las 20:00, trae su propia cama..." rows={2}
                                style={{ borderColor: form.alerts ? 'var(--danger)' : 'var(--border-default)', background: form.alerts ? 'rgba(239, 68, 68, 0.05)' : '' }} />
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                            <label className="form-label">📝 Notas Internas</label>
                            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange}
                                placeholder="Observaciones de facturación o internas..." rows={2} />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={!form.clientId || nights < 0}>
                            {booking?.id ? 'Guardar cambios' : 'Crear reserva'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
