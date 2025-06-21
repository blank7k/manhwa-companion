// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvXjTzbyQ1hu0YU7LbUiyBXYJhKRKky_I",
  authDomain: "manhwa-companion.firebaseapp.com",
  projectId: "manhwa-companion",
  storageBucket: "manhwa-companion.appspot.com",
  messagingSenderId: "757544576931",
  appId: "1:757544576931:web:5db5aad72dd0ef590f1c16",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
