export async function handleAdminLegacyAction(action, ctx) {
  const {
    user,
    db,
    payload,
    requireAuth,
    requireAdmin,
    respondOk,
    respondFail,
    sanitizeRequestData,
    legacyReadBlocked,
    isAdminUser
  } = ctx;

  const ALLOW_LEGACY_FULL_READS = process.env.ALLOW_LEGACY_FULL_READS === 'true';

  if (action === 'getAllUsers') {
    requireAuth(user); requireAdmin(user);
    if (!ALLOW_LEGACY_FULL_READS) {
      const blocked = legacyReadBlocked('getAllUsers');
      return respondFail(blocked.status, blocked.message);
    }
    const q = await db.collection('users').get();
    return respondOk(q.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (action === 'adminBootstrap') {
    requireAuth(user); requireAdmin(user);
    if (!ALLOW_LEGACY_FULL_READS) {
      const blocked = legacyReadBlocked('adminBootstrap');
      return respondFail(blocked.status, blocked.message);
    }
    const [usersQ, foodDonationsQ, foodRequestsQ, bloodRequestsQ, historyQ] = await Promise.all([
      db.collection('users').get(),
      db.collection('foodDonations').orderBy('createdAt', 'desc').get(),
      db.collection('foodRequests').orderBy('createdAt', 'desc').get(),
      db.collection('requests').orderBy('createdAt', 'desc').get(),
      db.collection('donationHistory').get()
    ]);

    const users = usersQ.docs.map((d) => ({ id: d.id, ...d.data() }));
    const foodDonations = foodDonationsQ.docs.map((d) => ({ id: d.id, ...d.data() }));
    const foodRequests = foodRequestsQ.docs.map((d) => ({ id: d.id, ...d.data() }));
    const bloodRequests = bloodRequestsQ.docs.map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, true) }));
    const donationHistory = historyQ.docs.map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, true) }));
    donationHistory.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return respondOk({ users, foodDonations, foodRequests, bloodRequests, donationHistory });
  }

  if (action === 'getAllDonationHistory') {
    requireAuth(user); requireAdmin(user);
    if (!ALLOW_LEGACY_FULL_READS) {
      const blocked = legacyReadBlocked('getAllDonationHistory');
      return respondFail(blocked.status, blocked.message);
    }
    const q = await db.collection('donationHistory').get();
    const data = q.docs.map((d) => ({ id: d.id, ...sanitizeRequestData(d.data(), user.uid, true) }));
    data.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return respondOk(data);
  }

  if (action === 'cleanupOldDonationHistory') {
    requireAuth(user); requireAdmin(user);
    const now = new Date();
    const q = await db.collection('donationHistory').get();
    const batch = db.batch();
    let deleted = 0;
    q.docs.forEach((docSnap) => {
      const d = docSnap.data();
      const ts = d.updatedAt || d.createdAt;
      if (!ts) return;
      const ageDays = Math.floor((now - new Date(ts)) / (1000 * 60 * 60 * 24));
      if (ageDays > 7) {
        batch.delete(docSnap.ref);
        deleted += 1;
      }
    });
    if (deleted > 0) await batch.commit();
    return respondOk({ deleted });
  }

  return null;
}
