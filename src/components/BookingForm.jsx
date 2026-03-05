import { useState, useMemo, useRef } from 'react'
import { getClients } from '../utils/storage'
import { storage } from '../utils/firebase'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'

export default function BookingForm({ booking, onSave, onClose, googleStatus }) {
    const clients = useMemo(() => getClients(), [])
    const [form, setForm] = useState({
        clientId: '',
        checkIn: '',
        checkInTime: '',
        checkOut: '',
        checkOutTime: '',
        rate: 15,
        paid: false,
        paymentMethod: booking?.paymentMethod || 'cash',
        notes: '',
        alerts: '',
        photoUrl: '',
        discount: 0,
        customTotal: '',
        useCustomTotal: false,
        syncGoogle: googleStatus === 'connected',
        ...booking,
    })

    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef(null)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Compress image on the client (Canvas to WebP) to save bandwidth & space
            const image = new Image()
            image.src = URL.createObjectURL(file)
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(new Error("Formato de imagen no soportado por el navegador"));
            })

            const canvas = document.createElement('canvas')
            let { width, height } = image
            const MAX_SIZE = 800
            if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width
                width = MAX_SIZE
            } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height
                height = MAX_SIZE
            }
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(image, 0, 0, width, height)
            const webpDataUrl = canvas.toDataURL('image/webp', 0.8)

            // Upload to Firebase Storage
            const fileName = `maletas/photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`
            const storageRef = ref(storage, fileName)
            await uploadString(storageRef, webpDataUrl, 'data_url')

            const downloadUrl = await getDownloadURL(storageRef)
            setForm(prev => ({ ...prev, photoUrl: downloadUrl }))
        } catch (error) {
            console.error("Error uploading photo:", error)
            alert("Error al subir la foto. Comprueba tu conexión.")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
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
            paymentMethod: form.paid ? form.paymentMethod : null,
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
                                <label className="form-label">Entrada *</label>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                    <input className="form-input" type="date" name="checkIn" value={form.checkIn} onChange={handleChange} required style={{ flex: 1 }} />
                                    <input className="form-input" type="time" name="checkInTime" value={form.checkInTime || ''} onChange={handleChange} title="Hora de llegada" style={{ width: 100 }} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Salida *</label>
                                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                    <input className="form-input" type="date" name="checkOut" value={form.checkOut} onChange={handleChange} required style={{ flex: 1 }} />
                                    <input className="form-input" type="time" name="checkOutTime" value={form.checkOutTime || ''} onChange={handleChange} title="Hora de salida" style={{ width: 100 }} />
                                </div>
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

                        <div className="form-section-title" style={{ marginTop: 'var(--space-lg)', color: 'var(--amber-500)' }}>💳 Cobro y Pagos</div>
                        <div className="form-group" style={{
                            marginTop: 'var(--space-xs)',
                            background: form.paid ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
                            border: `1px solid ${form.paid ? 'var(--success)' : 'var(--border-strong)'}`,
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all var(--transition-fast)'
                        }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer', fontWeight: 600 }}>
                                <input type="checkbox" name="paid" checked={form.paid} onChange={handleChange}
                                    style={{ width: 22, height: 22, accentColor: 'var(--success)' }} />
                                <span style={{ fontSize: '1.05rem', color: form.paid ? 'var(--success)' : 'var(--text-primary)' }}>
                                    {form.paid ? 'Reserva Pagada' : 'Marcar como Pagado'}
                                </span>
                            </label>

                            {form.paid && (
                                <div style={{
                                    marginTop: 'var(--space-md)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid rgba(34, 197, 94, 0.2)',
                                    display: 'flex',
                                    gap: 'var(--space-lg)'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Método:</span>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer', fontSize: '1rem', fontWeight: form.paymentMethod === 'cash' ? 700 : 400 }}>
                                        <input type="radio" name="paymentMethod" value="cash"
                                            checked={form.paymentMethod === 'cash'}
                                            onChange={handleChange}
                                            style={{ accentColor: 'var(--success)' }} />
                                        <span>💵 Efectivo</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer', fontSize: '1rem', fontWeight: form.paymentMethod === 'bizum' ? 700 : 400 }}>
                                        <input type="radio" name="paymentMethod" value="bizum"
                                            checked={form.paymentMethod === 'bizum'}
                                            onChange={handleChange}
                                            style={{ accentColor: 'var(--success)' }} />
                                        <span>📱 Bizum</span>
                                    </label>
                                </div>
                            )}
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

                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />

                                {form.photoUrl ? (
                                    <div style={{ position: 'relative', display: 'inline-block', marginTop: 'var(--space-sm)' }}>
                                        <img src={form.photoUrl} alt="Maleta" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-default)' }} />
                                        <button type="button" onClick={() => setForm(prev => ({ ...prev, photoUrl: '' }))}
                                            style={{ position: 'absolute', top: -8, right: -8, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" className="btn btn-secondary w-full" onClick={() => fileInputRef.current.click()} disabled={isUploading}
                                        style={{ justifyContent: 'center', gap: 'var(--space-sm)', borderStyle: 'dashed' }}>
                                        <span style={{ fontSize: '1.2rem' }}>📷</span>
                                        {isUploading ? 'Fotografiando / Subiendo...' : 'Añadir Foto de la Maleta'}
                                    </button>
                                )}
                            </div>
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
