// lib/firebase.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBbE4E3wqhiRjDSF3yHujnyh6CZxKTF2UM",
  authDomain: "push-notification-6b1c5.firebaseapp.com",
  projectId: "push-notification-6b1c5",
  storageBucket: "push-notification-6b1c5.firebasestorage.app",
  messagingSenderId: "986143695561",
  appId: "1:986143695561:web:9cde90a834d07fc7aba318",
  measurementId: "G-KXCDR0YLHR",
};
export const firebaseApp = initializeApp(firebaseConfig);
