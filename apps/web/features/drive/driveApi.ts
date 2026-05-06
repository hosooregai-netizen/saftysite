'use client';

import type { DemoSession } from '@/lib/reportApi';
import {
  addWorkspaceDriveGroupMember,
  createWorkspaceDriveItem,
  createWorkspaceDrivePermission,
  createWorkspaceDriveGroup,
  createWorkspaceDriveShareLink,
  deleteWorkspaceDriveGroup,
  deleteWorkspaceDriveItem,
  deleteWorkspaceDrivePermission,
  fetchPublicDriveShare,
  fetchPublicDriveShareChildren,
  fetchPublicDriveShareItem,
  fetchWorkspaceDriveGroups,
  fetchWorkspaceDriveItems,
  fetchWorkspaceDrivePermissions,
  fetchWorkspaceDriveShares,
  fetchWorkspaceUsers,
  removeWorkspaceDriveGroupMember,
  revokeWorkspaceDriveShareLink,
  transferWorkspaceDriveOwner,
  updateWorkspaceDriveGroup,
  updateWorkspaceDriveItem,
  updateWorkspaceDrivePermission,
  updateWorkspaceDriveShareLink,
  type PublicDriveShareItemRecord,
  type WorkspaceDriveGroupMemberRecord,
  type WorkspaceDriveGroupRecord,
  type WorkspaceDriveItemRecord,
  type WorkspaceDrivePermissionRecord,
  type WorkspaceDriveShareRecord,
  type WorkspaceUserRecord,
} from '@/lib/workspaceStorageApi';
import {
  createDriveLocalId,
  mergeServerDriveSnapshot,
  readDriveSnapshot,
  writeDriveSnapshot,
} from '@/lib/webhard/driveGuestStore';
import type {
  DriveGroupMemberRecord,
  DriveGroupRecord,
  DriveItemRecord,
  DrivePermissionRecord,
  DrivePermissionRole,
  DrivePrincipalType,
  DrivePublicPayload,
  DriveShareRecord,
  DriveShareRole,
  DriveShareVisibility,
  DriveSnapshot,
  DriveUserRecord,
} from '@/features/drive/types';

export type { DriveUserRecord } from '@/features/drive/types';

function mapDriveItem(item: WorkspaceDriveItemRecord): DriveItemRecord {
  return {
    contentType: item.content_type,
    createdAt: item.created_at,
    createdBy: item.created_by || null,
    dataUrl: item.data_url,
    externalUrl: item.external_url,
    fileType: item.file_type,
    headquarterId: item.headquarter_id,
    id: item.id,
    isDeleted: item.is_deleted,
    isStarred: item.is_starred,
    kind: item.kind,
    lastOpenedAt: item.last_opened_at,
    name: item.name,
    ownerUserId: item.owner_user_id,
    parentId: item.parent_id,
    siteId: item.site_id,
    sizeBytes: item.size_bytes,
    textContent: item.text_content,
    thumbnailDataUrl: item.thumbnail_data_url,
    trashedAt: item.trashed_at,
    updatedAt: item.updated_at,
    updatedByUserId: item.updated_by_user_id,
  };
}

function mapPublicDriveItem(item: PublicDriveShareItemRecord): DriveItemRecord {
  return {
    contentType: item.content_type,
    createdAt: item.created_at,
    createdBy: null,
    dataUrl: item.data_url || '',
    externalUrl: item.external_url || '',
    fileType: item.file_type,
    headquarterId: item.headquarter_id,
    id: item.id,
    isDeleted: item.is_deleted,
    isStarred: false,
    kind: item.kind,
    lastOpenedAt: null,
    name: item.name,
    ownerUserId: null,
    parentId: item.parent_id,
    siteId: item.site_id,
    sizeBytes: item.size_bytes,
    textContent: item.text_content || '',
    thumbnailDataUrl: item.thumbnail_data_url,
    trashedAt: item.is_deleted ? item.updated_at : null,
    updatedAt: item.updated_at,
    updatedByUserId: null,
  };
}

function mapDriveShare(item: WorkspaceDriveShareRecord): DriveShareRecord {
  return {
    createdAt: item.created_at || null,
    expiresAt: item.expires_at,
    id: item.id,
    isRevoked: item.is_revoked,
    itemId: item.item_id,
    revokedAt: item.revoked_at,
    role: item.role,
    token: item.token || null,
    updatedAt: item.updated_at || null,
    visibility: item.visibility,
  };
}

