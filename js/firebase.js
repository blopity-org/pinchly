import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
    addDoc,
    collection,
    doc,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyA0Apxelzlzv4cEBAzaBzSL8hhOz1Lq8pw',
    authDomain: 'pinchly-55804.firebaseapp.com',
    projectId: 'pinchly-55804',
    storageBucket: 'pinchly-55804.firebasestorage.app',
    messagingSenderId: '830262534604',
    appId: '1:830262534604:web:f034877eacb4532c573d69',
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
    (value) => value.length > 0 && !value.startsWith('YOUR_')
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
    addDoc,
    collection,
    createUserWithEmailAndPassword,
    doc,
    limit,
    onAuthStateChanged,
    onSnapshot,
    orderBy,
    query,
    sendPasswordResetEmail,
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    updateDoc,
    updateProfile,
    where,
};
