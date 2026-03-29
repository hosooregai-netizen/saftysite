'use client';

const DB_NAME = 'inspection-session-storage';
const STORE_NAME = 'keyValue';
const DB_VERSION = 1;
let databasePromise: Promise<IDBDatabase | null> | null = null;

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

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      databasePromise = null;
      resolve(null);
    };
  });

  return databasePromise;
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
      if (value !== null) {
        return value;
      }
    } catch {
      // Fall back to localStorage below.
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

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(key);
        } catch {}
      }

      return;
    } catch {
      // Fall back to localStorage below.
    }
  }

  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function deletePersistedValue(key: string): Promise<void> {
  const db = await openDatabase();

  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    } catch {
      // Fall back to localStorage cleanup below.
    }
  }

  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {}
}

