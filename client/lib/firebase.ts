// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBxqs52tk9dyYmWfEcCHofjAJU1KZQPFqY',
  authDomain: 'blog-566d0.firebaseapp.com',
  projectId: 'blog-566d0',
  storageBucket: 'blog-566d0.firebasestorage.app',
  messagingSenderId: '338727804484',
  appId: '1:338727804484:web:af152270812a692094e611',
  measurementId: 'G-NZF3MZCZN2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// getAnalytics(app);
export const firebaseStorage = getStorage(app);
