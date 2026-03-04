import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ClientList from './components/ClientList'
import BookingList from './components/BookingList'
import Calendar from './components/Calendar'
import Reports from './components/Reports'
import Toast from './components/Toast'
import Login from './components/Login'
import { requestNotificationPermission, startNotificationChecker } from './utils/notifications'
import { initGapi, initGis, isConnected, signIn, signOut, getStoredClientId } from './utils/googleCalendar'
import { initStorageSync } from './utils/storage'

export default function App() {
    const [toasts, setToasts] = useState([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dataVersion, setDataVersion] = useState(0)
    const [googleStatus, setGoogleStatus] = useState('no-key') // no-key, disconnected, connected
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('dogets_auth') === 'true')
    const [isSyncing, setIsSyncing] = useState(true)
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const location = useLocation()

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    useEffect(() => {
        const updateFavicon = () => {
            const customLogo = localStorage.getItem('dogets_custom_logo')
            if (customLogo) {
                const icon = document.querySelector('link[rel="icon"]')
                if (icon) icon.href = customLogo

                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')
                if (appleIcon) appleIcon.href = customLogo
            } else {
                // Restore defaults if removed
                const base = import.meta.env.BASE_URL || '/'
                const icon = document.querySelector('link[rel="icon"]')
                if (icon) icon.href = `${base}dogets-icon.svg`

                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]')
                if (appleIcon) appleIcon.href = `${base}logo.jpeg`
            }
        }
        updateFavicon()
        window.addEventListener('logo-updated', updateFavicon)

        return () => window.removeEventListener('logo-updated', updateFavicon)
    }, [])

    useEffect(() => {
        setSidebarOpen(false)
    }, [location])

    useEffect(() => {
        requestNotificationPermission()
        startNotificationChecker()
        initializeGoogle()

        // Safety timeout: if Firebase doesn't respond in 5s, show app anyway
        const timeout = setTimeout(() => {
            setIsSyncing(false)
        }, 5000)

        initStorageSync(() => {
            clearTimeout(timeout)
            setIsSyncing(false)
            setDataVersion(v => v + 1)
        }).catch((err) => {
            console.error("Firebase sync failed:", err)
            clearTimeout(timeout)
            setIsSyncing(false)
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const initializeGoogle = async () => {
        const clientId = getStoredClientId()
        if (!clientId) {
            setGoogleStatus('no-key')
            return
        }

        const gapiReady = await initGapi()
        if (gapiReady) {
            initGis((status) => {
                setGoogleStatus(status)
            })
            setGoogleStatus(isConnected() ? 'connected' : 'disconnected')
        } else {
            setGoogleStatus('disconnected')
        }
    }

    const handleGoogleConnect = () => {
        const clientId = getStoredClientId()
        if (!clientId) {
            addToast('Primero configura tu Client ID de Google en Informes → Ajustes', 'warning')
            return
        }
        signIn()
    }

    const handleGoogleDisconnect = () => {
        signOut()
        setGoogleStatus('disconnected')
        addToast('Google Calendar desconectado', 'info')
    }

    const refreshData = useCallback(() => {
        setDataVersion(v => v + 1)
    }, [])

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    if (!isAuthenticated) {
        return (
            <>
                <Login onLogin={() => setIsAuthenticated(true)} addToast={addToast} />
                <div className="toast-container">
                    {toasts.map(toast => (
                        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </div>
            </>
        )
    }

    if (isSyncing) {
        const customLogo = localStorage.getItem('dogets_custom_logo') || `${import.meta.env.BASE_URL}logo.jpeg`
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
                <img src={customLogo} alt="Dogets" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} className="animate-pulse" />
                <h2 style={{ color: 'var(--text-secondary)' }}>Sincronizando la nube...</h2>
            </div>
        )
    }

    return (
        <div className="app-layout">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                googleStatus={googleStatus}
                onGoogleConnect={handleGoogleConnect}
                onGoogleDisconnect={handleGoogleDisconnect}
                onLogout={() => {
                    localStorage.removeItem('dogets_auth')
                    setIsAuthenticated(false)
                    addToast('Sesión cerrada', 'info')
                }}
                deferredPrompt={deferredPrompt}
                clearPrompt={() => setDeferredPrompt(null)}
            />

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<Dashboard key={dataVersion} addToast={addToast} refreshData={refreshData} />} />
                    <Route path="/clientes" element={<ClientList key={dataVersion} addToast={addToast} refreshData={refreshData} />} />
                    <Route path="/reservas" element={<BookingList key={dataVersion} addToast={addToast} refreshData={refreshData} googleStatus={googleStatus} />} />
                    <Route path="/calendario" element={<Calendar key={dataVersion} addToast={addToast} refreshData={refreshData} googleStatus={googleStatus} />} />
                    <Route path="/informes" element={<Reports key={dataVersion} addToast={addToast} onGoogleInit={initializeGoogle} />} />
                </Routes>
            </main>

            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Menú"
            >
                ☰
            </button>

            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </div>
    )
}
