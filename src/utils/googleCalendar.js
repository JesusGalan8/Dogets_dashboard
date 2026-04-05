// ============================================
// Dogets - Google Calendar Integration
// ============================================

import { getClientById, saveBooking } from './storage';

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
export function signIn(silent = false) {
    if (!tokenClient) return;
    localStorage.setItem('dogets_wants_google', 'true');

    if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken(silent ? { prompt: '' } : { prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Sign out
export function signOut() {
    const token = window.gapi?.client?.getToken();
    localStorage.removeItem('dogets_wants_google');
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

        // Create arrival event
        const arrivalEvent = {
            summary: `🐕 Llegada: ${client.dogName} — ${booking.total}€ ${booking.paid ? '✅' : '⏳'}`,
            description: `🐕 LLEGADA: ${client.dogName}\n` +
                `👤 Dueño: ${client.ownerName}\n` +
                `📞 Teléfono: ${client.phone || 'N/A'}\n` +
                `📧 Email: ${client.email || 'N/A'}\n` +
                `🦴 Raza: ${client.breed || 'Mestizo'}\n` +
                (booking.alerts ? `\n🎒 AVISOS / MALETA:\n   ${booking.alerts.replace(/\n/g, '\n   ')}\n` : '') +
                `\n💰 FACTURACIÓN:\n` +
                `   ${nightsLabel} × ${booking.rate}€ = ${booking.total}€\n` +
                (parseFloat(booking.discount) > 0 ? `   Descuento: ${booking.discount}%\n` : '') +
                `   Estado: ${paymentStatus}\n` +
                (booking.notes ? `\n📝 Notas Internas: ${booking.notes}` : ''),
            start: { date: booking.checkIn },
            end: { date: booking.checkIn },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 1440 }, // 1 day before
                    { method: 'popup', minutes: 120 },  // 2 hours before
                ],
            },
            colorId: '10', // Green
        };

        const arrivalRes = await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: arrivalEvent,
        });

        // Create departure event
        const departureEvent = {
            summary: `🏠 Salida: ${client.dogName} — Cobrar ${booking.total}€`,
            description: `🏠 SALIDA: ${client.dogName}\n` +
                `👤 ${client.ownerName} viene a recoger\n` +
                `📞 Teléfono: ${client.phone || 'N/A'}\n` +
                `\n💰 A COBRAR: ${booking.total}€\n` +
                `   Estado: ${paymentStatus}`,
            start: { date: booking.checkOut },
            end: { date: booking.checkOut },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 120 }, // 2 hours before
                ],
            },
            colorId: '11', // Red
        };

        const departureRes = await window.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: departureEvent,
        });

        return {
            arrivalEventId: arrivalRes.result.id,
            departureEventId: departureRes.result.id,
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

// Sincronización masiva de reservas pendientes
export async function syncMissingBookings(bookings, onProgress) {
    if (!isConnected()) return { success: false, msg: 'No conectado a Google Calendar' };

    let syncedCount = 0;
    let skippedCount = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < bookings.length; i++) {
        const b = bookings[i];
        
        // Ignorar reservas pasadas (la fecha de salida ya pasó)
        const checkOutDate = new Date(b.checkOut + 'T00:00:00');
        if (checkOutDate < now) {
            continue; 
        }

        // Si ya está asignada a Google, o si explícitamente se guardó con syncGoogle = false (aunque por defecto es true)
        if (b.googleArrivalEventId || b.googleDepartureEventId || b.syncGoogle === false) {
            skippedCount++;
            continue;
        }

        if (onProgress) onProgress(i, bookings.length, b);

        try {
            const eventIds = await createCalendarEvents(b);
            if (eventIds) {
                b.googleArrivalEventId = eventIds.arrivalEventId;
                b.googleDepartureEventId = eventIds.departureEventId;
                b.syncGoogle = true;
                await saveBooking(b);
                syncedCount++;
            }
        } catch (e) {
            console.error("Failed to sync booking", b, e);
        }
    }

    return { success: true, syncedCount, skippedCount };
}
