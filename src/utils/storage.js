// ============================================
// Dogets - Firebase Cloud Data Layer
// ============================================

import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

const STORAGE_KEYS = {
    CLIENTS: 'dogets_clients',
    BOOKINGS: 'dogets_bookings',
};

// Local memory cache
let localClients = [];
let localBookings = [];
let isInitialized = false;

// ---------- Initialization & Sync ----------
export async function initStorageSync(onDataChanged) {
    if (isInitialized) return;

    // Fallback: load from localStorage immediately so UI isn't blank
    localClients = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
    localBookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');

    try {
        // Step 1: Check if migration is needed
        const clientsSnap = await getDocs(collection(db, "clients"));
        if (clientsSnap.empty) {
            // Firestore is empty, let's migrate from localStorage
            const localC = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
            const localB = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');

            if (localC.length > 0 || localB.length > 0) {
                console.log("Migrando datos de LocalStorage a Firebase...");
                const batch = writeBatch(db);

                localC.forEach(c => {
                    batch.set(doc(db, "clients", c.id), c);
                });

                localB.forEach(b => {
                    batch.set(doc(db, "bookings", b.id), b);
                });

                await batch.commit();
                console.log("Migración completada.");
            }
        }

        // Step 2: Setup Real-time Listeners
        onSnapshot(collection(db, "clients"), (snapshot) => {
            localClients = snapshot.docs.map(d => d.data());
            onDataChanged();
        }, (error) => {
            console.error("Error en listener de clients:", error);
        });

        onSnapshot(collection(db, "bookings"), (snapshot) => {
            localBookings = snapshot.docs.map(d => d.data());
            onDataChanged();
        }, (error) => {
            console.error("Error en listener de bookings:", error);
        });

        isInitialized = true;
    } catch (e) {
        console.error("Error conectando a Firebase, usando datos locales:", e);
        // Already loaded from localStorage above, just signal ready
        isInitialized = true;
        onDataChanged();
    }
}

// ---------- Generic Helpers ----------
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ---------- Clients ----------
export function getClients() {
    return localClients;
}

export function getClientById(id) {
    return localClients.find(c => c.id === id) || null;
}

export async function saveClient(clientData) {
    if (!clientData.id) {
        clientData.id = generateId();
        clientData.createdAt = new Date().toISOString();
    }
    clientData.updatedAt = new Date().toISOString();

    // Strip undefined values before saving to Firestore
    const cleanData = Object.fromEntries(Object.entries(clientData).filter(([_, v]) => v !== undefined));

    // Write to Firestore (the listener will update localClients)
    await setDoc(doc(db, "clients", cleanData.id), cleanData);
    return cleanData;
}

export async function deleteClient(id) {
    // Delete the client
    await deleteDoc(doc(db, "clients", id));

    // Find all bookings for this client and delete them too
    const bookingsToDelete = localBookings.filter(b => b.clientId === id);
    const batch = writeBatch(db);
    bookingsToDelete.forEach(b => {
        batch.delete(doc(db, "bookings", b.id));
    });
    if (bookingsToDelete.length > 0) {
        await batch.commit();
    }
}

// ---------- Bookings ----------
export function getBookings() {
    return localBookings;
}

export function getBookingById(id) {
    return localBookings.find(b => b.id === id) || null;
}

export async function saveBooking(bookingData) {
    if (!bookingData.id) {
        bookingData.id = generateId();
        bookingData.createdAt = new Date().toISOString();
    }
    bookingData.updatedAt = new Date().toISOString();

    // Strip undefined values before saving to Firestore
    const cleanData = Object.fromEntries(Object.entries(bookingData).filter(([_, v]) => v !== undefined));

    await setDoc(doc(db, "bookings", cleanData.id), cleanData);
    return cleanData;
}

export async function deleteBooking(id) {
    await deleteDoc(doc(db, "bookings", id));
}

// ---------- Computed Helpers ----------
export function getBookingsForClient(clientId) {
    return localBookings.filter(b => b.clientId === clientId);
}

export function getActiveBookings() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return localBookings.filter(b => {
        if (b.checkedOut) return false;
        if (b.checkedIn) return true; // Already here

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
    return localBookings.filter(b => {
        if (b.checkedIn || b.checkedOut) return false;

        const checkIn = new Date(b.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn >= now && checkIn <= future;
    }).sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
}

export function calculateBookingTotal(rate, checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const nights = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    const units = Math.max(1, nights);
    return units * rate;
}

export function getMonthlyRevenue(year, month) {
    return localBookings.reduce((total, b) => {
        const checkIn = new Date(b.checkIn);
        if (checkIn.getFullYear() === year && checkIn.getMonth() === month) {
            return total + (b.total || 0);
        }
        return total;
    }, 0);
}

export function getBookingsForMonth(year, month) {
    return localBookings.filter(b => {
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
    const active = getActiveBookings();
    const upcoming = getUpcomingBookings(7);
    const monthRevenue = getMonthlyRevenue(year, month);

    return {
        totalClients: localClients.length,
        totalBookings: localBookings.length,
        activeBookings: active.length,
        upcomingBookings: upcoming.length,
        monthRevenue,
    };
}
