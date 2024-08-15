// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getStorage } from "firebase/storage"
import { getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API,
  authDomain: "inventory-managment-9f8d0.firebaseapp.com",
  projectId: "inventory-managment-9f8d0",
  storageBucket: "inventory-managment-9f8d0.appspot.com",
  messagingSenderId: "202945195561",
  appId: "1:202945195561:web:71f87707b5a00440983638",
  measurementId: "G-1ZVTTEPDKL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app)
export {storage}
export {firestore}