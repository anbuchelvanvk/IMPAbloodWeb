import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3401';
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'demo-blooddonationweb';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status < 500) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Server did not become ready: ${url}`);
}

async function signUpAndGetToken(email, password) {
  const res = await fetch(`http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`signUp failed: ${JSON.stringify(json)}`);
  return { uid: json.localId, idToken: json.idToken };
}

async function api(action, payload, idToken) {
  const res = await fetch(`${BASE_URL}/api/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
    },
    body: JSON.stringify({ action, payload })
  });
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`API ${action} failed: status=${res.status} error=${json.error}`);
  }
  return json.data;
}

async function apiExpectFail(action, payload, idToken, expectedStatus) {
  const res = await fetch(`${BASE_URL}/api/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
    },
    body: JSON.stringify({ action, payload })
  });
  const json = await res.json();
  if (res.status !== expectedStatus) {
    throw new Error(`API ${action} expected status=${expectedStatus} got=${res.status} body=${JSON.stringify(json)}`);
  }
  return json;
}

async function setAdminClaim(uid) {
  const mod = await import('firebase-admin');
  const admin = mod.default || mod;
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: PROJECT_ID,
      credential: admin.credential.applicationDefault()
    });
  }
  await admin.auth().setCustomUserClaims(uid, { admin: true });
}