function mapDrivePermission(item: WorkspaceDrivePermissionRecord): DrivePermissionRecord {
  return {
    createdAt: item.created_at,
    createdBy: item.created_by,
    email: item.email,
    expiresAt: item.expires_at,
    id: item.id,
    inheritedFromItemId: item.inherited_from_item_id,
    isInherited: item.is_inherited,
    itemId: item.item_id,
    itemName: item.item_name,
    principalId: item.principal_id,
    principalType: item.principal_type,
    role: item.role,
    sourceItemId: item.source_item_id,
    sourceItemName: item.source_item_name,
    updatedAt: item.updated_at,
    workspaceId: item.workspace_id,
  };
}

function mapDriveUser(item: WorkspaceUserRecord): DriveUserRecord {
  return {
    email: item.email,
    id: item.id,
    name: item.name,
    organizationName: item.organization_name ?? null,
    phone: item.phone ?? null,
    position: item.position ?? null,
    role: item.role,
  };
}

function mapDriveGroupMember(item: WorkspaceDriveGroupMemberRecord): DriveGroupMemberRecord {
  return {
    createdAt: item.created_at,
    createdBy: item.created_by,
    groupId: item.group_id,
    id: item.id,
    updatedAt: item.updated_at,
    user: item.user
      ? {
          email: item.user.email,
          id: item.user.id,
          name: item.user.name,
          organizationName: item.user.organization_name ?? null,
          position: item.user.position ?? null,
        }
      : null,
    userId: item.user_id,
  };
}

function mapDriveGroup(item: WorkspaceDriveGroupRecord): DriveGroupRecord {
  return {
    createdAt: item.created_at,
    createdBy: item.created_by,
    description: item.description,
    id: item.id,
    members: item.members.map(mapDriveGroupMember),
    name: item.name,
    updatedAt: item.updated_at,
    workspaceId: item.workspace_id,
  };
}

export function createLocalItemId(prefix: string) {
  return createDriveLocalId(prefix);
}

export async function readLocalDriveSnapshot(): Promise<DriveSnapshot> {
  const snapshot = await readDriveSnapshot();
  return {
    items: snapshot.items.map((item) => ({
      contentType: item.contentType,
      createdAt: item.createdAt,
      createdBy: null,
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
      ownerUserId: item.ownerUserId ?? null,
      parentId: item.parentId,
      siteId: item.siteId,
      sizeBytes: item.sizeBytes,
      textContent: item.textContent,
      thumbnailDataUrl: item.thumbnailDataUrl,
      trashedAt: item.trashedAt ?? null,
      updatedAt: item.updatedAt,
      updatedByUserId: item.updatedByUserId ?? null,
    })),
    shares: snapshot.shares.map((share) => ({
      createdAt: share.createdAt ?? null,
      expiresAt: share.expiresAt,
      id: share.id,
      isRevoked: Boolean(share.isRevoked),
      itemId: share.itemId,
      revokedAt: share.revokedAt ?? null,
      role: share.role === 'editor' ? 'editor' : 'viewer',
      token: share.token ?? null,
      updatedAt: share.updatedAt ?? null,
      visibility: share.visibility === 'restricted' ? 'restricted' : 'anyone_with_link',
    })),
    updatedAt: snapshot.updatedAt,
  };
}

export async function writeLocalDriveSnapshot(snapshot: DriveSnapshot) {
  await writeDriveSnapshot({
    items: snapshot.items.map((item) => ({
      contentType: item.contentType,
      createdAt: item.createdAt,
      dataUrl: item.dataUrl,
      externalUrl: item.externalUrl,
      fileType: item.fileType,
      headquarterId: item.headquarterId,
      id: item.id,
      isDeleted: item.isDeleted,
      isStarred: item.isStarred,
      kind: item.kind,
      lastOpenedAt: item.lastOpenedAt,
      name: item.name,
      ownerUserId: item.ownerUserId,
      parentId: item.parentId,
      siteId: item.siteId,
      sizeBytes: item.sizeBytes,
      textContent: item.textContent,
      thumbnailDataUrl: item.thumbnailDataUrl,
      trashedAt: item.trashedAt,
      updatedAt: item.updatedAt,
      updatedByUserId: item.updatedByUserId,
    })),
    shares: snapshot.shares.map((share) => ({
      createdAt: share.createdAt ?? undefined,
      expiresAt: share.expiresAt,
      id: share.id,
      isRevoked: share.isRevoked,
      itemId: share.itemId,
      revokedAt: share.revokedAt ?? undefined,
      role: share.role,
      token: share.token ?? undefined,
      updatedAt: share.updatedAt ?? undefined,
      visibility: share.visibility,
    })),
  });
}

