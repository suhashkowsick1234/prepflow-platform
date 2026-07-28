const DB_NAME = "PrepFlowDB";
const DB_VERSION = 1;
const STORE_NAME = "module_cache";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type ModuleName =
  | "overview"
  | "flashcards"
  | "quiz"
  | "interview"
  | "cheatsheet"
  | "code"
  | "related";

interface CacheRecord {
  key: string; // "topic:module"
  topic: string;
  module: ModuleName;
  data: any;
  timestamp: number;
}

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase().replace(/\s+/g, " ");
}

function makeKey(topic: string, module: ModuleName): string {
  return `${normalizeTopic(topic)}:${module}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("topic", "topic", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedModule<T = any>(
  topic: string,
  module: ModuleName
): Promise<T | null> {
  try {
    const db = await openDB();
    const key = makeKey(topic, module);

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const record: CacheRecord | undefined = req.result;
        if (!record) {
          resolve(null);
          return;
        }

        const age = Date.now() - record.timestamp;
        if (age > TTL_MS) {
          // Expired entry
          deleteCachedModule(topic, module);
          resolve(null);
        } else {
          resolve(record.data as T);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedModule(
  topic: string,
  module: ModuleName,
  data: any
): Promise<void> {
  try {
    const db = await openDB();
    const record: CacheRecord = {
      key: makeKey(topic, module),
      topic: normalizeTopic(topic),
      module,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fail gracefully if IndexedDB is disabled
  }
}

export async function deleteCachedModule(
  topic: string,
  module: ModuleName
): Promise<void> {
  try {
    const db = await openDB();
    const key = makeKey(topic, module);
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
  } catch {
    // ignore
  }
}

export async function clearTopicCache(topic: string): Promise<void> {
  try {
    const db = await openDB();
    const norm = normalizeTopic(topic);
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("topic");
    const req = index.getAllKeys(norm);

    req.onsuccess = () => {
      const keys = req.result;
      keys.forEach((k) => store.delete(k));
    };
  } catch {
    // ignore
  }
}

export async function clearAllModuleCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
  } catch {
    // ignore
  }
}
