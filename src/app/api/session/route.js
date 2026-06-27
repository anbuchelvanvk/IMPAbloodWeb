import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '../../../server/firebaseAdmin';

const SESSION_COOKIE = 'bdw_session';
const EXPIRES_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(req) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ ok: false, error: 'Missing idToken' }, { status: 400 });

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: EXPIRES_MS });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: EXPIRES_MS / 1000
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to create session' }, { status: 401 });
  }
}

export async function GET() {
  try {
    const jar = await cookies();
    const sessionCookie = jar.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) return NextResponse.json({ ok: true, data: null });

    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const snap = await getAdminDb().collection('users').doc(decoded.uid).get();
    const isMissingProfileData = (doc = {}) => (
      !doc?.name ||
      !doc?.contact ||
      !doc?.bloodGroup ||
      !doc?.state ||
      !doc?.district ||
      doc?.faceVerified !== true
    );
    if (!snap.exists) {
      return NextResponse.json({
        ok: true,
        data: {
          needsRegistration: true,
          uid: decoded.uid,
          email: decoded.email || '',
          name: decoded.name || '',
          isAdmin: decoded.admin === true
        }
      });
    }
    const doc = snap.data() || {};
    if (isMissingProfileData(doc)) {
      return NextResponse.json({
        ok: true,
        data: {
          needsRegistration: true,
          uid: decoded.uid,
          email: decoded.email || doc.email || '',
          name: doc.name || decoded.name || '',
          contact: doc.contact || '',
          bloodGroup: doc.bloodGroup || '',
          state: doc.state || '',
          district: doc.district || '',
          faceVerified: doc.faceVerified === true,
          shareContact: doc.shareContact === true,
          lastDonationDate: doc.lastDonationDate || null,
          nextEligibleDate: doc.nextEligibleDate || null,
          isAdmin: decoded.admin === true
        }
      });
    }
    return NextResponse.json({
      ok: true,
      data: {
        id: snap.id,
        ...doc,
        isAdmin: decoded.admin === true
      }
    });
  } catch {
    return NextResponse.json({ ok: true, data: null });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
