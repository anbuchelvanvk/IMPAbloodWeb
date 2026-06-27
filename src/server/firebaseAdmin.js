import admin from 'firebase-admin';

function parseServiceAccountJson(jsonText) {
  if (!jsonText || typeof jsonText !== 'string') return null;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
    const parsed = parseServiceAccountJson(decoded);
    if (parsed) return parsed;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (parsed) return parsed;
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  throw new Error('Invalid or missing Firebase Admin credentials');
}

function ensureAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'demo-blooddonationweb';
    const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
    if (usingEmulator) {
      // Emulator mode should not require production service account secrets.
      admin.initializeApp({ projectId, credential: admin.credential.applicationDefault() });
      return;
    }
    const credential = admin.credential.cert(getServiceAccount());
    admin.initializeApp({ credential, projectId });
  }
}

export function getAdminAuth() {
  ensureAdmin();
  return admin.auth();
}

export function getAdminDb() {
  ensureAdmin();
  const db = admin.firestore();
  try {
    db.settings({ preferRest: true });
  } catch (e) {
    // Ignore if settings were already initialized
  }
  return db;
}

export function getAdminAppCheck() {
  ensureAdmin();
  return admin.appCheck();
}
