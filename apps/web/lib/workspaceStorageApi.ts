'use client';

import type { DemoSession } from '@/lib/reportApi';
import type {
  GuestDriveItem,
  GuestDriveShare,
  GuestPhotoAlbumItem,
  GuestWorkspaceCache,
} from '@/lib/guestWorkspaceCache';

const API_PREFIX = '/api/report-saas/v1';

export interface GuestWorkspaceImportResponse {
  importedCounts: {
    headquarters: number;
    sites: number;
    mailboxDrafts: number;
    photoAlbum: number;
    driveItems: number;
    driveShares: number;
  };
  idMap: {
    directory: {
      headquarters: Record<string, string>;
      sites: Record<string, string>;
    };
    drive: {
      items: Record<string, string>;
      shares: Record<string, string>;
    };
  };
}

export interface WorkspacePhotoAlbumRecord {
  id: string;
  site_id: string;
  site_name: string;
  headquarter_id: string;
  headquarter_name: string;
  round_no: number;
  captured_at: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  data_url: string;
  source_kind: 'album_upload';
  uploaded_by_user_id: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDriveItemRecord {
  id: string;
  kind: 'folder' | 'file';
  name: string;
  parent_id: string | null;
  headquarter_id: string | null;
  site_id: string | null;
  file_type: 'note' | 'link' | 'binary' | null;
  text_content: string;
  external_url: string;
  content_type: string;
  size_bytes: number;
  data_url: string;
  thumbnail_data_url: string;
  is_deleted: boolean;
  created_by: string;
  owner_user_id: string | null;
  updated_by_user_id: string | null;
  trashed_at: string | null;
  last_opened_at: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDriveShareRecord {
  id: string;
  token: string;
  item_id: string;
  visibility: 'restricted' | 'anyone_with_link';
  role: 'viewer' | 'editor';
  expires_at: string | null;
  revoked_at: string | null;
  is_revoked: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceDrivePermissionRecord {
  id: string;
  workspace_id: string;
  item_id: string;
  principal_type: 'user' | 'group' | 'domain' | 'anyone' | 'workspace';
  principal_id: string;
  email: string | null;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  inherited_from_item_id: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_inherited: boolean;
  source_item_id: string | null;
  source_item_name: string | null;
  item_name: string | null;
}

export interface WorkspaceDriveGroupMemberRecord {
  id: string;
  group_id: string;
  user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    organization_name?: string | null;
    position?: string | null;
  } | null;
}

export interface WorkspaceDriveGroupRecord {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: WorkspaceDriveGroupMemberRecord[];
}

export interface WorkspaceUserRecord {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  position?: string | null;
  organization_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface PublicDriveShareItemRecord {
  id: string;
  kind: 'folder' | 'file';
  name: string;
  parent_id: string | null;
  headquarter_id: string | null;
  site_id: string | null;
  file_type: 'note' | 'link' | 'binary' | null;
  content_type: string;
  size_bytes: number;
  thumbnail_data_url: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  text_content?: string;
  external_url?: string;
  data_url?: string;
}

export interface PublicDriveSharePayload {
  share: WorkspaceDriveShareRecord;
  item: PublicDriveShareItemRecord;
  path: Array<{ id: string; kind: 'folder' | 'file'; name: string }>;
  children: PublicDriveShareItemRecord[];
  root_item_id: string;
}

export interface PublicDriveShareChildrenPayload {
  share: WorkspaceDriveShareRecord;
  root_item: PublicDriveShareItemRecord;
  parent: PublicDriveShareItemRecord;
  path: Array<{ id: string; kind: 'folder' | 'file'; name: string }>;
  rows: PublicDriveShareItemRecord[];
}

export interface PublicDriveShareItemPayload {
  share: WorkspaceDriveShareRecord;
  root_item: PublicDriveShareItemRecord;
  path: Array<{ id: string; kind: 'folder' | 'file'; name: string }>;
  item: PublicDriveShareItemRecord;
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown; error?: unknown };
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore
  }

  return response.statusText || '요청 처리에 실패했습니다.';
}

async function requestWorkspaceApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = new Error(await parseError(response)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function importGuestWorkspaceCache(
  session: DemoSession,
  cache: GuestWorkspaceCache,
): Promise<GuestWorkspaceImportResponse> {
  return requestWorkspaceApi<GuestWorkspaceImportResponse>(
    '/workspaces/import-guest-cache',
    {
      method: 'POST',
      body: JSON.stringify({
        directory: {
          headquarters: cache.directory.headquarters,
          sites: cache.directory.sites,
        },
        mailboxDrafts: cache.mailboxDrafts.map((draft) => ({
          account_id: draft.accountId,
          attachments: draft.attachments.map((attachment) => ({
            content_type: attachment.contentType,
            data_base64: attachment.dataBase64,
            download_url: attachment.downloadUrl,
            filename: attachment.filename,
            size_bytes: attachment.sizeBytes,
            source: attachment.source,
          })),
          cc_recipients: draft.ccRecipients,
          headquarter_id: draft.headquarterId,
          local_id: draft.id,
          subject: draft.subject,
          body: draft.body,
          recipients: draft.recipients,
          report_keys: draft.reportKeys,
          saved_at: draft.savedAt,
          site_id: draft.siteId,
        })),
        photoAlbum: cache.photoAlbum.map((item) => ({
          local_id: item.id,
          site_id: item.siteId,
          headquarter_id: item.headquarterId,
          round_no: item.roundNo,
          captured_at: item.capturedAt,
          file_name: item.fileName,
          content_type: item.contentType,
          size_bytes: item.sizeBytes,
          data_url: item.dataUrl,
          source_kind: item.sourceKind,
        })),
        drive: {
          items: cache.drive.items.map((item) => ({
            local_id: item.id,
            kind: item.kind,
            name: item.name,
            parent_local_id: item.parentId,
            headquarter_id: item.headquarterId,
            site_id: item.siteId,
            file_type: item.fileType,
            text_content: item.textContent,
            external_url: item.externalUrl,
            content_type: item.contentType,
            size_bytes: item.sizeBytes,
            data_url: item.dataUrl,
            thumbnail_data_url: item.thumbnailDataUrl,
          })),
          shares: cache.drive.shares.map((share) => ({
            local_id: share.id,
            item_local_id: share.itemId,
            expires_at: share.expiresAt,
            role: share.role ?? 'viewer',
            visibility: share.visibility ?? 'anyone_with_link',
          })),
        },
      }),
    },
    session.token,
  );
}

export async function fetchWorkspacePhotoAlbum(
  session: DemoSession,
  input: { headquarterId?: string; query?: string; siteId?: string } = {},
) {
  const searchParams = new URLSearchParams();
  if (input.headquarterId) searchParams.set('headquarter_id', input.headquarterId);
  if (input.siteId) searchParams.set('site_id', input.siteId);
  if (input.query) searchParams.set('query', input.query);
  const query = searchParams.toString();
  return requestWorkspaceApi<{ rows: WorkspacePhotoAlbumRecord[]; total: number }>(
    `/photo-album${query ? `?${query}` : ''}`,
    {},
    session.token,
  );
}

export async function createWorkspacePhotoAlbumItem(
  session: DemoSession,
  item: GuestPhotoAlbumItem,
) {
  return requestWorkspaceApi<WorkspacePhotoAlbumRecord>(
    '/photo-album',
    {
      method: 'POST',
      body: JSON.stringify({
        local_id: item.id,
        site_id: item.siteId,
        headquarter_id: item.headquarterId,
        round_no: item.roundNo,
        captured_at: item.capturedAt,
        file_name: item.fileName,
        content_type: item.contentType,
        size_bytes: item.sizeBytes,
        data_url: item.dataUrl,
        source_kind: item.sourceKind,
      }),
    },
    session.token,
  );
}

export async function deleteWorkspacePhotoAlbumItem(session: DemoSession, itemId: string) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/photo-album/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function fetchWorkspaceDriveItems(
  session: DemoSession,
  input: { includeDeleted?: boolean; parentId?: string | null; query?: string } = {},
) {
  const searchParams = new URLSearchParams();
  if (input.parentId) searchParams.set('parent_id', input.parentId);
  if (input.includeDeleted) searchParams.set('include_deleted', 'true');
  if (input.query) searchParams.set('query', input.query);
  const query = searchParams.toString();
  return requestWorkspaceApi<{ rows: WorkspaceDriveItemRecord[] }>(
    `/drive/items${query ? `?${query}` : ''}`,
    {},
    session.token,
  );
}

export async function createWorkspaceDriveItem(
  session: DemoSession,
  item: Omit<GuestDriveItem, 'createdAt' | 'updatedAt'>,
) {
  return requestWorkspaceApi<WorkspaceDriveItemRecord>(
    '/drive/items',
    {
      method: 'POST',
      body: JSON.stringify({
        local_id: item.id,
        kind: item.kind,
        name: item.name,
        parent_local_id: item.parentId,
        headquarter_id: item.headquarterId,
        site_id: item.siteId,
        file_type: item.fileType,
        text_content: item.textContent,
        external_url: item.externalUrl,
        content_type: item.contentType,
        size_bytes: item.sizeBytes,
        data_url: item.dataUrl,
        thumbnail_data_url: item.thumbnailDataUrl,
      }),
    },
    session.token,
  );
}

export async function updateWorkspaceDriveItem(
  session: DemoSession,
  itemId: string,
  payload: Partial<
    Pick<
      GuestDriveItem,
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
      | 'isStarred'
      | 'lastOpenedAt'
    >
  > & { isDeleted?: boolean; restore?: boolean },
) {
  return requestWorkspaceApi<WorkspaceDriveItemRecord>(
    `/drive/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        content_type: payload.contentType,
        data_url: payload.dataUrl,
        name: payload.name,
        file_type: payload.fileType,
        parent_id: payload.parentId,
        external_url: payload.externalUrl,
        headquarter_id: payload.headquarterId,
        is_deleted: payload.isDeleted,
        is_starred: payload.isStarred,
        last_opened_at: payload.lastOpenedAt,
        restore: payload.restore,
        site_id: payload.siteId,
        size_bytes: payload.sizeBytes,
        text_content: payload.textContent,
        thumbnail_data_url: payload.thumbnailDataUrl,
      }),
    },
    session.token,
  );
}

export async function deleteWorkspaceDriveItem(session: DemoSession, itemId: string, purge = false) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/drive/items/${encodeURIComponent(itemId)}${purge ? '?purge=true' : ''}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function fetchWorkspaceDriveShares(
  session: DemoSession,
  input: { itemId?: string } = {},
) {
  const searchParams = new URLSearchParams();
  if (input.itemId) {
    searchParams.set('item_id', input.itemId);
  }
  const query = searchParams.toString();
  return requestWorkspaceApi<{ rows: WorkspaceDriveShareRecord[] }>(
    `/drive/shares${query ? `?${query}` : ''}`,
    {},
    session.token,
  );
}

export async function createWorkspaceDriveShare(
  session: DemoSession,
  share: GuestDriveShare,
) {
  return createWorkspaceDriveShareLink(session, {
    itemId: share.itemId,
    localId: share.id,
    expiresAt: share.expiresAt,
    visibility: 'anyone_with_link',
    role: 'viewer',
  });
}

export async function createWorkspaceDriveShareLink(
  session: DemoSession,
  payload: {
    itemId: string;
    localId?: string;
    expiresAt?: string | null;
    visibility: 'restricted' | 'anyone_with_link';
    role: 'viewer' | 'editor';
  },
) {
  return requestWorkspaceApi<WorkspaceDriveShareRecord>(
    '/drive/shares',
    {
      method: 'POST',
      body: JSON.stringify({
        local_id: payload.localId || '',
        item_id: payload.itemId,
        item_local_id: payload.itemId,
        expires_at: payload.expiresAt ?? null,
        visibility: payload.visibility,
        role: payload.role,
      }),
    },
    session.token,
  );
}

export async function updateWorkspaceDriveShareLink(
  session: DemoSession,
  shareId: string,
  payload: {
    expiresAt?: string | null;
    isRevoked?: boolean;
    role?: 'viewer' | 'editor';
    visibility?: 'restricted' | 'anyone_with_link';
  },
) {
  return requestWorkspaceApi<WorkspaceDriveShareRecord>(
    `/drive/shares/${encodeURIComponent(shareId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        expires_at: payload.expiresAt,
        is_revoked: payload.isRevoked,
        role: payload.role,
        visibility: payload.visibility,
      }),
    },
    session.token,
  );
}

export async function revokeWorkspaceDriveShare(session: DemoSession, shareId: string) {
  return revokeWorkspaceDriveShareLink(session, shareId);
}

export async function revokeWorkspaceDriveShareLink(session: DemoSession, shareId: string) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/drive/shares/${encodeURIComponent(shareId)}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function fetchWorkspaceDrivePermissions(
  session: DemoSession,
  itemId: string,
  input: { includeInherited?: boolean } = {},
) {
  const searchParams = new URLSearchParams();
  if (input.includeInherited !== false) {
    searchParams.set('include_inherited', 'true');
  }
  const query = searchParams.toString();
  return requestWorkspaceApi<{ rows: WorkspaceDrivePermissionRecord[] }>(
    `/drive/items/${encodeURIComponent(itemId)}/permissions${query ? `?${query}` : ''}`,
    {},
    session.token,
  );
}

export async function createWorkspaceDrivePermission(
  session: DemoSession,
  itemId: string,
  payload: {
    principalType: 'user' | 'group' | 'domain' | 'anyone' | 'workspace';
    principalId: string;
    email?: string | null;
    role: 'owner' | 'editor' | 'commenter' | 'viewer';
    expiresAt?: string | null;
  },
) {
  return requestWorkspaceApi<WorkspaceDrivePermissionRecord>(
    `/drive/items/${encodeURIComponent(itemId)}/permissions`,
    {
      method: 'POST',
      body: JSON.stringify({
        principal_type: payload.principalType,
        principal_id: payload.principalId,
        email: payload.email ?? null,
        role: payload.role,
        expires_at: payload.expiresAt ?? null,
      }),
    },
    session.token,
  );
}

export async function updateWorkspaceDrivePermission(
  session: DemoSession,
  permissionId: string,
  payload: {
    expiresAt?: string | null;
    role?: 'owner' | 'editor' | 'commenter' | 'viewer';
  },
) {
  return requestWorkspaceApi<WorkspaceDrivePermissionRecord>(
    `/drive/permissions/${encodeURIComponent(permissionId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        expires_at: payload.expiresAt,
        role: payload.role,
      }),
    },
    session.token,
  );
}

export async function deleteWorkspaceDrivePermission(session: DemoSession, permissionId: string) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/drive/permissions/${encodeURIComponent(permissionId)}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function transferWorkspaceDriveOwner(
  session: DemoSession,
  itemId: string,
  targetUserId: string,
) {
  return requestWorkspaceApi<WorkspaceDrivePermissionRecord>(
    `/drive/items/${encodeURIComponent(itemId)}/transfer-owner`,
    {
      method: 'POST',
      body: JSON.stringify({
        target_user_id: targetUserId,
      }),
    },
    session.token,
  );
}

export async function fetchWorkspaceDriveGroups(session: DemoSession) {
  return requestWorkspaceApi<{ rows: WorkspaceDriveGroupRecord[] }>(
    '/drive/groups',
    {},
    session.token,
  );
}

export async function createWorkspaceDriveGroup(
  session: DemoSession,
  payload: { description?: string; name: string },
) {
  return requestWorkspaceApi<WorkspaceDriveGroupRecord>(
    '/drive/groups',
    {
      method: 'POST',
      body: JSON.stringify({
        description: payload.description || '',
        name: payload.name,
      }),
    },
    session.token,
  );
}

export async function updateWorkspaceDriveGroup(
  session: DemoSession,
  groupId: string,
  payload: { description?: string; name?: string },
) {
  return requestWorkspaceApi<WorkspaceDriveGroupRecord>(
    `/drive/groups/${encodeURIComponent(groupId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        description: payload.description,
        name: payload.name,
      }),
    },
    session.token,
  );
}

