// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCb75AT1BVnSVlp9vliQhcYsMHGZuS0egs",
  authDomain: "sdk-billing-app57.firebaseapp.com",
  projectId: "sdk-billing-app57",
  storageBucket: "sdk-billing-app57.firebasestorage.app",
  messagingSenderId: "1045108609393",
  appId: "1:1045108609393:web:addca863a950765db726d0",
  measurementId: "G-RJ3XMBR59V"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth()