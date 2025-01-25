import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBIRnvz53IJR-bkMZ4TNVBVo0JCEDmQGmo",
  authDomain: "cs-arniko2081.firebaseapp.com",
  databaseURL: "https://cs-arniko2081-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cs-arniko2081",
  storageBucket: "cs-arniko2081.appspot.com",
  messagingSenderId: "999205541098",
  appId: "1:999205541098:web:142ce55ace9a56babdb393"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);