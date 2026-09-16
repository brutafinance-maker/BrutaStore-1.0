import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCqTlpR0XqI5ipbl63LXjwa6XKQCJ3M2l0",
  authDomain: "brutastore-e16dc.firebaseapp.com",
  databaseURL: "https://brutastore-e16dc-default-rtdb.firebaseio.com",
  projectId: "brutastore-e16dc",
  storageBucket: "brutastore-e16dc.firebasestorage.app",
  messagingSenderId: "194165653843",
  appId: "1:194165653843:web:b180e95b8f153cdd4ce1a6",
  measurementId: "G-9VJK5HV5NH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
