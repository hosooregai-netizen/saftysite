export type DriveCreateKind = 'folder' | 'link' | 'note' | null;
export type DriveScope = 'root' | 'recent' | 'shared' | 'starred' | 'trash';
export type DriveSortMode = 'updated' | 'name' | 'size' | 'type';
export type DriveViewMode = 'grid' | 'table';
export type DriveSelectionMode = 'replace' | 'toggle' | 'range';

export type DrivePermissionRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type DrivePrincipalType = 'user' | 'group' | 'domain' | 'anyone' | 'workspace';
export type DriveShareRole = 'viewer' | 'editor';
export type DriveShareVisibility = 'restricted' | 'anyone_with_link';

export interface DriveItemRecord {
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
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  ownerUserId: string | null;
  updatedByUserId: string | null;
  lastOpenedAt: string | null;
  trashedAt: string | null;
}

export interface DriveShareRecord {
  id: string;
  itemId: string;
  token: string | null;
  visibility: DriveShareVisibility;
  role: DriveShareRole;
  expiresAt: string | null;
  revokedAt: string | null;
  isRevoked: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DrivePermissionRecord {
  id: string;
  workspaceId: string;
  itemId: string;
  principalType: DrivePrincipalType;
  principalId: string;
  email: string | null;
  role: DrivePermissionRole;
  inheritedFromItemId: string | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isInherited: boolean;
  sourceItemId: string | null;
  sourceItemName: string | null;
  itemName: string | null;
}

export interface DriveUserRecord {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  position?: string | null;
  organizationName?: string | null;
}

export interface DriveGroupMemberRecord {
  id: string;
  groupId: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user: DriveUserRecord | null;
}

export interface DriveGroupRecord {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: DriveGroupMemberRecord[];
}

export interface DriveSnapshot {
  items: DriveItemRecord[];
  shares: DriveShareRecord[];
  updatedAt: string | null;
}

export interface DriveCapabilities {
  canManageShares: boolean;
  canSyncWithServer: boolean;
}

export interface DrivePathNode {
  id: string;
  kind: 'folder' | 'file';
  name: string;
}

export interface DriveContextMenuState {
  itemId: string;
  x: number;
  y: number;
}

export interface DriveShareSummary {
  detail?: string | null;
  label: string;
  tone: 'muted' | 'shared' | 'stopped' | 'warning';
}

export interface DriveUploadQueueItem {
  batchId: string;
  fileName: string;
  id: string;
  progress: number;
  sizeBytes: number;
  status: 'queued' | 'processing' | 'done' | 'failed';
}

export interface DriveUploadBatchSummary {
  batchId: string;
  count: number;
  itemIds: string[];
}

export interface DrivePublicPayload {
  item: DriveItemRecord;
  path: DrivePathNode[];
  rootItemId: string;
  rows: DriveItemRecord[];
  shareRole: DriveShareRole;
  shareVisibility: DriveShareVisibility;
}
