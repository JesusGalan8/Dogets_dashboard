import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/clientes', icon: '🐕', label: 'Clientes' },
    { path: '/reservas', icon: '📋', label: 'Reservas' },
    { path: '/calendario', icon: '📅', label: 'Calendario' },
    { path: '/informes', icon: '💰', label: 'Informes' },
]

export default function Sidebar({ isOpen, onClose, googleStatus, onGoogleConnect, onGoogleDisconnect, onLogout, deferredPrompt, clearPrompt }) {
    const [customLogo, setCustomLogo] = useState(localStorage.getItem('dogets_custom_logo') || '')

    useEffect(() => {
        const handleLogoUpdate = () => {
            setCustomLogo(localStorage.getItem('dogets_custom_logo') || '')
        }
        window.addEventListener('logo-updated', handleLogoUpdate)
        return () => window.removeEventListener('logo-updated', handleLogoUpdate)
    }, [])

    return (
        <>
            {isOpen && <div className="sidebar-backdrop" onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99,
                display: 'none'
            }} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src={customLogo || `${import.meta.env.BASE_URL}logo.jpeg`} alt="Negocio" className="sidebar-logo" style={{ objectFit: 'cover' }} />
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
                                <button 
                                    className="btn" 
                                    style={{ width: '100%', fontSize: '0.85rem', padding: '10px 0', backgroundColor: localStorage.getItem('dogets_wants_google') === 'true' ? 'var(--danger)' : 'var(--amber-500)', color: 'white', border: 'none', fontWeight: 600 }} 
                                    onClick={onGoogleConnect}
                                >
                                    {localStorage.getItem('dogets_wants_google') === 'true' ? '⚠️ Reconectar Google (Sesión caducada)' : '🔗 Conectar Google'}
                                </button>
                            )}
                        </div>

                        {deferredPrompt && (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-md)',
                                border: '1px solid var(--amber-500)',
                                marginTop: 'var(--space-md)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>App Nativa</span>
                                </div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 'var(--space-sm)' }}>
                                    Instala Dogets en tu pantalla de inicio para acceso offline.
                                </p>
                                <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.78rem' }} onClick={async () => {
                                    deferredPrompt.prompt()
                                    const { outcome } = await deferredPrompt.userChoice
                                    if (outcome === 'accepted') {
                                        clearPrompt()
                                    }
                                }}>
                                    Instalar App
                                </button>
                            </div>
                        )}
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
