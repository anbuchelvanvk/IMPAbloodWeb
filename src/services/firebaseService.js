import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, appCheck } from '../firebase';
import { getToken } from 'firebase/app-check';
import { generateAvatar } from '../utils/avatarGenerator';
import { idbDeletePrefix, idbGet, idbSet } from './indexedDbCache';

const API_MIN_GAP_MS = 180;
let lastApiAt = 0;
let chain = Promise.resolve();
let cooldownUntil = 0;
const readCache = new Map();
const inFlightReads = new Map();
const READ_ACTION_TTLS_MS = {
  getSessionUser: 20_000,
  getCurrentUser: 20_000,
  getPublicDonors: 60_000,
  getPublicDonorsPaged: 20_000,
  getPublicRequests: 20_000,
  getPublicRequestById: 20_000,
  getAllRequests: 15_000,
  listMyChats: 5_000,
  listChatMessages: 2_500,
  getAllFoodDonations: 30_000,
  getAllFoodRequests: 30_000,
  getUserRequests: 15_000,
  getUserDonations: 15_000,
  getAllDonationHistory: 20_000,
  getActiveChatsCount: 8_000,
  getAllUsers: 20_000,
  getAdminCounts: 20_000,
  adminBootstrap: 15_000
};
const DEFAULT_POLICY = { maxAttempts: 4, timeoutMs: 15_000 };
const ACTION_POLICY = {
  // polling calls should fail fast and never queue long retry chains
  listMyChats: { maxAttempts: 1, timeoutMs: 5_000 },
  listChatMessages: { maxAttempts: 1, timeoutMs: 5_000 },
  listMyChatsPaged: { maxAttempts: 1, timeoutMs: 5_000 },
  getActiveChatsCount: { maxAttempts: 1, timeoutMs: 4_000 },
  getActiveChatsCountFast: { maxAttempts: 1, timeoutMs: 4_000 },
  getUserRequestsPaged: { maxAttempts: 1, timeoutMs: 6_000 },
  getUserDonationsPaged: { maxAttempts: 1, timeoutMs: 6_000 },
  getPublicRequests: { maxAttempts: 1, timeoutMs: 6_000 },
  getPublicRequestsPaged: { maxAttempts: 1, timeoutMs: 6_000 },
  getPublicDonorsPaged: { maxAttempts: 1, timeoutMs: 6_000 },
  // admin bootstrap should retry briefly, but not stall for too long
  adminBootstrap: { maxAttempts: 2, timeoutMs: 10_000 }
};
const AUTH_REQUIRED_ACTIONS = new Set([
  'register',
  'getCurrentUser',
  'updateMyProfile',
  'deleteUser',
  'promoteToAdmin',
  'deleteDocument',
  'createRequest',
  'getAllRequests',
  'verifyRequest',
  'updateRequestStatus',
  'createChatSession',
  'getActiveChatsCount',
  'getActiveChatsCountFast',
  'sendMessage',
  'listMyChats',
  'listMyChatsPaged',
  'listChatMessages',
  'verifyOTPAndFulfill',
  'cancelChat',
  'endChatSession',
  'createFoodDonation',
  'createFoodRequest',
  'getUserRequests',
  'getUserRequestsPaged',
  'getUserDonations',
  'getUserDonationsPaged',
  'getAllUsers',
  'getAllUsersPaged',
  'getAllRequestsPaged',
  'getAllDonationHistory',
  'getAllDonationHistoryPaged',
  'getAdminCounts',
  'cleanupOldDonationHistory',
  'adminBootstrap'
]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSafeError(_err) {
  return new Error('Service is temporarily busy. Please try again in a moment.');
}

function shouldRetryStatus(status) {
  return status === 429 || status >= 500;
}

function getRetryDelayMs(res, attempt) {
  const retryAfter = res?.headers?.get?.('retry-after');
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (Number.isFinite(parsed) && parsed > 0) return parsed * 1000;
  }
  return Math.min(4000, 250 * (2 ** attempt));
}

