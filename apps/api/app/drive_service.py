from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from .models import DriveItem, DrivePermission, DriveShare, User, WorkspaceGroup, WorkspaceGroupMember

if TYPE_CHECKING:
    from .store import InMemoryStore


ROLE_PRIORITY = {
    "viewer": 1,
    "commenter": 2,
    "editor": 3,
    "owner": 4,
}


def parse_iso_datetime(value: str | None) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None


def serialize_drive_item(item: DriveItem) -> dict[str, object]:
    return {
        "id": item.id,
        "kind": item.kind,
        "name": item.name,
        "parent_id": item.parent_id,
        "headquarter_id": item.headquarter_id,
        "site_id": item.site_id,
        "file_type": item.file_type,
        "text_content": item.text_content,
        "external_url": item.external_url,
        "content_type": item.content_type,
        "size_bytes": item.size_bytes,
        "data_url": item.data_url,
        "thumbnail_data_url": item.thumbnail_data_url,
        "is_deleted": item.is_deleted,
        "created_by": item.created_by,
        "owner_user_id": item.owner_user_id,
        "updated_by_user_id": item.updated_by_user_id,
        "trashed_at": item.trashed_at,
        "last_opened_at": item.last_opened_at,
        "is_starred": item.is_starred,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def list_drive_items(
    store: InMemoryStore,
    workspace_id: str,
    *,
    parent_id: str | None = None,
    include_deleted: bool = False,
    query: str = "",
) -> list[DriveItem]:
    normalized_query = query.strip().lower()
    rows = [
        item
        for item in store.drive_items.values()
        if item.workspace_id == workspace_id and (include_deleted or not item.is_deleted)
    ]
    if parent_id is not None:
        rows = [item for item in rows if item.parent_id == parent_id]
    if normalized_query:
        rows = [
            item
            for item in rows
            if normalized_query
            in " ".join(
                [item.name, item.text_content, item.external_url, item.content_type]
            ).lower()
        ]
    return sorted(
        rows,
        key=lambda item: (0 if item.kind == "folder" else 1, item.name.lower(), item.created_at),
    )


def build_drive_path(store: InMemoryStore, workspace_id: str, item: DriveItem) -> list[dict[str, object]]:
    path: list[dict[str, object]] = []
    current: DriveItem | None = item
    visited: set[str] = set()
    while current and current.id not in visited:
        visited.add(current.id)
        path.append({"id": current.id, "name": current.name, "kind": current.kind})
        parent_id = current.parent_id
        current = (
            store.drive_items.get(parent_id)
            if parent_id and parent_id in store.drive_items and store.drive_items[parent_id].workspace_id == workspace_id
            else None
        )
    path.reverse()
    return path


def build_relative_drive_path(
    store: InMemoryStore,
    workspace_id: str,
    item: DriveItem,
    root_item_id: str,
) -> list[dict[str, object]]:
    path = build_drive_path(store, workspace_id, item)
    for index, row in enumerate(path):
        if row["id"] == root_item_id:
            return path[index:]
    return [{"id": item.id, "name": item.name, "kind": item.kind}]


def serialize_drive_share(share: DriveShare) -> dict[str, object]:
    return {
        "id": share.id,
        "token": share.token,
        "item_id": share.item_id,
        "visibility": share.visibility,
        "role": share.role,
        "expires_at": share.expires_at,
        "revoked_at": share.revoked_at,
        "is_revoked": share.is_revoked,
        "created_at": share.created_at,
        "updated_at": share.updated_at,
    }


def is_drive_share_active(share: DriveShare) -> bool:
    if share.is_revoked:
        return False
    expiry = parse_iso_datetime(share.expires_at)
    if expiry is None:
        return True
    now = datetime.now(expiry.tzinfo) if expiry.tzinfo else datetime.utcnow()
    return expiry >= now


def collect_drive_descendant_ids(store: InMemoryStore, workspace_id: str, root_id: str) -> set[str]:
    descendant_ids: set[str] = set()
    queue = [root_id]
    while queue:
        current_id = queue.pop(0)
        if current_id in descendant_ids:
            continue
        descendant_ids.add(current_id)
        for child in store.drive_items.values():
            if child.workspace_id == workspace_id and child.parent_id == current_id:
                queue.append(child.id)
    return descendant_ids


def purge_drive_item_tree(store: InMemoryStore, workspace_id: str, root_id: str) -> set[str]:
    target_ids = collect_drive_descendant_ids(store, workspace_id, root_id)
    for item_id in target_ids:
        store.drive_items.pop(item_id, None)
    for share_id, share in list(store.drive_shares.items()):
        if share.workspace_id == workspace_id and share.item_id in target_ids:
            del store.drive_shares[share_id]
    for permission_id, permission in list(store.drive_permissions.items()):
        if permission.workspace_id == workspace_id and permission.item_id in target_ids:
            del store.drive_permissions[permission_id]
    return target_ids


def normalize_email_domain(value: str | None) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return ""
    if "@" in text:
        return text.split("@", 1)[1].strip().lower()
    return text


def list_drive_permissions_for_item(
    store: InMemoryStore,
    workspace_id: str,
    item_id: str,
) -> list[DrivePermission]:
    rows = [
        permission
        for permission in store.drive_permissions.values()
        if permission.workspace_id == workspace_id and permission.item_id == item_id
    ]
    rows.sort(key=lambda item: (item.created_at, item.id))
    return rows


def list_workspace_group_members(
    store: InMemoryStore,
    workspace_id: str,
    group_id: str,
) -> list[WorkspaceGroupMember]:
    rows = [
        member
        for member in store.workspace_group_members.values()
        if member.workspace_id == workspace_id and member.group_id == group_id
    ]
    rows.sort(key=lambda item: (item.created_at, item.id))
    return rows


def list_workspace_groups(
    store: InMemoryStore,
    workspace_id: str,
) -> list[WorkspaceGroup]:
    rows = [
        group
        for group in store.workspace_groups.values()
        if group.workspace_id == workspace_id
    ]
    rows.sort(key=lambda item: (item.created_at, item.name.lower(), item.id))
    return rows


def serialize_workspace_group(
    store: InMemoryStore,
    group: WorkspaceGroup,
) -> dict[str, object]:
    members = []
    for member in list_workspace_group_members(store, group.workspace_id, group.id):
        user = store.users.get(member.user_id)
        members.append(
            {
                "id": member.id,
                "group_id": member.group_id,
                "user_id": member.user_id,
                "created_by": member.created_by,
                "created_at": member.created_at,
                "updated_at": member.updated_at,
                "user": (
                    {
                        "id": user.id,
                        "email": user.email,
                        "name": user.name,
                        "organization_name": user.organization_name,
                        "position": user.position,
                    }
                    if user is not None
                    else None
                ),
            }
        )
    return {
        "id": group.id,
        "workspace_id": group.workspace_id,
        "name": group.name,
        "description": group.description,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "members": members,
    }


def serialize_drive_permission(
    store: InMemoryStore,
    permission: DrivePermission,
    *,
    source_item_id: str | None = None,
) -> dict[str, object]:
    item = store.drive_items.get(permission.item_id)
    source_item = store.drive_items.get(source_item_id or permission.item_id)
    return {
        "id": permission.id,
        "workspace_id": permission.workspace_id,
        "item_id": permission.item_id,
        "principal_type": permission.principal_type,
        "principal_id": permission.principal_id,
        "email": permission.email,
        "role": permission.role,
        "inherited_from_item_id": source_item_id,
        "expires_at": permission.expires_at,
        "created_by": permission.created_by,
        "created_at": permission.created_at,
        "updated_at": permission.updated_at,
        "is_inherited": source_item_id is not None and source_item_id != permission.item_id,
        "source_item_id": source_item.id if source_item is not None else None,
        "source_item_name": source_item.name if source_item is not None else None,
        "item_name": item.name if item is not None else None,
    }


def serialize_public_drive_item_metadata(item: DriveItem) -> dict[str, object]:
    return {
        "id": item.id,
        "kind": item.kind,
        "name": item.name,
        "parent_id": item.parent_id,
        "file_type": item.file_type,
        "content_type": item.content_type,
        "size_bytes": item.size_bytes,
        "thumbnail_data_url": item.thumbnail_data_url,
        "is_deleted": item.is_deleted,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def serialize_public_drive_item_content(item: DriveItem) -> dict[str, object]:
    payload = serialize_public_drive_item_metadata(item)
    payload.update(
        {
            "text_content": item.text_content,
            "external_url": item.external_url,
            "data_url": item.data_url,
        }
    )
    return payload


def get_workspace_member_user_ids(store: InMemoryStore, workspace_id: str) -> set[str]:
    return {
        membership.user_id
        for membership in store.memberships.values()
        if membership.workspace_id == workspace_id
    }


def is_workspace_member(store: InMemoryStore, workspace_id: str, user_id: str) -> bool:
    return user_id in get_workspace_member_user_ids(store, workspace_id)


def permission_is_active(permission: DrivePermission, at: datetime | None = None) -> bool:
    expiry = parse_iso_datetime(permission.expires_at)
    if expiry is None:
        return True
    if at is None:
        at = datetime.now(expiry.tzinfo) if expiry.tzinfo else datetime.utcnow()
    return expiry >= at


def iter_item_with_ancestors(
    store: InMemoryStore,
    item: DriveItem,
) -> list[DriveItem]:
    chain: list[DriveItem] = []
    current: DriveItem | None = item
    visited: set[str] = set()
    while current is not None and current.id not in visited:
        visited.add(current.id)
        chain.append(current)
        if not current.parent_id:
            break
        parent = store.drive_items.get(current.parent_id)
        if parent is None or parent.workspace_id != item.workspace_id:
            break
        current = parent
    return chain


def is_descendant_of(
    store: InMemoryStore,
    workspace_id: str,
    item_id: str,
    ancestor_id: str,
) -> bool:
    if item_id == ancestor_id:
        return True
    item = store.drive_items.get(item_id)
    if item is None or item.workspace_id != workspace_id:
        return False
    visited: set[str] = set()
    current_parent_id = item.parent_id
    while current_parent_id and current_parent_id not in visited:
        visited.add(current_parent_id)
        if current_parent_id == ancestor_id:
            return True
        parent = store.drive_items.get(current_parent_id)
        if parent is None or parent.workspace_id != workspace_id:
            return False
        current_parent_id = parent.parent_id
    return False


def principal_matches_user(
    store: InMemoryStore,
    permission: DrivePermission,
    user: User,
) -> bool:
    if permission.principal_type == "workspace":
        return is_workspace_member(store, permission.workspace_id, user.id)
    if permission.principal_type == "user":
        return permission.principal_id == user.id
    if permission.principal_type == "group":
        group = store.workspace_groups.get(permission.principal_id)
        if group is None or group.workspace_id != permission.workspace_id:
            return False
        return any(
            member.workspace_id == permission.workspace_id
            and member.group_id == group.id
            and member.user_id == user.id
            for member in store.workspace_group_members.values()
        )
    if permission.principal_type == "domain":
        return is_workspace_member(
            store,
            permission.workspace_id,
            user.id,
        ) and normalize_email_domain(user.email) == normalize_email_domain(permission.principal_id or permission.email)
    if permission.principal_type == "anyone":
        return is_workspace_member(store, permission.workspace_id, user.id)
    return False


def resolve_effective_permission(
    store: InMemoryStore,
    user: User,
    item: DriveItem,
) -> dict[str, Any] | None:
    best: dict[str, Any] | None = None
    for source_item in iter_item_with_ancestors(store, item):
        for permission in list_drive_permissions_for_item(store, item.workspace_id, source_item.id):
            if not permission_is_active(permission):
                continue
            if not principal_matches_user(store, permission, user):
                continue
            candidate = {
                "permission": permission,
                "role": permission.role,
                "source_item_id": source_item.id,
                "is_inherited": source_item.id != item.id,
            }
            if best is None or ROLE_PRIORITY[candidate["role"]] > ROLE_PRIORITY[best["role"]]:
                best = candidate
    return best


def list_effective_permissions(
    store: InMemoryStore,
    item: DriveItem,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for source_item in reversed(iter_item_with_ancestors(store, item)):
        for permission in list_drive_permissions_for_item(store, item.workspace_id, source_item.id):
            if not permission_is_active(permission):
                continue
            key = (
                permission.principal_type,
                permission.principal_id,
                permission.role,
                source_item.id,
            )
            if key in seen:
                continue
            seen.add(key)
            rows.append(
                serialize_drive_permission(
                    store,
                    permission,
                    source_item_id=source_item.id if source_item.id != item.id else None,
                )
            )
    rows.sort(
        key=lambda payload: (
            payload["is_inherited"],
            -ROLE_PRIORITY[str(payload["role"])],
            str(payload["principal_type"]),
            str(payload["principal_id"]),
        )
    )
    return rows


def can_read_item(store: InMemoryStore, user: User, item: DriveItem) -> bool:
    effective = resolve_effective_permission(store, user, item)
    return effective is not None and ROLE_PRIORITY[effective["role"]] >= ROLE_PRIORITY["viewer"]


def can_edit_item(store: InMemoryStore, user: User, item: DriveItem) -> bool:
    effective = resolve_effective_permission(store, user, item)
    return effective is not None and ROLE_PRIORITY[effective["role"]] >= ROLE_PRIORITY["editor"]


def can_share_item(store: InMemoryStore, user: User, item: DriveItem) -> bool:
    effective = resolve_effective_permission(store, user, item)
    return effective is not None and ROLE_PRIORITY[effective["role"]] >= ROLE_PRIORITY["editor"]


def resolve_share_link_access(
    store: InMemoryStore,
    share: DriveShare,
    item: DriveItem,
    user: User | None,
) -> dict[str, Any]:
    if share.workspace_id != item.workspace_id:
        raise ValueError("shared item mismatch")
    if share.visibility == "anyone_with_link":
        return {
            "role": share.role,
            "share": share,
            "user": user,
        }
    if user is None:
        raise PermissionError("restricted_login_required")
    effective = resolve_effective_permission(store, user, item)
    if effective is None:
        raise LookupError("restricted_permission_required")
    return {
        "role": effective["role"],
        "share": share,
        "user": user,
        "permission": effective,
    }
