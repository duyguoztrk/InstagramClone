
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9QoQ-3dFqgJYm_8O7gNVvqKyzwddxkNk",
  authDomain: "instagram-28a0e.firebaseapp.com",
  projectId: "instagram-28a0e",
storageBucket: "instagram-28a0e.appspot.com",

  messagingSenderId: "187396545906",
  appId: "1:187396545906:web:4fa02242445b6a9b1691eb"
};

const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { auth, db, storage };
