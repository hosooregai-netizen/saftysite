'use client';

import type { SafetyContentItem } from '@/types/backend';

const CONTENT_ITEMS_SESSION_CACHE_TTL_MS = 1000 * 60 * 10;
const CONTENT_ITEMS_SESSION_CACHE_VERSION = 'v1';
const CONTENT_ITEMS_SESSION_CACHE_KEY_PREFIX = 'safety-content-items-session';

interface ContentItemsSessionCacheRecord {
  savedAt: number;
  scopeKey: string;
  version: string;
  items: SafetyContentItem[];
}

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function buildSessionCacheKey(scopeKey: string) {
  return `${CONTENT_ITEMS_SESSION_CACHE_KEY_PREFIX}:${CONTENT_ITEMS_SESSION_CACHE_VERSION}:${scopeKey}`;
}

export function resolveSafetyContentItemsCacheScope(userId: string | null | undefined) {
  const normalized = typeof userId === 'string' ? userId.trim() : '';
  return normalized ? `user:${normalized}` : null;
}

export function readSafetyContentItemsSessionCache(scopeKey: string | null | undefined) {
  if (!scopeKey || !canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(buildSessionCacheKey(scopeKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ContentItemsSessionCacheRecord>;
    if (
      parsed.version !== CONTENT_ITEMS_SESSION_CACHE_VERSION ||
      parsed.scopeKey !== scopeKey ||
      typeof parsed.savedAt !== 'number' ||
      !Array.isArray(parsed.items)
    ) {
      window.sessionStorage.removeItem(buildSessionCacheKey(scopeKey));
      return null;
    }

    if (Date.now() - parsed.savedAt > CONTENT_ITEMS_SESSION_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(buildSessionCacheKey(scopeKey));
      return null;
    }

    return parsed.items as SafetyContentItem[];
  } catch {
    return null;
  }
}

export function writeSafetyContentItemsSessionCache(
  scopeKey: string | null | undefined,
  items: SafetyContentItem[],
) {
  if (!scopeKey || !canUseSessionStorage()) return;

  const payload: ContentItemsSessionCacheRecord = {
    items,
    savedAt: Date.now(),
    scopeKey,
    version: CONTENT_ITEMS_SESSION_CACHE_VERSION,
  };

  try {
    window.sessionStorage.setItem(buildSessionCacheKey(scopeKey), JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors and keep runtime behavior intact.
  }
}

export function clearSafetyContentItemsSessionCache(scopeKey: string | null | undefined) {
  if (!scopeKey || !canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(buildSessionCacheKey(scopeKey));
  } catch {
    // Ignore cleanup failures.
  }
}

export function pickCampaignTemplateContentItems(items: SafetyContentItem[]) {
  return items
    .filter((item) => item.content_type === 'campaign_template')
    .map((item) => ({
      body: item.body,
      id: item.id,
      title: item.title,
    }));
}
