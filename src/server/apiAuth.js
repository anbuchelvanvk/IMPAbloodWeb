import { getAdminAuth, getAdminDb } from './firebaseAdmin';

export async function getUserFromRequest(req) {
  let decoded = null;
  const sessionCookie = req.cookies.get('bdw_session')?.value;
  if (sessionCookie) {
    decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } else {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) decoded = await getAdminAuth().verifyIdToken(token);
  }
  if (!decoded) return null;
  const userDoc = await getAdminDb().collection('users').doc(decoded.uid).get();
  return { uid: decoded.uid, email: decoded.email, claims: decoded, profile: userDoc.exists ? userDoc.data() : null };
}

export function requireAuth(user) {
  if (!user) throw new Error('UNAUTHORIZED');
}

export function requireAdmin(user) {
  if (!isAdminUser(user)) throw new Error('FORBIDDEN');
}

export function isAdminUser(user) {
  return Boolean(user && user.claims?.admin === true);
}
