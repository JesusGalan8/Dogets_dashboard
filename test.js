import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBhszcGLu3CA3GdSnNjLo7unoumV9ehMps",
    authDomain: "dogets-5e417.firebaseapp.com",
    projectId: "dogets-5e417",
    storageBucket: "dogets-5e417.firebasestorage.app",
    messagingSenderId: "143995116778",
    appId: "1:143995116778:web:728d34872b5e63db180b93",
    measurementId: "G-GSS6Y0RVLM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
    try {
        console.log("Fetching clients...");
        const clientsSnap = await getDocs(collection(db, "clients"));
        console.log("Success! Client count:", clientsSnap.size);
    } catch (e) {
        console.error("Error fetching defaults:", e.code || e.message);
    }
}

testFirebase();
