import type {
  PublicDriveShareItemRecord,
  WorkspaceDriveGroupRecord,
  WorkspaceDriveItemRecord,
  WorkspaceDrivePermissionRecord,
  WorkspaceDriveShareRecord,
  WorkspaceUserRecord,
} from '@/lib/workspaceStorageApi';
import type {
  DriveGroupViewModel,
  DriveItemViewModel,
  DrivePermissionViewModel,
  DriveShareViewModel,
  DriveWorkspaceUserViewModel,
} from '@/lib/webhard/driveTypes';

export function mapWorkspaceDriveItem(item: WorkspaceDriveItemRecord): DriveItemViewModel {
  return {
    contentType: item.content_type,
    createdAt: item.created_at,
    dataUrl: item.data_url,
    externalUrl: item.external_url,
    fileType: item.file_type,
    headquarterId: item.headquarter_id,
    id: item.id,
    isDeleted: item.is_deleted,
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
    isStarred: item.is_starred,
  };
}

export function mapWorkspaceDriveShare(item: WorkspaceDriveShareRecord): DriveShareViewModel {
  return {
    createdAt: item.created_at,
    expiresAt: item.expires_at,
    id: item.id,
    isRevoked: item.is_revoked,
    itemId: item.item_id,
    revokedAt: item.revoked_at,
    role: item.role,
    token: item.token,
    updatedAt: item.updated_at,
    visibility: item.visibility,
  };
}

export function mapWorkspaceDrivePermission(
  item: WorkspaceDrivePermissionRecord,
): DrivePermissionViewModel {
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

export function mapWorkspaceDriveGroup(item: WorkspaceDriveGroupRecord): DriveGroupViewModel {
  return {
    createdAt: item.created_at,
    createdBy: item.created_by,
    description: item.description,
    id: item.id,
    members: item.members.map((member) => ({
      createdAt: member.created_at,
      createdBy: member.created_by,
      groupId: member.group_id,
      id: member.id,
      updatedAt: member.updated_at,
      user: member.user
        ? {
            email: member.user.email,
            id: member.user.id,
            name: member.user.name,
            organizationName: member.user.organization_name ?? null,
            position: member.user.position ?? null,
          }
        : null,
      userId: member.user_id,
    })),
    updatedAt: item.updated_at,
    workspaceId: item.workspace_id,
    name: item.name,
  };
}

export function mapWorkspaceUser(item: WorkspaceUserRecord): DriveWorkspaceUserViewModel {
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

export function mapPublicDriveItem(item: PublicDriveShareItemRecord): DriveItemViewModel {
  return {
    contentType: item.content_type,
    createdAt: item.created_at,
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
