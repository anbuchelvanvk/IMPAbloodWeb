const DB_NAME = 'bdw-local-cache';
const STORE = 'kv';
const VERSION = 1;

function hasIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) return resolve(null);
    const req = window.indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key, ttlMs) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onsuccess = () => {
      const row = req.result;
      if (!row) return resolve(null);
      if (ttlMs && (Date.now() - row.at) > ttlMs) return resolve(null);
      resolve(row.value ?? null);
    };
    req.onerror = () => resolve(null);
  });
}

export async function idbSet(key, value) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key, value, at: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function idbDeletePrefix(prefix) {
  const db = await openDb();
  if (!db) return;
  await new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = (ev) => {
      const cursor = ev.target.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
