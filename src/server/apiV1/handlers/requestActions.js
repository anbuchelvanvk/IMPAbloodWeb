export async function handleRequestAction(action, ctx) {
  const {
    user,
    db,
    payload,
    requireAuth,
    isAdminUser,
    respondOk,
    respondFail,
    schemas,
    sanitizeRequestData,
    otpHashForRequest,
    OTP_TTL_MS,
    OTP_MAX_ATTEMPTS,
    parsePagination,
    withCursor,
    isMissingIndexError
  } = ctx;

  if (action === 'createRequest') {
    requireAuth(user);
    const data = schemas.createRequest.parse(payload);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const resolvedAddress = (data.address || data.hospitalName || 'N/A').trim();
    const now = new Date().toISOString();
    const doc = {
      ...data,
      address: resolvedAddress,
      requesterId: user.uid,
      requesterName: data.requesterName || user.profile?.name || user.email,
      status: 'Pending',
      isVerified: false,
      createdAt: now,
      updatedAt: now
    };
    const ref = await db.collection('requests').add(doc);
    await db.collection('requestOtps').doc(ref.id).set({
      hash: otpHashForRequest(ref.id, otp),
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      createdAt: now,
      updatedAt: now
    });
    return respondOk({ id: ref.id, ...sanitizeRequestData(doc, user.uid, isAdminUser(user)) });
  }

  if (action === 'getAllRequests') {
    requireAuth(user);
    if (isAdminUser(user)) {
      const blocked = ctx.legacyReadBlocked('getAllRequests');
      return respondFail(blocked.status, blocked.message);
    }
    const [mine, assigned] = await Promise.all([
      db.collection('requests').where('requesterId', '==', user.uid).get(),
      db.collection('requests').where('donorId', '==', user.uid).get()
    ]);
    const scoped = new Map();
    [...mine.docs, ...assigned.docs].forEach((d) => {
      scoped.set(d.id, { id: d.id, ...sanitizeRequestData(d.data(), user.uid, false) });
    });
    const data = Array.from(scoped.values());
    data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return respondOk(data);
  }

  if (action === 'getPublicRequests') {
    const blocked = ctx.legacyReadBlocked('getPublicRequests');
    return respondFail(blocked.status, blocked.message);
  }

  if (action === 'getPublicRequestsPaged') {
    const { pagination } = schemas.pagedList.parse(payload);
    const { limit, cursor } = parsePagination(pagination, ctx.defaults.publicRequests);
    const toPublicItem = (doc) => {
      const safe = sanitizeRequestData(doc.data(), null, false);
      return {
        id: doc.id,
        patientName: safe.patientName,
        bloodGroup: safe.bloodGroup,
        units: safe.units,
        hospitalName: safe.hospitalName,
        diagnosis: safe.diagnosis,
        district: safe.district,
        state: safe.state,
        urgency: safe.urgency,
        status: safe.status,
        requesterName: safe.requesterName,
        createdAt: safe.createdAt,
        hasProofImage: Boolean(safe.proofImage),
        isVerified: safe.isVerified === true
      };
    };
    try {
      let query = db.collection('requests').where('status', '==', 'Open').orderBy('createdAt', 'desc').limit(limit);
      query = await withCursor(query, db, 'requests', cursor);
      const q = await query.get();
      const items = q.docs.map(toPublicItem);
      return respondOk({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : null });
    } catch (err) {
      if (isMissingIndexError(err)) return respondFail(503, 'Service is warming up. Please try again shortly.');
      throw err;
    }
  }

  if (action === 'getPublicRequestById') {
    const { requestId } = schemas.requestById.parse(payload);
    const snap = await db.collection('requests').doc(requestId).get();
    if (!snap.exists) return respondFail(404, 'Request not found');
    const safe = sanitizeRequestData(snap.data(), null, false);
    if (safe.status !== 'Open') return respondFail(404, 'Request not found');
    return respondOk({
      id: snap.id,
      patientName: safe.patientName,
      bloodGroup: safe.bloodGroup,
      units: safe.units,
      hospitalName: safe.hospitalName,
      diagnosis: safe.diagnosis,
      district: safe.district,
      state: safe.state,
      urgency: safe.urgency,
      status: safe.status,
      requesterName: safe.requesterName,
      createdAt: safe.createdAt,
      proofImage: safe.proofImage || null,
      isVerified: safe.isVerified === true
    });
  }

  if (action === 'verifyRequest') {
    requireAuth(user); ctx.requireAdmin(user);
    const { requestId } = schemas.verifyRequest.parse(payload);
    await db.collection('requests').doc(requestId).set({ status: 'Open', isVerified: true, updatedAt: new Date().toISOString(), proofImage: null }, { merge: true });
    return respondOk(true);
  }

  if (action === 'updateRequestStatus') {
    requireAuth(user);
    const data = schemas.updateRequestStatus.parse(payload);
    const requestRef = db.collection('requests').doc(data.requestId);
    const reqSnap = await requestRef.get();
    if (!reqSnap.exists) return respondFail(404, 'Request not found');
    const reqData = reqSnap.data();

    const admin = isAdminUser(user);
    const isRequester = reqData.requesterId === user.uid;
    const isCurrentDonor = reqData.donorId === user.uid;

    if (data.status === 'Accepted') {
      if (!admin && data.donorId !== user.uid) return respondFail(403, 'Only accepting donor can claim request');
    } else if (data.status === 'Open') {
      if (!admin && !isRequester && !isCurrentDonor) return respondFail(403, 'Forbidden status transition');
    } else if (data.status === 'Fulfilled') {
      if (!admin && !isCurrentDonor) return respondFail(403, 'Only assigned donor can fulfill');
    } else if (!admin) {
      return respondFail(403, 'Only admin can set this status');
    }

    const patch = { status: data.status, donorId: data.donorId || reqData.donorId || null, updatedAt: new Date().toISOString() };

    if (data.status === 'Fulfilled') {
      const donorId = data.donorId || reqData.donorId || user.uid;
      await db.collection('donationHistory').add({ ...reqData, status: 'Fulfilled', donorId, updatedAt: new Date().toISOString() });
      await requestRef.delete();
      return respondOk(true);
    }

    await db.collection('requests').doc(data.requestId).set(patch, { merge: true });
    return respondOk(true);
  }

  return null;
}
