import { NextResponse } from 'next/server';

export function ok(data) {
  return NextResponse.json({ ok: true, data });
}

export function fail(status, message) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function sanitizeErrorMessage(err) {
  if (err.message === 'UNAUTHORIZED') return { status: 401, message: 'Unauthorized' };
  if (err.message === 'FORBIDDEN') return { status: 403, message: 'Forbidden' };
  if (err.message === 'APPCHECK_MISSING') return { status: 401, message: 'Missing App Check token' };
  if (err.message === 'RATE_LIMITED') return { status: 429, message: 'Too many requests. Please retry shortly.' };
  if (Array.isArray(err?.issues) && err.issues.length > 0) {
    const msg = err.issues.map((i) => `${i.path?.join('.') || 'field'}: ${i.message}`).join('; ');
    return { status: 400, message: msg };
  }
  return { status: 500, message: 'Request could not be completed' };
}
