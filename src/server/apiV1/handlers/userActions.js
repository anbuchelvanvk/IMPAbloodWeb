export async function handleUserAction(action, ctx) {
  const {
    user,
    db,
    payload,
    requireAuth,
    isAdminUser,
    respondOk,
    respondFail,
    schemas,
    parsePagination,
    parsePageCursor,
    sanitizeRequestData
  } = ctx;

  if (action === 'getUserRequests') {
    const blocked = ctx.legacyReadBlocked('getUserRequests');
    return respondFail(blocked.status, blocked.message);
  }

  if (action === 'getUserRequestsPaged') {
    requireAuth(user);
    const { userId, pagination } = schemas.userScoped.extend({ pagination: schemas.pagedList.shape.pagination }).parse(payload);
    if (user.uid !== userId && !isAdminUser(user)) return respondFail(403, 'Forbidden');
    const { limit } = parsePagination(pagination, ctx.defaults.userRequests);
    const page = parsePageCursor(pagination?.cursor);
    const fetchLimit = Math.min(240, (page + 1) * limit);
    const [openReqs, historyReqs] = await Promise.all([
      db.collection('requests').where('requesterId', '==', userId).limit(fetchLimit).get(),
      db.collection('donationHistory').where('requesterId', '==', userId).limit(fetchLimit).get()
    ]);
    const all = [...openReqs.docs, ...historyReqs.docs]
      .map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, isAdminUser(user)) }))
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    const start = page * limit;
    const items = all.slice(start, start + limit);
    const hasMore = all.length > (start + limit) && fetchLimit < 240;
    return respondOk({ items, nextCursor: hasMore ? String(page + 1) : null });
  }

  if (action === 'getUserDonations') {
    const blocked = ctx.legacyReadBlocked('getUserDonations');
    return respondFail(blocked.status, blocked.message);
  }

  if (action === 'getUserDonationsPaged') {
    requireAuth(user);
    const { userId, pagination } = schemas.userScoped.extend({ pagination: schemas.pagedList.shape.pagination }).parse(payload);
    if (user.uid !== userId && !isAdminUser(user)) return respondFail(403, 'Forbidden');
    const { limit } = parsePagination(pagination, ctx.defaults.userDonations);
    const page = parsePageCursor(pagination?.cursor);
    const fetchLimit = Math.min(240, (page + 1) * limit);
    const q = await db.collection('donationHistory').where('donorId', '==', userId).limit(fetchLimit).get();
    const all = q.docs
      .map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, isAdminUser(user)) }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    const start = page * limit;
    const items = all.slice(start, start + limit);
    const hasMore = all.length > (start + limit) && fetchLimit < 240;
    return respondOk({ items, nextCursor: hasMore ? String(page + 1) : null });
  }

  return null;
}