export async function mergeServerDriveState(snapshot: DriveSnapshot) {
  await mergeServerDriveSnapshot({
    items: snapshot.items.map((item) => ({
      contentType: item.contentType,
      createdAt: item.createdAt,
      dataUrl: item.dataUrl,
      externalUrl: item.externalUrl,
      fileType: item.fileType,
      headquarterId: item.headquarterId,
      id: item.id,
      isDeleted: item.isDeleted,
      isStarred: item.isStarred,
      kind: item.kind,
      lastOpenedAt: item.lastOpenedAt,
      name: item.name,
      ownerUserId: item.ownerUserId,
      parentId: item.parentId,
      siteId: item.siteId,
      sizeBytes: item.sizeBytes,
      textContent: item.textContent,
      thumbnailDataUrl: item.thumbnailDataUrl,
      trashedAt: item.trashedAt,
      updatedAt: item.updatedAt,
      updatedByUserId: item.updatedByUserId,
    })),
    shares: snapshot.shares.map((share) => ({
      createdAt: share.createdAt ?? undefined,
      expiresAt: share.expiresAt,
      id: share.id,
      isRevoked: share.isRevoked,
      itemId: share.itemId,
      revokedAt: share.revokedAt ?? undefined,
      role: share.role,
      token: share.token ?? undefined,
      updatedAt: share.updatedAt ?? undefined,
      visibility: share.visibility,
    })),
  });
}

export async function fetchWorkspaceDriveState(session: DemoSession) {
  const [itemsResponse, sharesResponse, usersResponse] = await Promise.all([
    fetchWorkspaceDriveItems(session, { includeDeleted: true }),
    fetchWorkspaceDriveShares(session),
    fetchWorkspaceUsers(session),
  ]);
  return {
    items: itemsResponse.rows.map(mapDriveItem),
    shares: sharesResponse.rows.map(mapDriveShare),
    users: usersResponse.map(mapDriveUser),
  };
}

export async function createDriveItem(session: DemoSession, item: Omit<DriveItemRecord, 'createdAt' | 'updatedAt'>) {
  const created = await createWorkspaceDriveItem(session, item);
  return mapDriveItem(created);
}

export async function updateDriveItem(
  session: DemoSession,
  itemId: string,
  payload: Partial<
    Pick<
      DriveItemRecord,
      | 'contentType'
      | 'dataUrl'
      | 'externalUrl'
      | 'fileType'
      | 'headquarterId'
      | 'isStarred'
      | 'lastOpenedAt'
      | 'name'
      | 'parentId'
      | 'siteId'
      | 'sizeBytes'
      | 'textContent'
      | 'thumbnailDataUrl'
    >
  > & { isDeleted?: boolean; restore?: boolean },
) {
  const updated = await updateWorkspaceDriveItem(session, itemId, payload);
  return mapDriveItem(updated);
}

export async function deleteDriveItem(session: DemoSession, itemId: string, purge = false) {
  return deleteWorkspaceDriveItem(session, itemId, purge);
}

export async function fetchDrivePermissions(session: DemoSession, itemId: string) {
  const response = await fetchWorkspaceDrivePermissions(session, itemId, { includeInherited: true });
  return response.rows.map(mapDrivePermission);
}

export async function fetchDriveUsers(session: DemoSession) {
  const rows = await fetchWorkspaceUsers(session);
  return rows.map(mapDriveUser);
}

export async function fetchDriveGroups(session: DemoSession) {
  const response = await fetchWorkspaceDriveGroups(session);
  return response.rows.map(mapDriveGroup);
}

export async function createDriveGroup(
  session: DemoSession,
  payload: { description?: string; name: string },
) {
  const created = await createWorkspaceDriveGroup(session, payload);
  return mapDriveGroup(created);
}

export async function updateDriveGroup(
  session: DemoSession,
  groupId: string,
  payload: { description?: string; name?: string },
) {
  const updated = await updateWorkspaceDriveGroup(session, groupId, payload);
  return mapDriveGroup(updated);
}

