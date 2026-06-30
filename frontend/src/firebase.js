import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBtJa1BoOhDRCefHNK-uok0a9ZVF9JRDz0",
  authDomain: "community-hero-people.firebaseapp.com",
  projectId: "community-hero-people",
  storageBucket: "community-hero-people.firebasestorage.app",
  messagingSenderId: "300655231122",
  appId: "1:300655231122:web:3713efcebe851b94d4e64b",
  measurementId: "G-XJQYD5S0XW"
};

let app;
let auth = null;

try {
  // Prevent crash if user hasn't added real keys yet
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase Initialization Error. Check .env.local variables.", error);
}

export { auth };
