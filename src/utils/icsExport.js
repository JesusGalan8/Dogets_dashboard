// ============================================
// Dogets - ICS Calendar Export
// ============================================

import { getClientById, getBookings } from './storage';

function formatICSDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function escapeICS(str) {
    return (str || '').replace(/[,;\\]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
}

export function generateICSForBooking(booking) {
    const client = getClientById(booking.clientId);
    if (!client) return null;

    const checkIn = formatICSDate(booking.checkIn);
    const checkOut = formatICSDate(booking.checkOut);
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Dogets//Hospedaje Canino//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        // Arrival event
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${checkIn}`,
        `DTEND;VALUE=DATE:${checkIn}`,
        `DTSTAMP:${now}`,
        `UID:dogets-arrival-${booking.id}@dogets.app`,
        `SUMMARY:🐕 Llegada: ${escapeICS(client.dogName)}`,
        `DESCRIPTION:${escapeICS(`Llegada de ${client.dogName} (${client.breed || 'Sin raza'})\\nDueño: ${client.ownerName}\\nTeléfono: ${client.phone || 'N/A'}\\nTarifa: ${booking.rate}€/noche\\nTotal: ${booking.total}€\\nNotas: ${booking.notes || 'Ninguna'}`)}`,
        // Reminder 1 day before
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(client.dogName)} llega mañana`,
        'END:VALARM',
        // Reminder same day
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(client.dogName)} llega hoy`,
        'END:VALARM',
        'END:VEVENT',
        // Departure event
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${checkOut}`,
        `DTEND;VALUE=DATE:${checkOut}`,
        `DTSTAMP:${now}`,
        `UID:dogets-departure-${booking.id}@dogets.app`,
        `SUMMARY:🏠 Salida: ${escapeICS(client.dogName)}`,
        `DESCRIPTION:${escapeICS(`Salida de ${client.dogName}\\nDueño: ${client.ownerName} viene a recoger\\nTeléfono: ${client.phone || 'N/A'}`)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(client.ownerName)} viene a recoger a ${escapeICS(client.dogName)} hoy`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return ics;
}

export function downloadICS(booking) {
    const ics = generateICSForBooking(booking);
    if (!ics) return;

    const client = getClientById(booking.clientId);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dogets-${client?.dogName || 'reserva'}-${booking.checkIn}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadAllBookingsICS(bookings) {
    if (!bookings.length) return;

    const events = bookings.map(booking => {
        const client = getClientById(booking.clientId);
        if (!client) return '';

        const checkIn = formatICSDate(booking.checkIn);
        const checkOut = formatICSDate(booking.checkOut);
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return [
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${checkIn}`,
            `DTEND;VALUE=DATE:${checkOut}`,
            `DTSTAMP:${now}`,
            `UID:dogets-stay-${booking.id}@dogets.app`,
            `SUMMARY:🐕 ${escapeICS(client.dogName)} - Estancia`,
            `DESCRIPTION:${escapeICS(`Dueño: ${client.ownerName}\\nTarifa: ${booking.rate}€/noche\\nTotal: ${booking.total}€`)}`,
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            `DESCRIPTION:${escapeICS(client.dogName)} llega mañana`,
            'END:VALARM',
            'END:VEVENT'
        ].join('\r\n');
    }).filter(Boolean);

    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Dogets//Hospedaje Canino//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...events,
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dogets-reservas-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Alias used by BookingList
export const downloadBookingICS = downloadICS;

// Export future bookings as ICS (used by Reports)
export function exportFutureBookingsICS() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = getBookings().filter(b => new Date(b.checkOut + 'T00:00:00') >= now);
    downloadAllBookingsICS(future);
}
