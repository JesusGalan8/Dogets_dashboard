import { useState } from 'react'

export default function Login({ onLogin, addToast }) {
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        // A simple hardcoded password for the single-user business
        if (password === 'dogets123') {
            localStorage.setItem('dogets_auth', 'true')
            onLogin()
            addToast('¡Bienvenido o bienvenida a Dogets!', 'success')
        } else {
            addToast('Contraseña incorrecta', 'error')
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-lg)'
        }}>
            <form className="card animate-in" style={{ width: '100%', maxWidth: 400 }} onSubmit={handleSubmit}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    <img src={`${import.meta.env.BASE_URL}logo.jpeg`} alt="Dogets Logo" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover', marginBottom: 'var(--space-md)' }} />
                    <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Acceso a Dogets</h1>
                    <p className="page-subtitle">Introduce la clave para continuar</p>
                </div>

                <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                    <input
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña..."
                        autoFocus
                    />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Entrar
                </button>
            </form>
        </div>
    )
}
