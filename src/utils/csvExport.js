// ============================================
// Dogets - CSV Export
// ============================================

import { getClients, getBookings, getClientById } from './storage';

function escapeCSV(value) {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function downloadCSV(filename, csvContent) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportClientsCSV() {
    const clients = getClients();
    const headers = ['Nombre Perro', 'Raza', 'Edad', 'Peso (kg)', 'Dueño', 'Teléfono', 'Email', 'Vacunas', 'Alergias', 'Notas', 'Contacto Emergencia', 'Tel. Emergencia'];

    const rows = clients.map(c => [
        escapeCSV(c.dogName),
        escapeCSV(c.breed),
        escapeCSV(c.age),
        escapeCSV(c.weight),
        escapeCSV(c.ownerName),
        escapeCSV(c.phone),
        escapeCSV(c.email),
        escapeCSV(c.vaccines),
        escapeCSV(c.allergies),
        escapeCSV(c.notes),
        escapeCSV(c.emergencyName),
        escapeCSV(c.emergencyPhone),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(`dogets-clientes-${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportBookingsCSV() {
    const bookings = getBookings();
    const headers = ['Perro', 'Dueño', 'Entrada', 'Salida', 'Noches', 'Tarifa (€/noche)', 'Descuento (%)', 'Total (€)', 'Pagado', 'Estado', 'Notas'];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const rows = bookings.map(b => {
        const client = getClientById(b.clientId);
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        let status = 'Próxima';
        if (checkIn <= now && checkOut >= now) status = 'Activa';
        if (checkOut < now) status = 'Finalizada';

        return [
            escapeCSV(client?.dogName || 'Desconocido'),
            escapeCSV(client?.ownerName || '-'),
            escapeCSV(b.checkIn),
            escapeCSV(b.checkOut),
            escapeCSV(b.nights),
            escapeCSV(b.rate),
            escapeCSV(b.discount || 0),
            escapeCSV(b.total),
            b.paid ? 'Sí' : 'No',
            status,
            escapeCSV(b.notes),
        ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(`dogets-reservas-${new Date().toISOString().split('T')[0]}.csv`, csv);
}
