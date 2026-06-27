import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from './firebaseAdmin';

const SESSION_COOKIE = 'bdw_session';

export async function getServerSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    const snap = await getAdminDb().collection('users').doc(decoded.uid).get();
    if (!snap.exists) return null;
    return { uid: decoded.uid, email: decoded.email, claims: decoded, ...snap.data() };
  } catch {
    return null;
  }
}
