'use client';

import {
  addWorkspaceDriveGroupMember,
  createWorkspaceDriveGroup,
  createWorkspaceDriveItem,
  createWorkspaceDrivePermission,
  createWorkspaceDriveShare,
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
  revokeWorkspaceDriveShare,
  revokeWorkspaceDriveShareLink,
  updateWorkspaceDriveGroup,
  updateWorkspaceDriveItem,
  updateWorkspaceDrivePermission,
  updateWorkspaceDriveShareLink,
  type PublicDriveShareChildrenPayload,
  type PublicDriveShareItemPayload,
  type PublicDriveSharePayload,
  type WorkspaceDriveGroupRecord,
  type WorkspaceDriveItemRecord,
  type WorkspaceDrivePermissionRecord,
  type WorkspaceDriveShareRecord,
  type WorkspaceUserRecord,
} from '@/lib/workspaceStorageApi';
import type { DemoSession } from '@/lib/reportApi';
import type {
  DriveItemViewModel,
  DrivePermissionRole,
  DrivePrincipalType,
  DriveShareRole,
  DriveShareViewModel,
  DriveShareVisibility,
} from '@/lib/webhard/driveTypes';

export type {
  PublicDriveShareChildrenPayload,
  PublicDriveShareItemPayload,
  PublicDriveSharePayload,
  WorkspaceDriveGroupRecord,
  WorkspaceDriveItemRecord,
  WorkspaceDrivePermissionRecord,
  WorkspaceDriveShareRecord,
  WorkspaceUserRecord,
};

export async function fetchDriveItems(
  session: DemoSession,
  input: { includeDeleted?: boolean; parentId?: string | null; query?: string } = {},
) {
  return fetchWorkspaceDriveItems(session, input);
}

export async function createDriveItem(
  session: DemoSession,
  item: Omit<DriveItemViewModel, 'createdAt' | 'updatedAt'>,
) {
  return createWorkspaceDriveItem(session, item);
}

export async function updateDriveItem(
  session: DemoSession,
  itemId: string,
  payload: Partial<
    Pick<
      DriveItemViewModel,
      | 'contentType'
      | 'dataUrl'
      | 'externalUrl'
      | 'fileType'
      | 'headquarterId'
      | 'name'
      | 'parentId'
      | 'siteId'
      | 'sizeBytes'
      | 'textContent'
      | 'thumbnailDataUrl'
    >
  > & { isDeleted?: boolean; restore?: boolean },
) {
  return updateWorkspaceDriveItem(session, itemId, payload);
}

export async function deleteDriveItem(session: DemoSession, itemId: string, purge = false) {
  return deleteWorkspaceDriveItem(session, itemId, purge);
}

export async function fetchDriveShares(session: DemoSession, input: { itemId?: string } = {}) {
  return fetchWorkspaceDriveShares(session, input);
}

export async function createDriveShare(session: DemoSession, share: DriveShareViewModel) {
  return createWorkspaceDriveShare(session, share);
}

export async function createDriveShareLink(
  session: DemoSession,
  payload: {
    itemId: string;
    localId?: string;
    expiresAt?: string | null;
    visibility: DriveShareVisibility;
    role: DriveShareRole;
  },
) {
  return createWorkspaceDriveShareLink(session, payload);
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
  return updateWorkspaceDriveShareLink(session, shareId, payload);
}

export async function revokeDriveShare(session: DemoSession, shareId: string) {
  return revokeWorkspaceDriveShare(session, shareId);
}

export async function revokeDriveShareLink(session: DemoSession, shareId: string) {
  return revokeWorkspaceDriveShareLink(session, shareId);
}

export async function fetchDrivePermissions(session: DemoSession, itemId: string, input: { includeInherited?: boolean } = {}) {
  return fetchWorkspaceDrivePermissions(session, itemId, input);
}

export async function createDrivePermission(
  session: DemoSession,
  itemId: string,
  payload: {
    principalType: DrivePrincipalType;
    principalId: string;
    email?: string | null;
    role: DrivePermissionRole;
    expiresAt?: string | null;
  },
) {
  return createWorkspaceDrivePermission(session, itemId, payload);
}

export async function updateDrivePermission(
  session: DemoSession,
  permissionId: string,
  payload: {
    expiresAt?: string | null;
    role?: DrivePermissionRole;
  },
) {
  return updateWorkspaceDrivePermission(session, permissionId, payload);
}

export async function deleteDrivePermission(session: DemoSession, permissionId: string) {
  return deleteWorkspaceDrivePermission(session, permissionId);
}

export async function fetchDriveGroups(session: DemoSession) {
  return fetchWorkspaceDriveGroups(session);
}

export async function createDriveGroup(
  session: DemoSession,
  payload: { description?: string; name: string },
) {
  return createWorkspaceDriveGroup(session, payload);
}

export async function updateDriveGroup(
  session: DemoSession,
  groupId: string,
  payload: { description?: string; name?: string },
) {
  return updateWorkspaceDriveGroup(session, groupId, payload);
}

export async function deleteDriveGroup(session: DemoSession, groupId: string) {
  return deleteWorkspaceDriveGroup(session, groupId);
}

export async function addDriveGroupMember(
  session: DemoSession,
  groupId: string,
  userId: string,
) {
  return addWorkspaceDriveGroupMember(session, groupId, userId);
}

export async function removeDriveGroupMember(
  session: DemoSession,
  groupId: string,
  memberId: string,
) {
  return removeWorkspaceDriveGroupMember(session, groupId, memberId);
}

export async function fetchDriveWorkspaceUsers(session: DemoSession) {
  return fetchWorkspaceUsers(session);
}

export async function fetchPublicShare(token: string, session?: DemoSession | null) {
  return fetchPublicDriveShare(token, session);
}

export async function fetchPublicShareChildren(
  token: string,
  input: { parentId?: string | null } = {},
  session?: DemoSession | null,
) {
  return fetchPublicDriveShareChildren(token, input, session);
}

export async function fetchPublicShareItem(
  token: string,
  itemId: string,
  session?: DemoSession | null,
) {
  return fetchPublicDriveShareItem(token, itemId, session);
}
