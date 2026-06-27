const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_IP_ACTION = Number(process.env.API_RATE_LIMIT_MAX_PER_IP_ACTION || 90);
const RATE_LIMIT_MAX_PER_UID_ACTION = Number(process.env.API_RATE_LIMIT_MAX_PER_UID_ACTION || 180);

const PUBLIC_ACTIONS = new Set([
  'getPublicDonors',
  'getPublicRequests',
  'checkDuplicateUser'
]);

const rateLimitBuckets = globalThis.__bdwRateLimitBuckets || new Map();
globalThis.__bdwRateLimitBuckets = rateLimitBuckets;

export function enforceRateLimit(key, maxRequests) {
  const now = Date.now();
  if (rateLimitBuckets.size > 10_000) {
    for (const [k, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(k);
    }
  }

  const existing = rateLimitBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  existing.count += 1;
  if (existing.count > maxRequests) throw new Error('RATE_LIMITED');
}

function classifyAction(action) {
  if (['register', 'createRequest', 'sendMessage', 'createChatSession', 'verifyOTPAndFulfill', 'createFoodDonation', 'createFoodRequest', 'updateRequestStatus', 'deleteUser', 'deleteDocument', 'verifyRequest'].includes(action)) return 'mutation';
  if (['adminBootstrap', 'getAllUsersPaged', 'getAllRequestsPaged', 'getAllDonationHistoryPaged', 'cleanupOldDonationHistory', 'getAdminCounts', 'getAllUsers', 'getAllDonationHistory'].includes(action)) return 'admin';
  if (PUBLIC_ACTIONS.has(action) || action === 'getPublicRequestsPaged') return 'public_read';
  return 'auth_read';
}

export function limitsFor(action, isAuthenticated) {
  const cls = classifyAction(action);
  if (cls === 'public_read') {
    return {
      ip: Number(process.env.API_RATE_LIMIT_PUBLIC_IP || Math.min(RATE_LIMIT_MAX_PER_IP_ACTION, 80)),
      uid: Number(process.env.API_RATE_LIMIT_PUBLIC_UID || Math.min(RATE_LIMIT_MAX_PER_UID_ACTION, 120))
    };
  }
  if (cls === 'mutation') {
    return {
      ip: Number(process.env.API_RATE_LIMIT_MUTATION_IP || Math.max(12, Math.floor(RATE_LIMIT_MAX_PER_IP_ACTION / 4))),
      uid: Number(process.env.API_RATE_LIMIT_MUTATION_UID || Math.max(30, Math.floor(RATE_LIMIT_MAX_PER_UID_ACTION / 4)))
    };
  }
  if (cls === 'admin') {
    return {
      ip: Number(process.env.API_RATE_LIMIT_ADMIN_IP || Math.max(10, Math.floor(RATE_LIMIT_MAX_PER_IP_ACTION / 5))),
      uid: Number(process.env.API_RATE_LIMIT_ADMIN_UID || Math.max(20, Math.floor(RATE_LIMIT_MAX_PER_UID_ACTION / 6)))
    };
  }
  return {
    ip: Number(process.env.API_RATE_LIMIT_AUTHREAD_IP || Math.max(30, Math.floor(RATE_LIMIT_MAX_PER_IP_ACTION / 2))),
    uid: Number(process.env.API_RATE_LIMIT_AUTHREAD_UID || (isAuthenticated ? RATE_LIMIT_MAX_PER_UID_ACTION : 0))
  };
}
