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
        medications: [],
        notes: '',
        feedingNotes: '',
        behaviorTags: '',
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

                        {/* MEDICATIONS SECTION */}
                        <div className="form-group" style={{ background: 'var(--bg-elevated)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                            <label className="form-label" style={{ marginBottom: 'var(--space-sm)', display: 'block', fontSize: '1rem', fontWeight: 600 }}>Pautas de Medicación</label>

                            {form.medications?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                    {form.medications.map((med, idx) => (
                                        <div key={idx} style={{ background: 'var(--bg-card)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', position: 'relative', border: '1px solid var(--border-default)' }}>
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== idx) }))}
                                                style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                                                title="Eliminar medicación"
                                            >✕</button>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{med.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Del {new Date(med.startDate).toLocaleDateString()} al {new Date(med.endDate).toLocaleDateString()}</div>
                                            {med.times && <div style={{ fontSize: '0.85rem' }}>⏰ Horas: {med.times}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <input id="newMedName" type="text" className="form-input" placeholder="Nombre del medicamento" />
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inicio</label>
                                        <input id="newMedStart" type="date" className="form-input" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fin</label>
                                        <input id="newMedEnd" type="date" className="form-input" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Horario (Opcional, separadas por coma)</label>
                                    <input id="newMedTimes" type="text" className="form-input" placeholder="Ej: 08:00, 20:00" />
                                </div>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                                    const name = document.getElementById('newMedName').value;
                                    const startDate = document.getElementById('newMedStart').value;
                                    const endDate = document.getElementById('newMedEnd').value;
                                    const times = document.getElementById('newMedTimes').value;
                                    if (!name || !startDate || !endDate) {
                                        alert('Rellena nombre, fecha inicio y fecha fin para el medicamento.');
                                        return;
                                    }
                                    setForm(prev => ({
                                        ...prev,
                                        medications: [...(prev.medications || []), { id: Date.now().toString(), name, startDate, endDate, times }]
                                    }));
                                    document.getElementById('newMedName').value = '';
                                    document.getElementById('newMedStart').value = '';
                                    document.getElementById('newMedEnd').value = '';
                                    document.getElementById('newMedTimes').value = '';
                                }}>+ Añadir pauta médica</button>
                            </div>
                        </div>

                        <div className="form-section-title">🦴 Comportamiento y Alimentación</div>

                        <div className="form-group">
                            <label className="form-label">Instrucciones de Alimentación</label>
                            <textarea className="form-textarea" name="feedingNotes" value={form.feedingNotes} onChange={handleChange} placeholder="Ej: 2 cazos por la mañana secos, 1 cazo por la noche con un poco de agua caliente" rows={2} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Etiquetas de Comportamiento (separar con comas)</label>
                            <input className="form-input" name="behaviorTags" value={form.behaviorTags} onChange={handleChange} placeholder="Ej: Dominante, Miedoso a petardos, Sociable, Se escapa..." />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notas adicionales</label>
                            <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Necesidades especiales, medicación, etc..." rows={2} />
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
