import { getAdminAuth, getAdminDb } from './firebaseAdmin';

export async function getUserFromRequest(req) {
  let decoded = null;
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token) {
      decoded = await getAdminAuth().verifyIdToken(token);
    } else {
      const sessionCookie = req.cookies.get('bdw_session')?.value;
      if (sessionCookie) {
        decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      }
    }
  } catch (err) {
    // If the token or cookie is invalid, revoked, or user is deleted, treat as unauthenticated
    return null;
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
