import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "xyz",
  authDomain: "aq",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
const db = getDatabase(app);

// Get a reference to the auth service
const auth = getAuth(app);

// Get a reference to the storage service
const storage = getStorage(app);

console.log(db);
console.log(auth);
console.log(storage);

export { db, auth, storage };
