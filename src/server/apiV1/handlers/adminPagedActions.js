export async function handleAdminPagedAction(action, ctx) {
  const {
    user,
    db,
    requireAuth,
    requireAdmin,
    sanitizeRequestData,
    parsePagination,
    withCursor,
    paged,
    schemas,
    defaults,
    respondOk
  } = ctx;

  if (action === 'getAllRequestsPaged') {
    requireAuth(user); requireAdmin(user);
    const { pagination } = schemas.pagedList.parse(ctx.payload);
    const { limit, cursor } = parsePagination(pagination, defaults.adminRequests);
    let query = db.collection('requests').orderBy('createdAt', 'desc').limit(limit);
    query = await withCursor(query, db, 'requests', cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, true) }));
    return respondOk(paged(items));
  }

  if (action === 'getAdminCounts') {
    requireAuth(user); requireAdmin(user);
    const [usersAgg, requestsAgg, donationAgg, foodDonationsAgg, foodRequestsAgg] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('requests').count().get(),
      db.collection('donationHistory').count().get(),
      db.collection('foodDonations').count().get(),
      db.collection('foodRequests').count().get()
    ]);
    return respondOk({
      users: Number(usersAgg.data().count || 0),
      requests: Number(requestsAgg.data().count || 0),
      donationHistory: Number(donationAgg.data().count || 0),
      foodDonations: Number(foodDonationsAgg.data().count || 0),
      foodRequests: Number(foodRequestsAgg.data().count || 0)
    });
  }

  if (action === 'getAllUsersPaged') {
    requireAuth(user); requireAdmin(user);
    const { pagination } = schemas.pagedList.parse(ctx.payload);
    const { limit, cursor } = parsePagination(pagination, defaults.adminUsers);
    let query = db.collection('users').orderBy('createdAt', 'desc').limit(limit);
    query = await withCursor(query, db, 'users', cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    return respondOk(paged(items));
  }

  if (action === 'getAllDonationHistoryPaged') {
    requireAuth(user); requireAdmin(user);
    const { pagination } = schemas.pagedList.parse(ctx.payload);
    const { limit, cursor } = parsePagination(pagination, defaults.adminDonationHistory);
    let query = db.collection('donationHistory').orderBy('createdAt', 'desc').limit(limit);
    query = await withCursor(query, db, 'donationHistory', cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, true) }));
    return respondOk(paged(items));
  }

  return null;
}
