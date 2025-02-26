import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAHGzCu4zFkQs3xtbwq98uh9_xYG_uOGrY",
  authDomain: "jiit-rfid.firebaseapp.com",
  databaseURL: "https://jiit-rfid-default-rtdb.firebaseio.com",
  projectId: "jiit-rfid",
  storageBucket: "jiit-rfid.appspot.com",
  messagingSenderId: "682989525824",
  appId: "1:682989525824:web:77536ba3ecd52a4ccff8a5",
  measurementId: "G-RMBK3BDD6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ Export `db`, `ref`, and `get`
export { db, ref, get };
