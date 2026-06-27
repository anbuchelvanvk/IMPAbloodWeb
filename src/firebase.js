import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let googleProvider;
let appCheck;

if (typeof window !== 'undefined') {
  const hasCoreConfig =
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.authDomain) &&
    Boolean(firebaseConfig.projectId) &&
    Boolean(firebaseConfig.appId);

  if (!hasCoreConfig) {
    console.error('Missing Firebase web env vars. Set NEXT_PUBLIC_FIREBASE_* values in .env');
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const appCheckDisabled = process.env.NEXT_PUBLIC_DISABLE_APPCHECK === 'true';
    const shouldInitAppCheck =
      !appCheckDisabled &&
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY &&
      (process.env.NEXT_PUBLIC_ENABLE_APPCHECK_DEBUG === 'true' || !isLocalhost);

    if (shouldInitAppCheck) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    }
  }
}

export { app, auth, googleProvider, appCheck };
