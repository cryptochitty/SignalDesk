import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  User,
  Auth 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Firestore 
} from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Safe Singleton Initializers
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

try {
  if (typeof window !== "undefined") {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    
    // Explicit firestore database ID support
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    if (dbId && dbId !== "(default)" && dbId !== "") {
      try {
        dbInstance = getFirestore(appInstance, dbId);
      } catch (e) {
        console.warn("Falling back to default Firestore instance:", e);
        dbInstance = getFirestore(appInstance);
      }
    } else {
      dbInstance = getFirestore(appInstance);
    }
  }
} catch (error) {
  console.error("Firebase initialization warning:", error);
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
};

export type { User, Auth, Firestore };