async function runWithThrottle(fn) {
  const run = async () => {
    const now = Date.now();
    const waitForCooldown = Math.max(0, cooldownUntil - now);
    const waitForGap = Math.max(0, API_MIN_GAP_MS - (now - lastApiAt));
    const wait = Math.max(waitForCooldown, waitForGap);
    if (wait > 0) await delay(wait);
    lastApiAt = Date.now();
    return fn();
  };
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}

async function authHeaders() {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;
  let appCheckToken = null;
  if (appCheck) {
    try {
      appCheckToken = (await getToken(appCheck)).token;
    } catch {
      appCheckToken = null;
    }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
    ,
    ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
  };
}

async function syncServerSession() {
  const user = auth?.currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
}

function readCacheKey(action, payload) {
  return `${action}:${JSON.stringify(payload || {})}`;
}

function maybeGetCachedRead(action, payload) {
  const ttl = READ_ACTION_TTLS_MS[action];
  if (!ttl) return null;
  const key = readCacheKey(action, payload);
  const hit = readCache.get(key);
  if (!hit) return null;
  if ((Date.now() - hit.at) > ttl) {
    readCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedRead(action, payload, value) {
  if (!READ_ACTION_TTLS_MS[action]) return;
  readCache.set(readCacheKey(action, payload), { value, at: Date.now() });
}

function clearReadCache() {
  readCache.clear();
  inFlightReads.clear();
}

async function callApi(action, payload = {}) {
  return runWithThrottle(async () => {
    if (AUTH_REQUIRED_ACTIONS.has(action) && !auth?.currentUser) {
      const e = new Error('Unauthorized');
      e.nonRetryable = true;
      throw e;
    }
    const policy = ACTION_POLICY[action] || DEFAULT_POLICY;
    const { maxAttempts, timeoutMs } = policy;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        let res;
        try {
          res = await fetch('/api/v1', {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify({ action, payload }),
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
        const json = await res.json();
        if (json.ok) return json.data;
        if (!shouldRetryStatus(res.status)) {
          const e = new Error(json?.error || 'Request rejected');
          e.nonRetryable = true;
          throw e;
        }
        const wait = getRetryDelayMs(res, attempt);
        cooldownUntil = Math.max(cooldownUntil, Date.now() + wait);
        if (attempt === maxAttempts - 1) throw new Error('RETRY_EXHAUSTED');
        await delay(wait);
      } catch (err) {
        if (err?.nonRetryable) throw err;
        const isLast = attempt === maxAttempts - 1;
        if (!isLast) {
          const wait = Math.min(4000, 250 * (2 ** attempt));
          cooldownUntil = Math.max(cooldownUntil, Date.now() + wait);
          await delay(wait);
          continue;
        }
        throw toSafeError(err);
      }
    }
    throw toSafeError();
  });
}

async function callApiCached(action, payload = {}) {
  const ttl = READ_ACTION_TTLS_MS[action];
  if (!ttl) return callApi(action, payload);
  const cached = maybeGetCachedRead(action, payload);
  if (cached !== null) return cached;
  const key = readCacheKey(action, payload);
  const pending = inFlightReads.get(key);
  if (pending) return pending;

  const req = callApi(action, payload)
    .then((data) => {
      setCachedRead(action, payload, data);
      return data;
    })
    .finally(() => {
      inFlightReads.delete(key);
    });
  inFlightReads.set(key, req);
  return req;
}

async function collectAllPages(action, payload = {}, pageLimit = 120, maxPages = 30) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < maxPages; i += 1) {
    const page = await callApi(action, { ...payload, pagination: { limit: pageLimit, ...(cursor ? { cursor } : {}) } });
    const items = Array.isArray(page?.items) ? page.items : [];
    out.push(...items);
    if (!page?.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

async function collectCursorPages(action, payload = {}, pageLimit = 80, maxPages = 8) {
  const out = [];
  let cursor = null;
  for (let i = 0; i < maxPages; i += 1) {
    const page = await callApi(action, { ...payload, pagination: { limit: pageLimit, ...(cursor ? { cursor } : {}) } });
    const items = Array.isArray(page?.items) ? page.items : [];
    out.push(...items);
    if (!page?.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

async function readThroughIndexedDb(key, ttlMs, fetcher) {
  const cached = await idbGet(key, ttlMs);
  if (cached !== null) {
    fetcher().then((fresh) => idbSet(key, fresh)).catch(() => {});
    return cached;
  }
  const fresh = await fetcher();
  await idbSet(key, fresh);
  return fresh;
}

export const firebaseService = {
  isAdminUser: (u) => Boolean(u && u.isAdmin === true),

  register: async (userData) => {
    await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    syncServerSession().catch(() => {});
    const created = await callApi('register', userData);
    clearReadCache();
    return created;
  },

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    syncServerSession().catch(() => {});
    clearReadCache();
    return callApiCached('getCurrentUser');
  },

  loginWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const authUser = result.user;
    syncServerSession().catch(() => {});
    clearReadCache();
    const user = await callApiCached('getCurrentUser');
    if (user?.needsRegistration) {
      return {
        needsRegistration: true,
        uid: authUser.uid,
        email: authUser.email,
        name: authUser.displayName || user.name || '',
        photoURL: authUser.photoURL || generateAvatar(authUser.displayName || 'G')
      };
    }
    return user;
  },

  completeGoogleRegistration: async (userData) => {
    syncServerSession().catch(() => {});
    return callApi('register', userData);
  },
  completeProfile: async (userData) => {
    syncServerSession().catch(() => {});
    return callApi('register', userData);
  },

  checkDuplicateUser: async (email, contact) => callApi('checkDuplicateUser', { email, contact }),

  updateUserProfile: async (_userId, updates) => {
    return callApi('updateMyProfile', updates);
  },

  resetPasswordEmail: async (email) => {
    await sendPasswordResetEmail(auth, email);
    return true;
  },

  logout: async () => {
    try { await firebaseSignOut(auth); } catch {}
    await fetch('/api/session', { method: 'DELETE' });
    clearReadCache();
    await idbDeletePrefix('u:');
  },

  getCurrentUser: () => null,
  getSessionUser: async () => {
    const cached = maybeGetCachedRead('getSessionUser', {});
    if (cached !== null) return cached;
    const res = await fetch('/api/session', { method: 'GET' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Failed to load session user');
    setCachedRead('getSessionUser', {}, json.data);
    return json.data;
  },
  refreshServerSession: async () => syncServerSession(),
  refreshCurrentUser: async () => callApiCached('getCurrentUser'),

  getAllUsers: async () => collectAllPages('getAllUsersPaged'),
  getAdminCounts: async () => callApiCached('getAdminCounts'),
  getAllRequestsAdmin: async () => collectAllPages('getAllRequestsPaged'),
  adminBootstrap: async () => ({
    users: await collectAllPages('getAllUsersPaged'),
    foodDonations: await collectAllPages('getFoodDonationsPaged'),
    foodRequests: await collectAllPages('getFoodRequestsPaged'),
    bloodRequests: await collectAllPages('getAllRequestsPaged'),
    donationHistory: await collectAllPages('getAllDonationHistoryPaged')
  }),
  getPublicDonorsPage: async (filters = {}, cursor = null, limit = 80) => {
    return callApi('getPublicDonorsPaged', {
      filters,
      pagination: { limit, ...(cursor ? { cursor } : {}) }
    });
  },
  getPublicDonors: async () => {
    return collectCursorPages('getPublicDonorsPaged', { filters: {} }, 80, 4);
  },
  getPublicRequests: async () => callApiCached('getPublicRequests'),
  getPublicRequestsPage: async (cursor = null, limit = 80) => {
    return callApi('getPublicRequestsPaged', { pagination: { limit, ...(cursor ? { cursor } : {}) } });
  },
  getPublicRequestById: async (requestId) => callApi('getPublicRequestById', { requestId }),
  deleteUser: async (userId) => callApi('deleteUser', { userId }),
  promoteToAdmin: async (userId) => callApi('promoteToAdmin', { userId }),
  createRequest: async (requestData) => callApi('createRequest', requestData),
  getAllRequests: async () => callApiCached('getAllRequests'),
  verifyRequest: async (requestId) => callApi('verifyRequest', { requestId }),
  updateRequestStatus: async (requestId, status, donorId = null) => callApi('updateRequestStatus', { requestId, status, donorId }),
  createChatSession: async (requestId, donorId, requesterId, patientName) => callApi('createChatSession', { requestId, donorId, requesterId, patientName }),
  getActiveChatsCount: async () => {
    const res = await callApiCached('getActiveChatsCountFast');
    return Number(res?.count || 0);
  },
  listMyChatsPage: async (cursor = null, limit = 50) => {
    return callApi('listMyChatsPaged', { pagination: { limit, ...(cursor ? { cursor } : {}) } });
  },
  listMyChats: async (userId) => {
    const key = `u:${userId}:chats:v1`;
    return readThroughIndexedDb(key, 30_000, async () => collectCursorPages('listMyChatsPaged', {}, 50, 4));
  },
  listChatMessagesPage: async (chatId, cursor = null, limit = 80) => {
    return callApi('listChatMessages', { chatId, pagination: { limit, ...(cursor ? { cursor } : {}) } });
  },
  getChatMessageCursor: async (userId, chatId) => {
    return idbGet(`u:${userId}:chat:${chatId}:cursor:v1`, 1000 * 60 * 60 * 24 * 7);
  },
  setChatMessageCursor: async (userId, chatId, cursor) => {
    if (!cursor) return;
    await idbSet(`u:${userId}:chat:${chatId}:cursor:v1`, cursor);
  },
  listChatMessages: async (chatId, userId) => {
    const key = `u:${userId}:chat:${chatId}:msgs:v1`;
    return readThroughIndexedDb(key, 15_000, async () => collectCursorPages('listChatMessages', { chatId }, 80, 5));
  },
  sendMessage: async (chatId, _senderId, text) => callApi('sendMessage', { chatId, text }),

  getUserRequestsPage: async (userId, cursor = null, limit = 80) => {
    return callApi('getUserRequestsPaged', { userId, pagination: { limit, ...(cursor ? { cursor } : {}) } });
  },
  getUserDonationsPage: async (userId, cursor = null, limit = 80) => {
    return callApi('getUserDonationsPaged', { userId, pagination: { limit, ...(cursor ? { cursor } : {}) } });
  },
  getUserRequests: async (userId) => {
    const key = `u:${userId}:requests:v1`;
    return readThroughIndexedDb(key, 120_000, async () => collectCursorPages('getUserRequestsPaged', { userId }, 80, 4));
  },
  getUserDonations: async (userId) => {
    const key = `u:${userId}:donations:v1`;
    return readThroughIndexedDb(key, 120_000, async () => collectCursorPages('getUserDonationsPaged', { userId }, 80, 4));
  },
  getAllDonationHistory: async () => collectAllPages('getAllDonationHistoryPaged'),
  cleanupOldDonationHistory: async () => callApi('cleanupOldDonationHistory'),
  createFoodDonation: async (payload) => callApi('createFoodDonation', payload),
  createFoodRequest: async (payload) => callApi('createFoodRequest', payload),
  getAllFoodDonations: async () => collectAllPages('getFoodDonationsPaged'),
  getAllFoodRequests: async () => collectAllPages('getFoodRequestsPaged'),
  deleteDocument: async (collectionName, id) => callApi('deleteDocument', { collectionName, id }),
  endChatSession: async (chatId) => callApi('endChatSession', { chatId }),
  verifyOTPAndFulfill: async (requestId, chatId, otp) => callApi('verifyOTPAndFulfill', { requestId, chatId, otp }),
  cancelChat: async (chatId) => callApi('cancelChat', { chatId }),

  invalidateAfterMutation: (userId = null) => {
    clearReadCache();
    if (userId) idbDeletePrefix(`u:${userId}:`).catch(() => {});
  }
};
