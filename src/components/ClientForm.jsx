import { useState } from 'react'

export default function ClientForm({ client, onSave, onClose }) {
    const [form, setForm] = useState({
        dogName: '',
        breed: '',
        age: '',
        weight: '',
        ownerName: '',
        phone: '',
        email: '',
        allergies: '',
        vaccines: '',
        notes: '',
        emergencyName: '',
        emergencyPhone: '',
        ...client,
    })

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.dogName.trim() || !form.ownerName.trim()) return
        onSave(form)
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {client?.id ? '✏️ Editar Cliente' : '🐕 Nuevo Cliente'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-section-title">🐕 Datos del Perro</div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nombre del perro *</label>
                                <input className="form-input" name="dogName" value={form.dogName} onChange={handleChange} placeholder="Ej: Max" required autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Raza</label>
                                <input className="form-input" name="breed" value={form.breed} onChange={handleChange} placeholder="Ej: Labrador, Golden..." />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Edad</label>
                                <input className="form-input" name="age" value={form.age} onChange={handleChange} placeholder="Ej: 3 años" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Peso (kg)</label>
                                <input className="form-input" name="weight" type="number" step="0.1" value={form.weight} onChange={handleChange} placeholder="Ej: 25" />
                            </div>
                        </div>

                        <div className="form-section-title">👤 Datos del Dueño</div>

                        <div className="form-group">
                            <label className="form-label">Nombre del dueño *</label>
                            <input className="form-input" name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Ej: Juan García" required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input className="form-input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Ej: 612 345 678" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Ej: juan@email.com" />
                            </div>
                        </div>

                        <div className="form-section-title">🚨 Contacto de Emergencia</div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nombre contacto</label>
                                <input className="form-input" name="emergencyName" value={form.emergencyName} onChange={handleChange} placeholder="Ej: Ana García" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono emergencia</label>
                                <input className="form-input" name="emergencyPhone" type="tel" value={form.emergencyPhone} onChange={handleChange} placeholder="Ej: 698 765 432" />
                            </div>
                        </div>

                        <div className="form-section-title">🏥 Salud</div>

                        <div className="form-group">
                            <label className="form-label">Vacunas (separar con comas)</label>
                            <input className="form-input" name="vaccines" value={form.vaccines} onChange={handleChange} placeholder="Ej: Rabia, Moquillo, Parvovirus" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Alergias (separar con comas)</label>
                            <input className="form-input" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Ej: Pollo, Maíz" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notas adicionales</label>
                            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Comportamiento, necesidades especiales, medicación..." rows={3} />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            {client?.id ? 'Guardar cambios' : 'Crear cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