async function main() {
  const server = spawn('npx', ['next', 'start', '-p', '3401'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ENFORCE_APPCHECK: 'false',
      NEXT_PUBLIC_DISABLE_APPCHECK: 'true',
      API_RATE_LIMIT_PUBLIC_IP: '30',
      API_RATE_LIMIT_PUBLIC_UID: '50',
      API_RATE_LIMIT_AUTHREAD_IP: '40',
      API_RATE_LIMIT_AUTHREAD_UID: '80',
      API_RATE_LIMIT_MUTATION_IP: '25',
      API_RATE_LIMIT_MUTATION_UID: '40',
      FIREBASE_PROJECT_ID: PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID
    }
  });

  server.stdout.on('data', (d) => process.stdout.write(`[next] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[next-err] ${d}`));

  try {
    await waitForServer(`${BASE_URL}/login`);

    const adminUser = await signUpAndGetToken('admin-e2e@test.local', 'Passw0rd!');
    const normalUser = await signUpAndGetToken('user-e2e@test.local', 'Passw0rd!');

    await setAdminClaim(adminUser.uid);

    const adminSignIn = await fetch(`http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin-e2e@test.local', password: 'Passw0rd!', returnSecureToken: true })
    });
    const adminSignInJson = await adminSignIn.json();
    assert(adminSignIn.ok, `admin signIn failed: ${JSON.stringify(adminSignInJson)}`);

    const userSignIn = await fetch(`http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user-e2e@test.local', password: 'Passw0rd!', returnSecureToken: true })
    });
    const userSignInJson = await userSignIn.json();
    assert(userSignIn.ok, `user signIn failed: ${JSON.stringify(userSignInJson)}`);

    const adminToken = adminSignInJson.idToken;
    const userToken = userSignInJson.idToken;

    await api('register', {
      name: 'Admin E2E',
      email: 'admin-e2e@test.local',
      contact: '9999999999',
      bloodGroup: 'O+',
      state: 'Tamil Nadu',
      district: 'Chennai',
      shareContact: true,
      faceVerified: true
    }, adminToken);

    await api('register', {
      name: 'User E2E',
      email: 'user-e2e@test.local',
      contact: '8888888888',
      bloodGroup: 'A+',
      state: 'Tamil Nadu',
      district: 'Chennai',
      shareContact: true,
      faceVerified: true
    }, userToken);

    const createdRequest = await api('createRequest', {
      patientName: 'Patient E2E',
      diagnosis: 'Test diagnosis',
      bloodGroup: 'A+',
      units: 1,
      state: 'Tamil Nadu',
      district: 'Chennai',
      address: 'Hospital Street',
      hospitalName: 'E2E Hospital',
      contactNumber: '7777777777',
      gender: 'Male',
      urgency: 'Emergency',
      proofImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/',
      requesterName: 'User E2E'
    }, userToken);

    assert(createdRequest?.id, 'createRequest did not return id');
    assert(createdRequest?.proofImage, 'createRequest proofImage missing in response');

    const adminRequests = await api('getAllRequestsPaged', { pagination: { limit: 20 } }, adminToken);
    const pending = (adminRequests.items || []).find((r) => r.id === createdRequest.id);
    assert(pending, 'Admin cannot see created request');
    assert(Boolean(pending.proofImage), 'Proof image missing before verify');

    await api('verifyRequest', { requestId: createdRequest.id }, adminToken);

    const adminRequestsAfterVerify = await api('getAllRequestsPaged', { pagination: { limit: 20 } }, adminToken);
    const verifiedReq = (adminRequestsAfterVerify.items || []).find((r) => r.id === createdRequest.id);
    assert(verifiedReq, 'Verified request missing from admin list');
    assert(Boolean(verifiedReq.proofImage), 'Proof image was unexpectedly cleared after verify');

    const publicPage = await api('getPublicRequestsPaged', { pagination: { limit: 20 } }, null);
    const openReq = (publicPage.items || []).find((r) => r.id === createdRequest.id);
    assert(openReq, 'Verified request not visible in public requests');
    assert(typeof publicPage.nextCursor !== 'undefined', 'Public paged response missing nextCursor key');

    const scopedLegacy = await api('getAllRequests', {}, userToken);
    assert(Array.isArray(scopedLegacy), 'User legacy scoped getAllRequests should return array');
    await apiExpectFail('getAllRequests', {}, adminToken, 410);

    await api('updateRequestStatus', { requestId: createdRequest.id, status: 'Accepted', donorId: adminUser.uid }, adminToken);
    await api('createChatSession', {
      requestId: createdRequest.id,
      donorId: adminUser.uid,
      requesterId: normalUser.uid,
      patientName: 'Patient E2E'
    }, adminToken);

    const adminChats = await api('listMyChatsPaged', { pagination: { limit: 20 } }, adminToken);
    const userChats = await api('listMyChatsPaged', { pagination: { limit: 20 } }, userToken);
    assert((adminChats.items || []).length > 0, 'Admin has no chat after createChatSession');
    assert((userChats.items || []).length > 0, 'User has no chat after createChatSession');
    assert(typeof adminChats.nextCursor !== 'undefined', 'Chat paged response missing nextCursor key');

    const chatId = adminChats.items[0].id;
    const fastCount = await api('getActiveChatsCountFast', {}, adminToken);
    assert(Number(fastCount.count) >= 1, 'Fast chat count did not detect active chat');
    await api('sendMessage', { chatId, text: 'Hello from admin donor' }, adminToken);
    await api('sendMessage', { chatId, text: 'Hello from requester' }, userToken);

    const msgs = await api('listChatMessages', { chatId, pagination: { limit: 20 } }, adminToken);
    assert((msgs.items || []).length >= 2, 'Chat messages were not persisted');
    assert(typeof msgs.nextCursor !== 'undefined', 'Chat messages paged response missing nextCursor key');

    const userReqPage = await api('getUserRequestsPaged', { userId: normalUser.uid, pagination: { limit: 20 } }, userToken);
    assert((userReqPage.items || []).some((r) => r.id === createdRequest.id), 'User requests paged does not include created request');
    const userDonPage = await api('getUserDonationsPaged', { userId: normalUser.uid, pagination: { limit: 20 } }, userToken);
    assert(Array.isArray(userDonPage.items), 'User donations paged should return items array');

    await apiExpectFail('listMyChats', {}, adminToken, 410);
    await apiExpectFail('getActiveChatsCount', {}, adminToken, 410);

    const counts = await api('getAdminCounts', {}, adminToken);
    assert(Number.isFinite(counts.users), 'Admin counts users missing');

    for (let i = 0; i < 31; i += 1) {
      const res = await fetch(`${BASE_URL}/api/v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkDuplicateUser', payload: { email: `rate-${i}@test.local`, contact: `9${String(i).padStart(9, '0')}` } })
      });
      if (i < 30) {
        assert(res.status !== 429, `Rate limit triggered too early at iteration ${i}`);
      } else {
        assert(res.status === 429, `Rate limit did not trigger at iteration ${i}`);
      }
    }

    console.log('\nE2E RESULT: PASS');
    console.log(`Created request: ${createdRequest.id}`);
    console.log(`Chat id: ${chatId}`);
    console.log(`Message count: ${(msgs.items || []).length}`);
  } finally {
    server.kill('SIGINT');
    await delay(1200);
  }
}

main().catch((err) => {
  console.error('\nE2E RESULT: FAIL');
  console.error(err);
  process.exit(1);
});