export async function deleteDriveGroup(session: DemoSession, groupId: string) {
  return deleteWorkspaceDriveGroup(session, groupId);
}

export async function addDriveGroupMember(
  session: DemoSession,
  groupId: string,
  userId: string,
) {
  const updated = await addWorkspaceDriveGroupMember(session, groupId, userId);
  return mapDriveGroup(updated);
}

export async function removeDriveGroupMember(
  session: DemoSession,
  groupId: string,
  memberId: string,
) {
  return removeWorkspaceDriveGroupMember(session, groupId, memberId);
}

export async function createDrivePermission(
  session: DemoSession,
  itemId: string,
  payload: {
    principalType: DrivePrincipalType;
    principalId: string;
    role: DrivePermissionRole;
    expiresAt?: string | null;
    email?: string | null;
  },
) {
  const created = await createWorkspaceDrivePermission(session, itemId, payload);
  return mapDrivePermission(created);
}

export async function updateDrivePermission(
  session: DemoSession,
  permissionId: string,
  payload: { expiresAt?: string | null; role?: DrivePermissionRole },
) {
  const updated = await updateWorkspaceDrivePermission(session, permissionId, payload);
  return mapDrivePermission(updated);
}

export async function deleteDrivePermission(session: DemoSession, permissionId: string) {
  return deleteWorkspaceDrivePermission(session, permissionId);
}

export async function transferDriveOwner(
  session: DemoSession,
  itemId: string,
  targetUserId: string,
) {
  const updated = await transferWorkspaceDriveOwner(session, itemId, targetUserId);
  return mapDrivePermission(updated);
}

export async function fetchDriveShares(session: DemoSession, itemId?: string) {
  const response = await fetchWorkspaceDriveShares(session, itemId ? { itemId } : {});
  return response.rows.map(mapDriveShare);
}

export async function createDriveShareLink(
  session: DemoSession,
  payload: {
    itemId: string;
    visibility: DriveShareVisibility;
    role: DriveShareRole;
    expiresAt?: string | null;
  },
) {
  const created = await createWorkspaceDriveShareLink(session, payload);
  return mapDriveShare(created);
}

export async function updateDriveShareLink(
  session: DemoSession,
  shareId: string,
  payload: {
    expiresAt?: string | null;
    isRevoked?: boolean;
    role?: DriveShareRole;
    visibility?: DriveShareVisibility;
  },
) {
  const updated = await updateWorkspaceDriveShareLink(session, shareId, payload);
  return mapDriveShare(updated);
}

export async function revokeDriveShareLink(session: DemoSession, shareId: string) {
  return revokeWorkspaceDriveShareLink(session, shareId);
}

function mapPublicPayload(
  payload:
    | Awaited<ReturnType<typeof fetchPublicDriveShare>>
    | Awaited<ReturnType<typeof fetchPublicDriveShareChildren>>
    | Awaited<ReturnType<typeof fetchPublicDriveShareItem>>,
) {
  const rows =
    'children' in payload
      ? payload.children.map(mapPublicDriveItem)
      : 'rows' in payload
        ? payload.rows.map(mapPublicDriveItem)
        : [];
  let item: ReturnType<typeof mapPublicDriveItem>;
  let rootItemId: string;
  if ('parent' in payload) {
    item = mapPublicDriveItem(payload.parent);
    rootItemId = payload.root_item.id;
  } else if ('root_item_id' in payload) {
    item = mapPublicDriveItem(payload.item);
    rootItemId = payload.root_item_id;
  } else {
    item = mapPublicDriveItem(payload.item);
    rootItemId = payload.root_item.id;
  }
  return {
    item,
    path: payload.path,
    rootItemId,
    rows,
    shareRole: payload.share.role,
    shareVisibility: payload.share.visibility,
  } satisfies DrivePublicPayload;
}

export async function fetchPublicDriveRoot(token: string, session?: DemoSession | null) {
  return mapPublicPayload(await fetchPublicDriveShare(token, session));
}

export async function fetchPublicDriveChildren(
  token: string,
  parentId?: string | null,
  session?: DemoSession | null,
) {
  return mapPublicPayload(await fetchPublicDriveShareChildren(token, { parentId }, session));
}

export async function fetchPublicDriveItem(
  token: string,
  itemId: string,
  session?: DemoSession | null,
) {
  return mapPublicPayload(await fetchPublicDriveShareItem(token, itemId, session));
}
