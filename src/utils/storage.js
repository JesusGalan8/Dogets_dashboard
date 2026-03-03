// ============================================
// Dogets - LocalStorage Data Layer
// ============================================

const STORAGE_KEYS = {
    CLIENTS: 'dogets_clients',
    BOOKINGS: 'dogets_bookings',
};

// ---------- Generic Helpers ----------
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ---------- Clients ----------
export function getClients() {
    return getFromStorage(STORAGE_KEYS.CLIENTS);
}

export function getClientById(id) {
    return getClients().find(c => c.id === id) || null;
}

export function saveClient(clientData) {
    const clients = getClients();
    if (clientData.id) {
        const idx = clients.findIndex(c => c.id === clientData.id);
        if (idx !== -1) {
            clients[idx] = { ...clients[idx], ...clientData, updatedAt: new Date().toISOString() };
        }
    } else {
        clientData.id = generateId();
        clientData.createdAt = new Date().toISOString();
        clientData.updatedAt = new Date().toISOString();
        clients.push(clientData);
    }
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    return clientData;
}

export function deleteClient(id) {
    const clients = getClients().filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    // Also delete all bookings for this client
    const bookings = getBookings().filter(b => b.clientId !== id);
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
}

// ---------- Bookings ----------
export function getBookings() {
    return getFromStorage(STORAGE_KEYS.BOOKINGS);
}

export function getBookingById(id) {
    return getBookings().find(b => b.id === id) || null;
}

export function saveBooking(bookingData) {
    const bookings = getBookings();
    if (bookingData.id) {
        const idx = bookings.findIndex(b => b.id === bookingData.id);
        if (idx !== -1) {
            bookings[idx] = { ...bookings[idx], ...bookingData, updatedAt: new Date().toISOString() };
        }
    } else {
        bookingData.id = generateId();
        bookingData.createdAt = new Date().toISOString();
        bookingData.updatedAt = new Date().toISOString();
        bookings.push(bookingData);
    }
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
    return bookingData;
}

export function deleteBooking(id) {
    const bookings = getBookings().filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
}

// ---------- Computed Helpers ----------
export function getBookingsForClient(clientId) {
    return getBookings().filter(b => b.clientId === clientId);
}

export function getActiveBookings() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return getBookings().filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return checkIn <= now && checkOut >= now;
    });
}

export function getUpcomingBookings(days = 7) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return getBookings().filter(b => {
        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn > now && checkIn <= future;
    }).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
}

export function calculateBookingTotal(rate, checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const nights = Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    return nights * rate;
}

export function getMonthlyRevenue(year, month) {
    return getBookings().reduce((total, b) => {
        const checkIn = new Date(b.checkIn);
        if (checkIn.getFullYear() === year && checkIn.getMonth() === month) {
            return total + (b.total || 0);
        }
        return total;
    }, 0);
}

export function getBookingsForMonth(year, month) {
    return getBookings().filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        return checkIn <= monthEnd && checkOut >= monthStart;
    });
}

// ---------- Stats ----------
export function getStats() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const clients = getClients();
    const bookings = getBookings();
    const active = getActiveBookings();
    const upcoming = getUpcomingBookings(7);
    const monthRevenue = getMonthlyRevenue(year, month);

    return {
        totalClients: clients.length,
        totalBookings: bookings.length,
        activeBookings: active.length,
        upcomingBookings: upcoming.length,
        monthRevenue,
    };
}
