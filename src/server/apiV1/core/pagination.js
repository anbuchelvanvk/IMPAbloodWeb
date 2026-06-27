const MAX_LIMIT = 200;

export function parsePagination(input, fallbackLimit) {
  const rawLimit = Number(input?.limit || fallbackLimit);
  const limit = Number.isFinite(rawLimit) ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit))) : fallbackLimit;
  const cursor = typeof input?.cursor === 'string' && input.cursor.trim() ? input.cursor.trim() : null;
  return { limit, cursor };
}

export async function withCursor(query, db, collectionName, cursorId) {
  if (!cursorId) return query;
  const anchorSnap = await db.collection(collectionName).doc(cursorId).get();
  if (!anchorSnap.exists) return query;
  return query.startAfter(anchorSnap);
}

export function paged(items) {
  const nextCursor = items.length > 0 ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export function parsePageCursor(raw) {
  const n = Number.parseInt(String(raw ?? '0'), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}
