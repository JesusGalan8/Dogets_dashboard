export default function Toast({ message, type, onClose }) {
    return (
        <div className={`toast toast-${type}`}>
            <span style={{ fontSize: '1.1rem' }}>
                {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>✕</button>
        </div>
    )
}
