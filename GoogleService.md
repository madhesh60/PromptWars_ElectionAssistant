// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAtGWx3RC_W20Qkpwsl2_0PwEjdjDux2cM",
  authDomain: "electo-2cf46.firebaseapp.com",
  projectId: "electo-2cf46",
  storageBucket: "electo-2cf46.firebasestorage.app",
  messagingSenderId: "750887178279",
  appId: "1:750887178279:web:b1290619554094bb017e02",
  measurementId: "G-8D1Z0W9CNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