export async function deleteWorkspaceDriveGroup(session: DemoSession, groupId: string) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/drive/groups/${encodeURIComponent(groupId)}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function addWorkspaceDriveGroupMember(
  session: DemoSession,
  groupId: string,
  userId: string,
) {
  return requestWorkspaceApi<WorkspaceDriveGroupRecord>(
    `/drive/groups/${encodeURIComponent(groupId)}/members`,
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    },
    session.token,
  );
}

export async function removeWorkspaceDriveGroupMember(
  session: DemoSession,
  groupId: string,
  memberId: string,
) {
  return requestWorkspaceApi<{ ok: boolean }>(
    `/drive/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
    { method: 'DELETE' },
    session.token,
  );
}

export async function fetchWorkspaceUsers(session: DemoSession) {
  return requestWorkspaceApi<WorkspaceUserRecord[]>(
    '/safety/users',
    {},
    session.token,
  );
}

export async function fetchPublicDriveShare(token: string, session?: DemoSession | null) {
  return requestWorkspaceApi<PublicDriveSharePayload>(
    `/drive/shares/${encodeURIComponent(token)}`,
    {},
    session?.token,
  );
}

export async function fetchPublicDriveShareChildren(
  token: string,
  input: { parentId?: string | null } = {},
  session?: DemoSession | null,
) {
  const searchParams = new URLSearchParams();
  if (input.parentId) {
    searchParams.set('parent_id', input.parentId);
  }
  const query = searchParams.toString();
  return requestWorkspaceApi<PublicDriveShareChildrenPayload>(
    `/drive/shares/${encodeURIComponent(token)}/items${query ? `?${query}` : ''}`,
    {},
    session?.token,
  );
}

export async function fetchPublicDriveShareItem(
  token: string,
  itemId: string,
  session?: DemoSession | null,
) {
  return requestWorkspaceApi<PublicDriveShareItemPayload>(
    `/drive/shares/${encodeURIComponent(token)}/items/${encodeURIComponent(itemId)}`,
    {},
    session?.token,
  );
}
