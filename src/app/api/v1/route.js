import crypto from 'node:crypto';
import { getAdminAppCheck, getAdminAuth, getAdminDb } from '../../../server/firebaseAdmin';
import { getUserFromRequest, isAdminUser, requireAuth, requireAdmin } from '../../../server/apiAuth';
import { schemas } from '../../../server/validators';
import { ok, fail, sanitizeErrorMessage } from '../../../server/apiV1/core/responses';
import { parsePagination, withCursor, paged, parsePageCursor } from '../../../server/apiV1/core/pagination';
import { enforceRateLimit, limitsFor } from '../../../server/apiV1/core/rateLimit';
import { getClientIp, makeResponders } from '../../../server/apiV1/core/telemetry';
import { handleAdminPagedAction } from '../../../server/apiV1/handlers/adminPagedActions';
import { handleAuthUserAction } from '../../../server/apiV1/handlers/authUserActions';
import { handleRequestAction } from '../../../server/apiV1/handlers/requestActions';
import { handleChatAction } from '../../../server/apiV1/handlers/chatActions';
import { handleFoodAction } from '../../../server/apiV1/handlers/foodActions';
import { handleUserAction } from '../../../server/apiV1/handlers/userActions';
import { handleAdminLegacyAction } from '../../../server/apiV1/handlers/adminLegacyActions';

const ENFORCE_APPCHECK = process.env.ENFORCE_APPCHECK === 'true';
const OTP_TTL_MS = 1000 * 60 * 15;
const OTP_MAX_ATTEMPTS = 5;

const DEFAULT_LIMITS = {
  publicRequests: 80,
  adminRequests: 120,
  adminUsers: 120,
  adminDonationHistory: 120,
  publicFoodDonations: 80,
  publicFoodRequests: 80,
  chatMessages: 80,
  myChats: 50,
  userRequests: 80,
  userDonations: 80
};

function otpHashForRequest(requestId, otp) {
  const secret = process.env.OTP_SECRET || process.env.FIREBASE_PROJECT_ID || 'blood-donation-otp';
  return crypto.createHmac('sha256', secret).update(`${requestId}:${String(otp).trim()}`).digest('hex');
}

function sanitizeRequestData(data, viewerUid, admin) {
  const isOwner = data?.requesterId === viewerUid;
  const isDonor = data?.donorId === viewerUid;
  return {
    ...data,
    otp: undefined,
    requesterId: admin || isOwner || isDonor ? data.requesterId : undefined
  };
}

async function verifyAppCheck(req) {
  if (!ENFORCE_APPCHECK) return;
  const token = req.headers.get('x-firebase-appcheck');
  if (!token) throw new Error('APPCHECK_MISSING');
  await getAdminAppCheck().verifyToken(token);
}

function isChatParticipant(chat, uid) {
  return chat && (chat.donorId === uid || chat.requesterId === uid);
}

async function deleteAllChatMessages(db, chatId) {
  const messagesSnap = await db.collection(`chats/${chatId}/messages`).get();
  if (messagesSnap.empty) return;
  const batch = db.batch();
  messagesSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

function isMissingIndexError(err) {
  return Boolean(
    err && (
      err.code === 9 ||
      String(err?.message || '').includes('FAILED_PRECONDITION') ||
      String(err?.details || '').includes('requires an index')
    )
  );
}

function legacyReadBlocked(action) {
  return {
    status: 410,
    message: `Legacy full-read action '${action}' is disabled. Use paged action variants.`
  };
}

const ACTION_SET = new Set([
  'register', 'checkDuplicateUser', 'getCurrentUser', 'updateMyProfile', 'getPublicDonors', 'getPublicDonorsPaged', 'deleteUser', 'deleteDocument', 'promoteToAdmin',
  'createRequest', 'getAllRequests', 'getPublicRequests', 'getPublicRequestsPaged', 'getPublicRequestById', 'verifyRequest', 'updateRequestStatus',
  'createChatSession', 'getActiveChatsCount', 'getActiveChatsCountFast', 'sendMessage', 'listMyChats', 'listMyChatsPaged', 'listChatMessages', 'verifyOTPAndFulfill', 'cancelChat', 'endChatSession',
  'createFoodDonation', 'createFoodRequest', 'getAllFoodDonations', 'getFoodDonationsPaged', 'getAllFoodRequests', 'getFoodRequestsPaged',
  'getUserRequests', 'getUserRequestsPaged', 'getUserDonations', 'getUserDonationsPaged',
  'getAllRequestsPaged', 'getAllUsersPaged', 'getAllDonationHistoryPaged', 'getAdminCounts',
  'getAllUsers', 'adminBootstrap', 'getAllDonationHistory', 'cleanupOldDonationHistory'
]);

const HANDLERS = [
  handleAdminPagedAction,
  handleAuthUserAction,
  handleRequestAction,
  handleChatAction,
  handleFoodAction,
  handleUserAction,
  handleAdminLegacyAction
];

export async function POST(req) {
  const actionRef = { current: 'unknown' };
  const uidRef = { current: 'anon' };
  const ip = getClientIp(req);
  const { respondOk, respondFail } = makeResponders({ actionRef, uidRef, ip, ok, fail });

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return respondFail(400, 'Invalid request body');
    }
    const action = typeof body?.action === 'string' ? body.action : 'unknown';
    actionRef.current = action;
    const payload = body?.payload || {};

    if (!ACTION_SET.has(action)) return respondFail(400, 'Unsupported action');

    const anonLimits = limitsFor(action, false);
    enforceRateLimit(`ip:${ip}:action:${action}`, anonLimits.ip);

    await verifyAppCheck(req);
    const user = await getUserFromRequest(req);
    uidRef.current = user?.uid || 'anon';
    if (user?.uid) {
      const authLimits = limitsFor(action, true);
      enforceRateLimit(`uid:${user.uid}:action:${action}`, authLimits.uid);
    }

    const ctx = {
      action,
      user,
      db: getAdminDb(),
      payload,
      schemas,
      requireAuth,
      requireAdmin,
      isAdminUser,
      respondOk,
      respondFail,
      sanitizeRequestData,
      parsePagination,
      parsePageCursor,
      withCursor,
      paged,
      defaults: DEFAULT_LIMITS,
      otpHashForRequest,
      OTP_TTL_MS,
      OTP_MAX_ATTEMPTS,
      isMissingIndexError,
      legacyReadBlocked,
      isChatParticipant,
      deleteAllChatMessages,
      getAdminAuth
    };

    for (const handler of HANDLERS) {
      const out = await handler(action, ctx);
      if (out) return out;
    }

    return respondFail(400, 'Unsupported action');
  } catch (err) {
    const safe = sanitizeErrorMessage(err);
    if (safe.status >= 500) console.error('[api/v1] Internal error', err);
    return respondFail(safe.status, safe.message);
  }
}
