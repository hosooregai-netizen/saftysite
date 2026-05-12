'use client';

import {
  createGuestLocalId,
  readGuestWorkspaceCache,
  writeGuestDriveState,
  type GuestDriveItem,
  type GuestDriveShare,
} from '@/lib/guestWorkspaceCache';
import type { DriveItemViewModel, DriveShareViewModel, DriveSnapshot } from '@/lib/webhard/driveTypes';

function toGuestDriveItem(item: DriveItemViewModel): GuestDriveItem {
  return {
    contentType: item.contentType,
    createdAt: item.createdAt,
    dataUrl: item.dataUrl,
    externalUrl: item.externalUrl,
    fileType: item.fileType,
    headquarterId: item.headquarterId,
    id: item.id,
    isDeleted: item.isDeleted,
    isStarred: Boolean(item.isStarred),
    kind: item.kind,
    lastOpenedAt: item.lastOpenedAt ?? null,
    name: item.name,
    parentId: item.parentId,
    siteId: item.siteId,
    sizeBytes: item.sizeBytes,
    textContent: item.textContent,
    thumbnailDataUrl: item.thumbnailDataUrl,
    updatedAt: item.updatedAt,
  };
}

function toGuestDriveShare(share: DriveShareViewModel): GuestDriveShare {
  return {
    createdAt: share.createdAt,
    expiresAt: share.expiresAt,
    id: share.id,
    isRevoked: share.isRevoked,
    itemId: share.itemId,
    revokedAt: share.revokedAt,
    role: share.role,
    token: share.token,
    updatedAt: share.updatedAt,
    visibility: share.visibility,
  };
}

function fromGuestDriveItem(item: GuestDriveItem): DriveItemViewModel {
  return {
    ...item,
    isStarred: Boolean(item.isStarred),
    lastOpenedAt: item.lastOpenedAt ?? null,
    ownerUserId: null,
    trashedAt: item.isDeleted ? item.updatedAt : null,
    updatedByUserId: null,
  };
}

function fromGuestDriveShare(share: GuestDriveShare): DriveShareViewModel {
  return {
    ...share,
    createdAt: share.createdAt,
    isRevoked: Boolean(share.isRevoked),
    revokedAt: share.revokedAt ?? null,
    role: share.role === 'editor' ? 'editor' : 'viewer',
    token: share.token ?? null,
    updatedAt: share.updatedAt,
    visibility: share.visibility === 'restricted' ? 'restricted' : 'anyone_with_link',
  };
}

export async function readDriveSnapshot(): Promise<DriveSnapshot> {
  const cache = await readGuestWorkspaceCache();
  return {
    items: cache.drive.items.map(fromGuestDriveItem),
    shares: cache.drive.shares.map(fromGuestDriveShare),
    updatedAt: cache.drive.updatedAt,
  };
}

export async function writeDriveSnapshot(input: {
  items: DriveItemViewModel[];
  shares: DriveShareViewModel[];
}) {
  await writeGuestDriveState({
    items: input.items.map(toGuestDriveItem),
    shares: input.shares.map(toGuestDriveShare),
  });
}

export async function mergeServerDriveSnapshot(input: {
  items: DriveItemViewModel[];
  shares: DriveShareViewModel[];
}) {
  await writeDriveSnapshot(input);
  return {
    items: input.items,
    shares: input.shares,
    updatedAt: new Date().toISOString(),
  } satisfies DriveSnapshot;
}

export function createDriveLocalId(prefix: string) {
  return createGuestLocalId(prefix);
}
