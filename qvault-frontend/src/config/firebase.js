// Firebase Configuration for Q-Vault
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUV_lbInH0Udr4zVTirzd7I5o43j7lojk",
    authDomain: "q-vault-2598e.firebaseapp.com",
    projectId: "q-vault-2598e",
    storageBucket: "q-vault-2598e.firebasestorage.app",
    messagingSenderId: "370972543386",
    appId: "1:370972543386:web:ec25f44ee0b5a058891223",
    measurementId: "G-N36C0QQ287"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
