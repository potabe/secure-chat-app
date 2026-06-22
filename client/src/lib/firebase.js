// Firebase Web SDK configuration
// TODO: Replace with your Firebase project config from Firebase Console
// Project Settings → General → Your apps → SDK setup and configuration → Config

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCTlmd0QUzEnM4S1H9xiDUbRCZK-yWXiQ",
  authDomain: "chat-6ba06.firebaseapp.com",
  projectId: "chat-6ba06",
  storageBucket: "chat-6ba06.firebasestorage.app",
  messagingSenderId: "30019372687",
  appId: "1:30019372687:web:1c2f63cdfde9526fff12fa"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
