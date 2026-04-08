'use client';

import {
  readPersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';

export interface PersistedOwnedCacheRecord<T> {
  ownerId: string;
  savedAt: string;
  value: T;
}

function isPersistedOwnedCacheRecord<T>(
  value: unknown,
): value is PersistedOwnedCacheRecord<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.ownerId === 'string' &&
    typeof record.savedAt === 'string' &&
    'value' in record
  );
}

export function unwrapOwnedPersistedValue<T>(
  value: unknown,
  ownerId: string | null | undefined,
) {
  if (!ownerId || !isPersistedOwnedCacheRecord<T>(value)) {
    return null;
  }

  return value.ownerId === ownerId ? value.value : null;
}

export async function readOwnedPersistedValue<T>(
  key: string,
  ownerId: string | null | undefined,
): Promise<T | null> {
  const stored = await readPersistedValue<unknown>(key);
  return unwrapOwnedPersistedValue<T>(stored, ownerId);
}

export async function writeOwnedPersistedValue<T>(
  key: string,
  ownerId: string,
  value: T,
): Promise<void> {
  await writePersistedValue<PersistedOwnedCacheRecord<T>>(key, {
    ownerId,
    savedAt: new Date().toISOString(),
    value,
  });
}
