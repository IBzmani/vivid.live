import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to trigger connection check
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
