import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhszcGLu3CA3GdSnNjLo7unoumV9ehMps",
    authDomain: "dogets-5e417.firebaseapp.com",
    projectId: "dogets-5e417",
    storageBucket: "dogets-5e417.firebasestorage.app",
    messagingSenderId: "143995116778",
    appId: "1:143995116778:web:728d34872b5e63db180b93",
    measurementId: "G-GSS6Y0RVLM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);
