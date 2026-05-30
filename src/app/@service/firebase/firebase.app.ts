import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { environment } from '../../../environments/environment';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

export function isFirebaseConfigured(): boolean {
  return !!environment.firebase?.apiKey && environment.firebase.apiKey !== 'YOUR_API_KEY';
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('請在 environment 設定 Firebase 專案參數');
  }
  if (!app) {
    app = initializeApp(environment.firebase);
  }
  return app;
}

export async function initFirebaseAnalytics(): Promise<void> {
  if (analytics || !environment.production) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  const supported = await isSupported();
  if (supported) {
    analytics = getAnalytics(getFirebaseApp());
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
