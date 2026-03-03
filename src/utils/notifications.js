// ============================================
// Dogets - Browser Notification System
// ============================================

import { getUpcomingBookings, getClientById } from './storage';

let notificationPermission = 'default';

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones');
        return false;
    }

    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
}

export function sendNotification(title, body, icon = '🐕') {
    if (notificationPermission !== 'granted') return;

    try {
        new Notification(title, {
            body,
            icon: '/dogets-icon.svg',
            badge: '/dogets-icon.svg',
            tag: 'dogets-' + Date.now(),
        });
    } catch (e) {
        console.warn('Error sending notification:', e);
    }
}

export function checkUpcomingArrivals() {
    const upcoming = getUpcomingBookings(1); // Check arrivals in next 24h

    upcoming.forEach(booking => {
        const client = getClientById(booking.clientId);
        if (!client) return;

        const checkInDate = new Date(booking.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        checkInDate.setHours(0, 0, 0, 0);

        const isToday = checkInDate.getTime() === today.getTime();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = checkInDate.getTime() === tomorrow.getTime();

        if (isToday) {
            sendNotification(
                `🐕 ¡${client.dogName} llega hoy!`,
                `${client.ownerName} trae a ${client.dogName} hoy. Tarifa: ${booking.rate}€/noche`
            );
        } else if (isTomorrow) {
            sendNotification(
                `📅 ${client.dogName} llega mañana`,
                `Recuerda: ${client.ownerName} trae a ${client.dogName} mañana`
            );
        }
    });
}

// Start periodic check (every 30 minutes)
let checkInterval = null;

export function startNotificationChecker() {
    if (checkInterval) clearInterval(checkInterval);

    // Check immediately
    checkUpcomingArrivals();

    // Then every 30 minutes
    checkInterval = setInterval(checkUpcomingArrivals, 30 * 60 * 1000);
}

export function stopNotificationChecker() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
}
