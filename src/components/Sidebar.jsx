import { NavLink } from 'react-router-dom'

const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/clientes', icon: '🐕', label: 'Clientes' },
    { path: '/reservas', icon: '📋', label: 'Reservas' },
    { path: '/calendario', icon: '📅', label: 'Calendario' },
    { path: '/informes', icon: '💰', label: 'Informes' },
]

export default function Sidebar({ isOpen, onClose, googleStatus, onGoogleConnect, onGoogleDisconnect, onLogout }) {
    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99,
                display: 'none'
            }} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Dogets" className="sidebar-logo" />
                    <span className="sidebar-brand">Dogets</span>
                </div>

                <nav className="sidebar-nav">
                    <span className="sidebar-section-label">Principal</span>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            end={item.path === '/'}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <span className="sidebar-section-label" style={{ marginTop: 'var(--space-md)' }}>Integraciones</span>

                    <div style={{ padding: '0 var(--space-md)' }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md)',
                            border: '1px solid var(--border-default)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '1.1rem' }}>📅</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Google Calendar</span>
                            </div>
                            {googleStatus === 'connected' ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Conectado</span>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', fontSize: '0.78rem' }} onClick={onGoogleDisconnect}>
                                        Desconectar
                                    </button>
                                </>
                            ) : googleStatus === 'no-key' ? (
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                    Configura tu Client ID de Google en Informes → Ajustes
                                </p>
                            ) : (
                                <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.78rem' }} onClick={onGoogleConnect}>
                                    Conectar
                                </button>
                            )}
                        </div>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 'var(--space-md)', color: 'var(--danger)', fontSize: '0.8rem' }} onClick={onLogout}>
                        🚪 Cerrar sesión
                    </button>
                    <span style={{ opacity: 0.7 }}>Dogets v2.0</span>
                    <br />
                    <span style={{ fontSize: '0.65rem' }}>Hospedaje Canino</span>
                </div>
            </aside>
        </>
    )
}
