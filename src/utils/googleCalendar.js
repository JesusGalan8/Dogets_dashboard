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
                onStatusChange?.('disconnected');
                return;
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
        onStatusChange?.('disconnected');
    }
}

// Create calendar events for a booking
export async function createCalendarEvents(booking) {
    if (!isConnected()) return null;

    const client = getClientById(booking.clientId);
    if (!client) return null;

    try {
        // Create arrival event
        const arrivalEvent = {
            summary: `🐕 Llegada: ${client.dogName}`,
            description: `Dueño: ${client.ownerName}\nTeléfono: ${client.phone || 'N/A'}\nEmail: ${client.email || 'N/A'}\nRaza: ${client.breed || 'N/A'}\nTarifa: ${booking.rate}€/noche\nTotal: ${booking.total}€\n${booking.notes ? 'Notas: ' + booking.notes : ''}`,
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
            summary: `🏠 Salida: ${client.dogName}`,
            description: `${client.ownerName} viene a recoger a ${client.dogName}\nTeléfono: ${client.phone || 'N/A'}`,
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
        console.error('Error creating calendar events:', e);
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
