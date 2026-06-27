export async function handleChatAction(action, ctx) {
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
    withCursor,
    isChatParticipant,
    deleteAllChatMessages,
    sanitizeRequestData,
    otpHashForRequest,
    OTP_MAX_ATTEMPTS
  } = ctx;

  if (action === 'getActiveChatsCount') {
    const blocked = ctx.legacyReadBlocked('getActiveChatsCount');
    return respondFail(blocked.status, blocked.message);
  }

  if (action === 'getActiveChatsCountFast') {
    requireAuth(user);
    const branchLimit = 100;
    const [r1, r2] = await Promise.all([
      db.collection('chats').where('requesterId', '==', user.uid).limit(branchLimit).get(),
      db.collection('chats').where('donorId', '==', user.uid).limit(branchLimit).get()
    ]);
    const map = new Map();
    [...r1.docs, ...r2.docs].forEach((d) => {
      const data = d.data();
      if (!['cancelled', 'ended'].includes(data.status)) map.set(d.id, true);
    });
    return respondOk({ count: map.size, capped: r1.size >= branchLimit || r2.size >= branchLimit });
  }

  if (action === 'createChatSession') {
    requireAuth(user);
    const data = schemas.createChatSession.parse(payload);
    if (user.uid !== data.donorId && user.uid !== data.requesterId) return respondFail(403, 'Not allowed for this chat');
    const doc = { ...data, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const ref = await db.collection('chats').add(doc);
    return respondOk(ref.id);
  }

  if (action === 'sendMessage') {
    requireAuth(user);
    const data = schemas.sendMessage.parse(payload);
    const chatRef = db.collection('chats').doc(data.chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return respondFail(404, 'Chat not found');
    const chat = chatSnap.data();
    if (!isChatParticipant(chat, user.uid) && !isAdminUser(user)) return respondFail(403, 'Not a participant');
    await db.collection(`chats/${data.chatId}/messages`).add({ senderId: user.uid, text: data.text, createdAt: new Date().toISOString() });
    await chatRef.set({ updatedAt: new Date().toISOString() }, { merge: true });
    return respondOk(true);
  }

  if (action === 'listMyChats') {
    const blocked = ctx.legacyReadBlocked('listMyChats');
    return respondFail(blocked.status, blocked.message);
  }

  if (action === 'listMyChatsPaged') {
    requireAuth(user);
    const { pagination } = schemas.pagedList.parse(payload);
    const { limit } = parsePagination(pagination, ctx.defaults.myChats);
    const page = parsePageCursor(pagination?.cursor);
    const fetchLimit = Math.min(200, (page + 1) * limit);
    const [r1, r2] = await Promise.all([
      db.collection('chats').where('requesterId', '==', user.uid).limit(fetchLimit).get(),
      db.collection('chats').where('donorId', '==', user.uid).limit(fetchLimit).get()
    ]);
    const map = new Map();
    [...r1.docs, ...r2.docs].forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
    const merged = Array.from(map.values())
      .filter((c) => c.status !== 'cancelled')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    const start = page * limit;
    const items = merged.slice(start, start + limit);
    const hasMore = merged.length > (start + limit) && fetchLimit < 200;
    return respondOk({ items, nextCursor: hasMore ? String(page + 1) : null });
  }

  if (action === 'listChatMessages') {
    requireAuth(user);
    const { chatId, pagination } = schemas.listChatMessages.parse(payload);
    const chatSnap = await db.collection('chats').doc(chatId).get();
    if (!chatSnap.exists) return respondFail(404, 'Chat not found');
    const chat = chatSnap.data();
    if (!isChatParticipant(chat, user.uid) && !isAdminUser(user)) return respondFail(403, 'Not a participant');
    const { limit, cursor } = parsePagination(pagination, ctx.defaults.chatMessages);
    let query = db.collection(`chats/${chatId}/messages`).orderBy('createdAt', 'asc').limit(limit);
    query = await withCursor(query, db, `chats/${chatId}/messages`, cursor);
    const q = await query.get();
    const items = q.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (pagination) return respondOk({ items, nextCursor: items.length > 0 ? items[items.length - 1].id : null });
    return respondOk(items);
  }

  if (action === 'verifyOTPAndFulfill') {
    requireAuth(user);
    const data = schemas.verifyOtpFulfill.parse(payload);
    const chatRef = db.collection('chats').doc(data.chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return respondFail(404, 'Chat not found');
    const chat = chatSnap.data();
    if (!isChatParticipant(chat, user.uid) && !isAdminUser(user)) return respondFail(403, 'Not a participant');

    const requestRef = db.collection('requests').doc(data.requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return respondFail(404, 'Request not found');
    const requestData = requestSnap.data();
    const effectiveDonorId = chat.donorId;
    const isAdmin = isAdminUser(user);
    if (!effectiveDonorId) return respondFail(400, 'Chat donor is missing');
    if (!isAdmin && user.uid !== effectiveDonorId) return respondFail(403, 'Only assigned donor can fulfill');

    const otpRef = db.collection('requestOtps').doc(data.requestId);
    const otpSnap = await otpRef.get();
    if (!otpSnap.exists) return respondFail(400, 'OTP not available');
    const otpRecord = otpSnap.data();
    if (new Date(otpRecord.expiresAt).getTime() < Date.now()) return respondFail(400, 'OTP expired');
    if (Number(otpRecord.attempts || 0) >= Number(otpRecord.maxAttempts || OTP_MAX_ATTEMPTS)) return respondFail(429, 'OTP attempts exceeded');

    const providedHash = otpHashForRequest(data.requestId, data.otp);
    const valid = providedHash === otpRecord.hash;
    if (!valid) {
      await otpRef.set({ attempts: Number(otpRecord.attempts || 0) + 1, updatedAt: new Date().toISOString() }, { merge: true });
      return respondFail(400, 'Invalid OTP');
    }

    await db.collection('donationHistory').add({ ...requestData, status: 'Fulfilled', donorId: effectiveDonorId, updatedAt: new Date().toISOString() });
    await requestRef.delete();
    await otpRef.delete();
    await deleteAllChatMessages(db, data.chatId);
    await chatRef.delete();

    const today = new Date();
    const nextEligible = new Date(today);
    nextEligible.setDate(today.getDate() + 90);
    await db.collection('users').doc(effectiveDonorId).set({ lastDonationDate: today.toISOString(), nextEligibleDate: nextEligible.toISOString() }, { merge: true });

    return respondOk(true);
  }

  if (action === 'cancelChat' || action === 'endChatSession') {
    requireAuth(user);
    const { chatId } = schemas.cancelChat.parse(payload);
    const chatRef = db.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) return respondOk(true);
    const chat = chatSnap.data();
    if (!isChatParticipant(chat, user.uid) && !isAdminUser(user)) return respondFail(403, 'Not a participant');
    await deleteAllChatMessages(db, chatId);
    await chatRef.delete();
    return respondOk(true);
  }

  return null;
}
