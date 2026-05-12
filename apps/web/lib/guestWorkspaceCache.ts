'use client';

import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import { readPersistedValue, writePersistedValue } from '@/lib/clientPersistence';

const GUEST_WORKSPACE_CACHE_KEY = 'saftysite-web-guest-workspace-cache-v1';

export interface GuestMailboxDraft {
  id: string;
  accountId: string;
  subject: string;
  body: string;
  recipients: string[];
  ccRecipients: string[];
  attachments: Array<{
    filename: string;
    contentType: string;
    dataBase64?: string;
    downloadUrl?: string;
    sizeBytes?: number;
    source?: string | null;
  }>;
  headquarterId: string;
  siteId: string;
  reportKeys: string[];
  savedAt: string;
}

export interface GuestPhotoAlbumItem {
  id: string;
  siteId: string;
  headquarterId: string;
  roundNo: number;
  capturedAt: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
  sourceKind: 'album_upload';
}

export interface GuestDriveItem {
  id: string;
  kind: 'folder' | 'file';
  name: string;
  parentId: string | null;
  headquarterId: string | null;
  siteId: string | null;
  fileType: 'note' | 'link' | 'binary' | null;
  textContent: string;
  externalUrl: string;
  contentType: string;
  sizeBytes: number;
  dataUrl: string;
  thumbnailDataUrl: string;
  isDeleted: boolean;
  isStarred?: boolean;
  lastOpenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestDriveShare {
  id: string;
  itemId: string;
  expiresAt: string | null;
  visibility?: 'restricted' | 'anyone_with_link';
  role?: 'viewer' | 'editor';
  token?: string | null;
  isRevoked?: boolean;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestWorkspaceCache {
  directory: {
    headquarters: SafetyHeadquarter[];
    sites: SafetySite[];
    updatedAt: string | null;
  };
  mailboxDrafts: GuestMailboxDraft[];
  photoAlbum: GuestPhotoAlbumItem[];
  drive: {
    items: GuestDriveItem[];
    shares: GuestDriveShare[];
    updatedAt: string | null;
  };
  sync: {
    lastImportedAt: string | null;
    lastImportedWorkspaceId: string | null;
  };
}

function createEmptyGuestWorkspaceCache(): GuestWorkspaceCache {
  return {
    directory: {
      headquarters: [],
      sites: [],
      updatedAt: null,
    },
    mailboxDrafts: [],
    photoAlbum: [],
    drive: {
      items: [],
      shares: [],
      updatedAt: null,
    },
    sync: {
      lastImportedAt: null,
      lastImportedWorkspaceId: null,
    },
  };
}

function normalizeCache(value: GuestWorkspaceCache | null | undefined): GuestWorkspaceCache {
  if (!value) {
    return createEmptyGuestWorkspaceCache();
  }

  return {
    directory: {
      headquarters: Array.isArray(value.directory?.headquarters) ? value.directory.headquarters : [],
      sites: Array.isArray(value.directory?.sites) ? value.directory.sites : [],
      updatedAt: value.directory?.updatedAt ?? null,
    },
    mailboxDrafts: Array.isArray(value.mailboxDrafts)
      ? value.mailboxDrafts.map((draft) => ({
          accountId: draft.accountId ?? '',
          attachments: Array.isArray(draft.attachments) ? draft.attachments : [],
          body: draft.body ?? '',
          ccRecipients: Array.isArray(draft.ccRecipients) ? draft.ccRecipients : [],
          headquarterId: draft.headquarterId ?? '',
          id: draft.id,
          recipients: Array.isArray(draft.recipients) ? draft.recipients : [],
          reportKeys: Array.isArray(draft.reportKeys) ? draft.reportKeys : [],
          savedAt: draft.savedAt ?? new Date(0).toISOString(),
          siteId: draft.siteId ?? '',
          subject: draft.subject ?? '',
        }))
      : [],
    photoAlbum: Array.isArray(value.photoAlbum) ? value.photoAlbum : [],
    drive: {
      items: Array.isArray(value.drive?.items)
        ? value.drive.items.map((item) => ({
            contentType: item.contentType ?? 'application/octet-stream',
            createdAt: item.createdAt ?? new Date(0).toISOString(),
            dataUrl: item.dataUrl ?? '',
            externalUrl: item.externalUrl ?? '',
            fileType: item.fileType ?? null,
            headquarterId: item.headquarterId ?? null,
            id: item.id,
            isDeleted: Boolean(item.isDeleted),
            isStarred: Boolean(item.isStarred),
            kind: item.kind,
            lastOpenedAt: item.lastOpenedAt ?? null,
            name: item.name ?? '',
            parentId: item.parentId ?? null,
            siteId: item.siteId ?? null,
            sizeBytes: item.sizeBytes ?? 0,
            textContent: item.textContent ?? '',
            thumbnailDataUrl: item.thumbnailDataUrl ?? '',
            updatedAt: item.updatedAt ?? item.createdAt ?? new Date(0).toISOString(),
          }))
        : [],
      shares: Array.isArray(value.drive?.shares)
        ? value.drive.shares.map((share) => ({
            createdAt: share.createdAt,
            expiresAt: share.expiresAt ?? null,
            id: share.id,
            isRevoked: Boolean(share.isRevoked),
            itemId: share.itemId,
            revokedAt: share.revokedAt ?? null,
            role: share.role === 'editor' ? 'editor' : 'viewer',
            token: share.token ?? null,
            updatedAt: share.updatedAt,
            visibility: share.visibility === 'restricted' ? 'restricted' : 'anyone_with_link',
          }))
        : [],
      updatedAt: value.drive?.updatedAt ?? null,
    },
    sync: {
      lastImportedAt: value.sync?.lastImportedAt ?? null,
      lastImportedWorkspaceId: value.sync?.lastImportedWorkspaceId ?? null,
    },
  };
}

export async function readGuestWorkspaceCache(): Promise<GuestWorkspaceCache> {
  const stored = await readPersistedValue<GuestWorkspaceCache>(GUEST_WORKSPACE_CACHE_KEY);
  return normalizeCache(stored);
}

export async function writeGuestWorkspaceCache(
  updater:
    | GuestWorkspaceCache
    | ((current: GuestWorkspaceCache) => GuestWorkspaceCache),
): Promise<GuestWorkspaceCache> {
  const current = await readGuestWorkspaceCache();
  const next = normalizeCache(typeof updater === 'function' ? updater(current) : updater);
  await writePersistedValue(GUEST_WORKSPACE_CACHE_KEY, next);
  return next;
}

export async function setGuestDirectoryCache(input: {
  headquarters: SafetyHeadquarter[];
  sites: SafetySite[];
}) {
  return writeGuestWorkspaceCache((current) => ({
    ...current,
    directory: {
      headquarters: input.headquarters,
      sites: input.sites,
      updatedAt: new Date().toISOString(),
    },
  }));
}

export async function upsertGuestMailboxDraft(draft: Omit<GuestMailboxDraft, 'savedAt'> & { savedAt?: string }) {
  return writeGuestWorkspaceCache((current) => {
    const savedAt = draft.savedAt || new Date().toISOString();
    const nextDraft: GuestMailboxDraft = {
      ...draft,
      savedAt,
    };
    const rows = current.mailboxDrafts.filter((item) => item.id !== draft.id);
    rows.unshift(nextDraft);
    return {
      ...current,
      mailboxDrafts: rows,
    };
  });
}

export async function deleteGuestMailboxDraft(draftId: string) {
  return writeGuestWorkspaceCache((current) => ({
    ...current,
    mailboxDrafts: current.mailboxDrafts.filter((item) => item.id !== draftId),
  }));
}

export async function upsertGuestPhotoAlbumItem(item: GuestPhotoAlbumItem) {
  return writeGuestWorkspaceCache((current) => {
    const rows = current.photoAlbum.filter((row) => row.id !== item.id);
    rows.unshift(item);
    return {
      ...current,
      photoAlbum: rows,
    };
  });
}

export async function deleteGuestPhotoAlbumItem(itemId: string) {
  return writeGuestWorkspaceCache((current) => ({
    ...current,
    photoAlbum: current.photoAlbum.filter((item) => item.id !== itemId),
  }));
}

export async function writeGuestDriveState(input: {
  items: GuestDriveItem[];
  shares: GuestDriveShare[];
}) {
  return writeGuestWorkspaceCache((current) => ({
    ...current,
    drive: {
      items: input.items,
      shares: input.shares,
      updatedAt: new Date().toISOString(),
    },
  }));
}

export async function markGuestWorkspaceImported(workspaceId: string) {
  return writeGuestWorkspaceCache((current) => ({
    ...current,
    sync: {
      lastImportedAt: new Date().toISOString(),
      lastImportedWorkspaceId: workspaceId,
    },
  }));
}

export function buildGuestWorkspaceCacheSummary(cache: GuestWorkspaceCache) {
  return {
    headquarters: cache.directory.headquarters.length,
    sites: cache.directory.sites.length,
    mailboxDrafts: cache.mailboxDrafts.length,
    photoAlbum: cache.photoAlbum.length,
    driveItems: cache.drive.items.length,
    driveShares: cache.drive.shares.length,
  };
}

export function createGuestLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
