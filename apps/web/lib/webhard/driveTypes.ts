import type { GuestDriveItem, GuestDriveShare } from '@/lib/guestWorkspaceCache';

export type CreateMode = 'folder' | 'link' | 'note' | null;
export type DrivePermissionRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type DrivePrincipalType = 'user' | 'group' | 'domain' | 'anyone' | 'workspace';
export type DriveShareVisibility = 'restricted' | 'anyone_with_link';
export type DriveShareRole = 'viewer' | 'editor';
export type ListingMode = 'grid' | 'list';
export type NavigationMode = 'recent' | 'root' | 'shared' | 'trash';
export type SortMode = 'name' | 'size' | 'type' | 'updated';

export interface DriveItemViewModel extends GuestDriveItem {
  ownerUserId?: string | null;
  updatedByUserId?: string | null;
  trashedAt?: string | null;
  lastOpenedAt?: string | null;
  isStarred?: boolean;
}

export interface DriveShareViewModel extends GuestDriveShare {
  token?: string | null;
  isRevoked?: boolean;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  visibility?: DriveShareVisibility;
  role?: DriveShareRole;
}

export interface DrivePermissionViewModel {
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

export interface DriveGroupMemberViewModel {
  id: string;
  groupId: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationName?: string | null;
    position?: string | null;
  } | null;
}

export interface DriveGroupViewModel {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: DriveGroupMemberViewModel[];
}

export interface DriveWorkspaceUserViewModel {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role?: string;
  position?: string | null;
  organizationName?: string | null;
}

export interface DriveSnapshot {
  items: DriveItemViewModel[];
  shares: DriveShareViewModel[];
  updatedAt: string | null;
}

export interface WebhardCapabilities {
  canManageShares: boolean;
  canSyncWithServer: boolean;
}
