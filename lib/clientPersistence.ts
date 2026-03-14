'use client';

const DB_NAME = 'inspection-session-storage';
const STORE_NAME = 'keyValue';
const DB_VERSION = 1;

interface PersistedRecord<T> {
  key: string;
  value: T;
}

function canUseIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function readFromLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function readPersistedValue<T>(key: string): Promise<T | null> {
  const db = await openDatabase();

  if (db) {
    try {
      const value = await new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result as PersistedRecord<T> | undefined;
          resolve(result?.value ?? null);
        };
        request.onerror = () => reject(request.error);
      });

      db.close();
      if (value !== null) {
        return value;
      }
    } catch {
      db.close();
    }
  }

  return readFromLocalStorage<T>(key);
}

export async function writePersistedValue<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();

  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put({ key, value } satisfies PersistedRecord<T>);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });

      db.close();

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      }

      return;
    } catch {
      db.close();
    }
  }

  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
