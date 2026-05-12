/**
 * IndexedDB Draft Store — local-first resilience for in-progress edits.
 * Prevents data loss during flaky internet, accidental navigation, crashes.
 * Client-only. No server interaction. Pure IndexedDB.
 */

const DB_NAME    = "workspace-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

export interface Draft<T = unknown> {
  key:       string;    // "<entityKind>:<entityId>" or "<entityKind>:new"
  data:      T;
  savedAt:   number;    // Date.now()
  expiresAt: number;    // ms since epoch — drafts auto-expire
}

const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days

// ─── DB initialization ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("expiresAt", "expiresAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveDraft<T>(key: string, data: T): Promise<void> {
  const db    = await openDB();
  const draft: Draft<T> = {
    key,
    data,
    savedAt:   Date.now(),
    expiresAt: Date.now() + DRAFT_TTL_MS,
  };
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.put(draft);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadDraft<T>(key: string): Promise<Draft<T> | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(key);
    req.onsuccess = () => {
      const draft = req.result as Draft<T> | undefined;
      if (!draft || draft.expiresAt < Date.now()) {
        resolve(null);
      } else {
        resolve(draft);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function clearDraft(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Prune expired ───────────────────────────────────────────────────────────

export async function pruneExpiredDrafts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const idx   = store.index("expiresAt");
    const range = IDBKeyRange.upperBound(Date.now());
    const req   = idx.openCursor(range);
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) { cursor.delete(); cursor.continue(); }
      else resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Draft key helpers ────────────────────────────────────────────────────────

export function draftKey(entityKind: string, entityId: string | "new"): string {
  return `${entityKind}:${entityId}`;
}
