import { useState, useEffect } from 'react'
import { getClients, saveClient, deleteClient, getBookingsForClient } from '../utils/storage'
import { DogAvatar } from '../utils/dogBreeds'
import ClientForm from './ClientForm'

export default function ClientList({ addToast, refreshData }) {
    const [clients, setClients] = useState([])
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editClient, setEditClient] = useState(null)
    const [selectedClient, setSelectedClient] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)

    useEffect(() => { loadClients() }, [])

    const loadClients = () => {
        const all = getClients().map(c => ({
            ...c,
            stayCount: getBookingsForClient(c.id).length,
        }))
        setClients(all)
    }

    const filtered = clients.filter(c => {
        const q = search.toLowerCase()
        return c.dogName.toLowerCase().includes(q) || c.ownerName.toLowerCase().includes(q) ||
            (c.breed || '').toLowerCase().includes(q) || (c.phone || '').includes(q)
    })

    const handleSave = (data) => {
        saveClient(data)
        loadClients()
        setShowForm(false)
        setEditClient(null)
        refreshData()
        addToast(data.id ? `${data.dogName} actualizado` : `${data.dogName} añadido correctamente`, 'success')
    }

    const handleDelete = (client) => {
        deleteClient(client.id)
        loadClients()
        setConfirmDelete(null)
        setSelectedClient(null)
        refreshData()
        addToast(`${client.dogName} eliminado`, 'warning')
    }

    const handleEdit = (client) => { setEditClient(client); setShowForm(true); setSelectedClient(null) }

    const openWhatsApp = (client) => {
        if (!client.phone) return
        const phone = client.phone.replace(/\s/g, '')
        const msg = encodeURIComponent(`Hola ${client.ownerName}, te escribo desde Dogets respecto a ${client.dogName}.`)
        window.open(`https://wa.me/34${phone}?text=${msg}`, '_blank')
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🐕 Clientes</h1>
                    <p className="page-subtitle">{clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input placeholder="Buscar perro, dueño, raza..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditClient(null); setShowForm(true); }}>+ Nuevo Cliente</button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🐕</div>
                    <h3 className="empty-state-title">{search ? 'Sin resultados' : 'No hay clientes aún'}</h3>
                    <p className="empty-state-text">{search ? 'Prueba con otro término de búsqueda' : 'Añade tu primer cliente para empezar'}</p>
                    {!search && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Añadir primer cliente</button>}
                </div>
            ) : (
                <div className="cards-grid stagger">
                    {filtered.map(client => (
                        <div key={client.id} className="client-card" onClick={() => setSelectedClient(client)}>
                            <div className="client-card-header">
                                <DogAvatar breed={client.breed} dogId={client.id} size={52} />
                                <div className="client-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <span className="client-name">{client.dogName}</span>
                                        {client.stayCount >= 3 && <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>⭐ Habitual</span>}
                                    </div>
                                    <div className="client-breed">{client.breed || 'Sin raza especificada'}</div>
                                </div>
                            </div>
                            <div className="client-card-body">
                                <div className="client-detail"><span className="client-detail-icon">👤</span><span>{client.ownerName}</span></div>
                                {client.phone && <div className="client-detail"><span className="client-detail-icon">📞</span><span>{client.phone}</span></div>}
                                {client.email && <div className="client-detail"><span className="client-detail-icon">📧</span><span>{client.email}</span></div>}
                                {client.stayCount > 0 && <div className="client-detail"><span className="client-detail-icon">📋</span><span>{client.stayCount} estancia{client.stayCount !== 1 ? 's' : ''}</span></div>}
                                {(client.vaccines || client.allergies) && (
                                    <div className="tags-container" style={{ marginTop: 4 }}>
                                        {client.vaccines && client.vaccines.split(',').slice(0, 2).map((v, i) => <span key={i} className="vaccine-tag">💉 {v.trim()}</span>)}
                                        {client.allergies && client.allergies.split(',').slice(0, 2).map((a, i) => <span key={i} className="allergy-tag">⚠️ {a.trim()}</span>)}
                                    </div>
                                )}
                            </div>
                            <div className="client-card-footer">
                                {client.phone && (
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openWhatsApp(client); }} style={{ color: '#25D366' }}>
                                        📱 WhatsApp
                                    </button>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>✏️ Editar</button>
                                <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(client); }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && <ClientForm client={editClient} onSave={handleSave} onClose={() => { setShowForm(false); setEditClient(null) }} />}

            {selectedClient && !showForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedClient(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <DogAvatar breed={selectedClient.breed} dogId={selectedClient.id} size={32} />
                                {selectedClient.dogName}
                                {selectedClient.stayCount >= 3 && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>⭐ Habitual</span>}
                            </h3>
                            <button className="modal-close" onClick={() => setSelectedClient(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-section">
                                    <h4 style={{ color: 'var(--amber-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Perro</h4>
                                    <div className="detail-item"><span className="detail-item-label">Nombre</span><span className="detail-item-value">{selectedClient.dogName}</span></div>
                                    <div className="detail-item"><span className="detail-item-label">Raza</span><span className="detail-item-value">{selectedClient.breed || '-'}</span></div>
                                    <div className="detail-item"><span className="detail-item-label">Edad</span><span className="detail-item-value">{selectedClient.age || '-'}</span></div>
                                    <div className="detail-item"><span className="detail-item-label">Peso</span><span className="detail-item-value">{selectedClient.weight ? `${selectedClient.weight} kg` : '-'}</span></div>
                                </div>
                                <div className="detail-section">
                                    <h4 style={{ color: 'var(--amber-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Dueño</h4>
                                    <div className="detail-item"><span className="detail-item-label">Nombre</span><span className="detail-item-value">{selectedClient.ownerName}</span></div>
                                    <div className="detail-item"><span className="detail-item-label">Teléfono</span><span className="detail-item-value">{selectedClient.phone || '-'}</span></div>
                                    <div className="detail-item"><span className="detail-item-label">Email</span><span className="detail-item-value">{selectedClient.email || '-'}</span></div>
                                </div>
                            </div>
                            {(selectedClient.emergencyName || selectedClient.emergencyPhone) && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <h4 style={{ color: 'var(--danger)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>🚨 Contacto de Emergencia</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedClient.emergencyName} — {selectedClient.emergencyPhone}</p>
                                </div>
                            )}
                            {selectedClient.vaccines && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <h4 style={{ color: 'var(--amber-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>💉 Vacunas</h4>
                                    <div className="tags-container">{selectedClient.vaccines.split(',').map((v, i) => <span key={i} className="vaccine-tag">✅ {v.trim()}</span>)}</div>
                                </div>
                            )}
                            {selectedClient.allergies && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <h4 style={{ color: 'var(--amber-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>⚠️ Alergias</h4>
                                    <div className="tags-container">{selectedClient.allergies.split(',').map((a, i) => <span key={i} className="allergy-tag">⚠️ {a.trim()}</span>)}</div>
                                </div>
                            )}
                            {selectedClient.notes && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <h4 style={{ color: 'var(--amber-500)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>📝 Notas</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedClient.notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedClient(null)}>Cerrar</button>
                            <button className="btn btn-primary" onClick={() => handleEdit(selectedClient)}>✏️ Editar</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
                    <div className="modal" style={{ maxWidth: 420 }}>
                        <div className="modal-body">
                            <div className="confirm-dialog">
                                <div className="confirm-dialog-icon">⚠️</div>
                                <h3 style={{ marginBottom: 'var(--space-sm)' }}>¿Eliminar a {confirmDelete.dogName}?</h3>
                                <p className="confirm-dialog-text">Se eliminarán todos los datos y sus reservas. Esta acción no se puede deshacer.</p>
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
