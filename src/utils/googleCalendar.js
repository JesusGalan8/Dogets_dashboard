// ============================================
// Dogets - Google Calendar Integration
// ============================================

import { getClientById } from './storage';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let onStatusChange = null;

const TOKEN_KEY = 'dogets_google_token';

// Get stored Client ID
export function getStoredClientId() {
    return localStorage.getItem('dogets_google_client_id') || '';
}

export function setStoredClientId(clientId) {
    localStorage.setItem('dogets_google_client_id', clientId);
}

// Initialize GAPI client
export async function initGapi() {
    const clientId = getStoredClientId();
    if (!clientId) return false;

    try {
        await new Promise((resolve, reject) => {
            if (window.gapi) {
                window.gapi.load('client', { callback: resolve, onerror: reject });
            } else {
                reject(new Error('gapi not loaded'));
            }
        });

        await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
        });

        // Restore saved token from localStorage
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if (savedToken) {
            try {
                const token = JSON.parse(savedToken);
                window.gapi.client.setToken(token);
            } catch (e) {
                localStorage.removeItem(TOKEN_KEY);
            }
        }

        gapiInited = true;
        return true;
    } catch (e) {
        console.warn('Google API init failed:', e);
        return false;
    }
}

// Initialize Google Identity Services token client
export function initGis(statusCallback) {
    const clientId = getStoredClientId();
    if (!clientId || !window.google?.accounts?.oauth2) return false;

    onStatusChange = statusCallback;

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error('Token error:', response);
                localStorage.removeItem(TOKEN_KEY);
                onStatusChange?.('disconnected');
                return;
            }
            // Save token for persistence across reloads
            const token = window.gapi.client.getToken();
            if (token) {
                localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
            }
            onStatusChange?.('connected');
        },
    });

    gisInited = true;
    return true;
}

// Check if connected
export function isConnected() {
    return gapiInited && gisInited && window.gapi?.client?.getToken() != null;
}

// Sign in
export function signIn() {
    if (!tokenClient) return;

    if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Sign out
export function signOut() {
    const token = window.gapi?.client?.getToken();
    if (token) {
        window.google.accounts.oauth2.revoke(token.access_token);
        window.gapi.client.setToken('');
        localStorage.removeItem(TOKEN_KEY);
        onStatusChange?.('disconnected');
    }
}

// Create calendar event for a booking (spans entire stay)
export async function createCalendarEvents(booking) {
    if (!isConnected()) return null;

    const client = getClientById(booking.clientId);
    if (!client) return null;

    try {
        const nights = booking.nights || 0;
        const nightsLabel = nights === 0 ? 'Guardería (Día)' : `${nights} noche${nights !== 1 ? 's' : ''}`;
        const paymentStatus = booking.paid ? '✅ PAGADO' : '⏳ PENDIENTE DE COBRO';

        // Google Calendar all-day events: end date is EXCLUSIVE,
        // so we need to add 1 day to checkOut for it to include the last day
        const endDate = new Date(booking.checkOut + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const stayEvent = {
            summary: `🐕 ${client.dogName} — ${booking.total}€ ${booking.paid ? '✅' : '⏳'}`,
            description: `🐕 ${client.dogName}\n` +
                `👤 Dueño: ${client.ownerName}\n` +
                `📞 Teléfono: ${client.phone || 'N/A'}\n` +
                `📧 Email: ${client.email || 'N/A'}\n` +
                `🦴 Raza: ${client.breed || 'Mestizo'}\n` +
                `\n📅 ESTANCIA:\n` +
                `   Entrada: ${booking.checkIn}\n` +
                `   Salida: ${booking.checkOut}\n` +
                `   Duración: ${nightsLabel}\n` +
                `\n💰 FACTURACIÓN:\n` +
                `   ${nightsLabel} × ${booking.rate}€ = ${booking.total}€\n` +
                (parseFloat(booking.discount) > 0 ? `   Descuento: ${booking.discount}%\n` : '') +
                `   Estado: ${paymentStatus}\n` +
                (booking.notes ? `\n📝 Notas: ${booking.notes}` : ''),
            start: { date: booking.checkIn },
            end: { date: endDateStr },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 1440 }, // 1 day before arrival
                    { method: 'popup', minutes: 120 },  // 2 hours before arrival
                ],
            },
            colorId: '10', // Green
        };

        const res = await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: stayEvent,
        });

        return {
            arrivalEventId: res.result.id,
            departureEventId: null,
        };
    } catch (e) {
        console.error('Error creating calendar event:', e);
        return null;
    }
}

// Delete calendar events for a booking
export async function deleteCalendarEvents(booking) {
    if (!isConnected()) return;

    try {
        if (booking.googleArrivalEventId) {
            await window.gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: booking.googleArrivalEventId,
            });
        }
        if (booking.googleDepartureEventId) {
            await window.gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: booking.googleDepartureEventId,
            });
        }
    } catch (e) {
        console.warn('Error deleting calendar events:', e);
    }
}
