export async function handleFoodAction(action, ctx) {
  const { user, db, payload, requireAuth, respondOk, schemas, parsePagination, withCursor } = ctx;

  if (action === 'createFoodDonation') {
    requireAuth(user);
    const data = schemas.createFoodDonation.parse(payload);
    const doc = { ...data, donorId: user.uid, status: 'Available', createdAt: new Date().toISOString() };
    const ref = await db.collection('foodDonations').add(doc);
    return respondOk(ref.id);
  }

  if (action === 'createFoodRequest') {
    requireAuth(user);
    const data = schemas.createFoodRequest.parse(payload);
    const doc = { ...data, requesterId: user.uid, status: 'Open', createdAt: new Date().toISOString() };
    const ref = await db.collection('foodRequests').add(doc);
    return respondOk(ref.id);
  }

  if (action === 'getAllFoodDonations') {
    const q = await db.collection('foodDonations').orderBy('createdAt', 'desc').get();
    return respondOk(q.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (action === 'getFoodDonationsPaged') {
    const { pagination } = schemas.pagedList.parse(payload);
    const { limit, cursor } = parsePagination(pagination, ctx.defaults.publicFoodDonations);
    let query = db.collection('foodDonations').orderBy('createdAt', 'desc').limit(limit);
    query = await withCursor(query, db, 'foodDonations', cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    return respondOk({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : null });
  }

  if (action === 'getAllFoodRequests') {
    const q = await db.collection('foodRequests').orderBy('createdAt', 'desc').get();
    return respondOk(q.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (action === 'getFoodRequestsPaged') {
    const { pagination } = schemas.pagedList.parse(payload);
    const { limit, cursor } = parsePagination(pagination, ctx.defaults.publicFoodRequests);
    let query = db.collection('foodRequests').orderBy('createdAt', 'desc').limit(limit);
    query = await withCursor(query, db, 'foodRequests', cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    return respondOk({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : null });
  }

  return null;
}
