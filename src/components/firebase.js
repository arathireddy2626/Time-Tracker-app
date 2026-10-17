// Firebase client initialization for frontend (Email/Password Auth)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';

let app = null;
let auth = null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

try {
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (e) {
  // Leave auth as null; the app will fall back to legacy API login
  auth = null;
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const opts = Object.assign({
    headers: { 'Content-Type': 'application/json' }
  }, options);

  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { status: res.status, body: text ? JSON.parse(text) : null };
  } catch (e) {
    return { status: res.status, body: text };
  }
}

async function signInAndGetIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return await userCredential.user.getIdToken();
}

export { app, auth, API_BASE, apiFetch, signInAndGetIdToken };
