export async function handleAuthUserAction(action, ctx) {
  const {
    user,
    db,
    payload,
    requireAuth,
    isAdminUser,
    respondOk,
    schemas,
    getAdminAuth,
    sanitizeRequestData
  } = ctx;

  if (action === 'register') {
    requireAuth(user);
    const data = schemas.register.parse(payload);
    const bootstrapAdmins = (process.env.ADMIN_BOOTSTRAP_EMAILS || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const shouldBootstrapAdmin = user.email && bootstrapAdmins.includes(user.email.toLowerCase());
    const doc = {
      ...data,
      email: user.email,
      role: shouldBootstrapAdmin ? 'admin' : 'user',
      isAdmin: shouldBootstrapAdmin,
      createdAt: new Date().toISOString()
    };
    await db.collection('users').doc(user.uid).set(doc, { merge: true });
    if (shouldBootstrapAdmin) {
      await getAdminAuth().setCustomUserClaims(user.uid, { admin: true });
    }
    return respondOk({ id: user.uid, ...doc, isAdmin: user.claims?.admin === true });
  }

  if (action === 'checkDuplicateUser') {
    const { email, contact } = schemas.checkDuplicateUser.parse(payload);
    const [emailQ, contactQ] = await Promise.all([
      db.collection('users').where('email', '==', email).limit(1).get(),
      db.collection('users').where('contact', '==', contact).limit(1).get()
    ]);
    return respondOk(!emailQ.empty || !contactQ.empty);
  }

  if (action === 'getCurrentUser') {
    requireAuth(user);
    const snap = await db.collection('users').doc(user.uid).get();
    const isMissingProfileData = (doc = {}) => (
      !doc?.name ||
      !doc?.contact ||
      !doc?.bloodGroup ||
      !doc?.state ||
      !doc?.district ||
      doc?.faceVerified !== true
    );
    if (!snap.exists) {
      return respondOk({
        needsRegistration: true,
        uid: user.uid,
        email: user.email || '',
        name: user.claims?.name || '',
        isAdmin: user.claims?.admin === true
      });
    }
    const doc = snap.data() || {};
    if (isMissingProfileData(doc)) {
      return respondOk({
        needsRegistration: true,
        uid: user.uid,
        email: user.email || doc.email || '',
        name: doc.name || user.claims?.name || '',
        contact: doc.contact || '',
        bloodGroup: doc.bloodGroup || '',
        state: doc.state || '',
        district: doc.district || '',
        faceVerified: doc.faceVerified === true,
        shareContact: doc.shareContact === true,
        lastDonationDate: doc.lastDonationDate || null,
        nextEligibleDate: doc.nextEligibleDate || null,
        isAdmin: user.claims?.admin === true
      });
    }
    return respondOk({ id: snap.id, ...doc, isAdmin: user.claims?.admin === true });
  }

  if (action === 'updateMyProfile') {
    requireAuth(user);
    const updates = schemas.updateProfile.parse(payload);
    delete updates.isAdmin;
    delete updates.role;
    await db.collection('users').doc(user.uid).set(updates, { merge: true });
    const snap = await db.collection('users').doc(user.uid).get();
    return respondOk({ id: snap.id, ...snap.data(), isAdmin: user.claims?.admin === true });
  }

  if (action === 'getPublicDonors') {
    const blocked = ctx.legacyReadBlocked('getPublicDonors');
    return ctx.respondFail(blocked.status, blocked.message);
  }

  if (action === 'getPublicDonorsPaged') {
    const now = new Date();
    const { pagination, filters } = schemas.donorsPagedList.parse(payload);
    const { limit, cursor } = ctx.parsePagination(pagination, 80);
    let query = db.collection('users').where('shareContact', '==', true);
    if (filters?.bloodGroup) query = query.where('bloodGroup', '==', filters.bloodGroup);
    if (filters?.state) query = query.where('state', '==', filters.state);
    if (filters?.district) query = query.where('district', '==', filters.district);
    query = query.limit(limit);
    query = await ctx.withCursor(query, db, 'users', cursor);
    const q = await query.get();
    const isAuthed = Boolean(user?.uid);
    const items = q.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => !d.nextEligibleDate || new Date(d.nextEligibleDate) <= now)
      .map((d) => {
        if (isAuthed) return { ...d, contactProtected: false };
        return { ...d, contact: null, contactProtected: true };
      });
    return respondOk({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : null });
  }

  if (action === 'deleteUser') {
    requireAuth(user); ctx.requireAdmin(user);
    const { userId } = schemas.deleteUser.parse(payload);
    await db.collection('users').doc(userId).delete();
    return respondOk(true);
  }

  if (action === 'deleteDocument') {
    requireAuth(user); ctx.requireAdmin(user);
    const data = schemas.deleteDocument.parse(payload);
    await db.collection(data.collectionName).doc(data.id).delete();
    return respondOk(true);
  }

  return null;
}
