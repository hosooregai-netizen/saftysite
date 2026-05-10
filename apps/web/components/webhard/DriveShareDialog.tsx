'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/components/webhard/DriveShareDialog.module.css';
import {
  addDriveGroupMember,
  createDriveGroup,
  createDrivePermission,
  createDriveShareLink,
  deleteDriveGroup,
  deleteDrivePermission,
  fetchDriveGroups,
  fetchDrivePermissions,
  fetchDriveShares,
  fetchDriveWorkspaceUsers,
  removeDriveGroupMember,
  revokeDriveShareLink,
  updateDriveGroup,
  updateDrivePermission,
  updateDriveShareLink,
} from '@/lib/webhard/driveApi';
import {
  mapWorkspaceDriveGroup,
  mapWorkspaceDrivePermission,
  mapWorkspaceDriveShare,
  mapWorkspaceUser,
} from '@/lib/webhard/driveMappers';
import { buildShareUrl } from '@/lib/webhard/drivePreview';
import type {
  DriveGroupViewModel,
  DriveItemViewModel,
  DrivePermissionRole,
  DrivePermissionViewModel,
  DrivePrincipalType,
  DriveShareRole,
  DriveShareViewModel,
  DriveShareVisibility,
  DriveWorkspaceUserViewModel,
} from '@/lib/webhard/driveTypes';
import type { DemoSession } from '@/lib/reportApi';

type PermissionDraft = {
  expiresAt: string;
  role: DrivePermissionRole;
};

type GroupDraft = {
  description: string;
  memberUserId: string;
  name: string;
};

type ShareDraft = {
  expiresAt: string;
  role: DriveShareRole;
  visibility: DriveShareVisibility;
};

const MUTABLE_PERMISSION_ROLES: Array<DrivePermissionRole> = ['viewer', 'editor'];

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildPermissionLabel(
  permission: DrivePermissionViewModel,
  groups: DriveGroupViewModel[],
  users: DriveWorkspaceUserViewModel[],
) {
  if (permission.principalType === 'workspace') {
    return '현재 작업공간';
  }
  if (permission.principalType === 'user') {
    const user = users.find((row) => row.id === permission.principalId);
    return user ? `${user.name} · ${user.email}` : permission.email || permission.principalId;
  }
  if (permission.principalType === 'group') {
    const group = groups.find((row) => row.id === permission.principalId);
    return group ? `그룹 · ${group.name}` : `그룹 · ${permission.principalId}`;
  }
  if (permission.principalType === 'domain') {
    return `도메인 · ${permission.principalId}`;
  }
  if (permission.principalType === 'anyone') {
    return '워크스페이스 로그인 사용자';
  }
  return permission.principalId;
}

function buildPermissionMeta(permission: DrivePermissionViewModel) {
  if (!permission.isInherited) {
    return '직접 권한';
  }
  return permission.sourceItemName
    ? `상속 권한 · ${permission.sourceItemName}`
    : '상속 권한';
}

export function DriveShareDialog({
  item,
  onClose,
  onSyncShares,
  open,
  session,
}: {
  item: DriveItemViewModel | null;
  onClose: () => void;
  onSyncShares: (itemId: string, shares: DriveShareViewModel[]) => Promise<void>;
  open: boolean;
  session: DemoSession | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [permissions, setPermissions] = useState<DrivePermissionViewModel[]>([]);
  const [groups, setGroups] = useState<DriveGroupViewModel[]>([]);
  const [shareLinks, setShareLinks] = useState<DriveShareViewModel[]>([]);
  const [users, setUsers] = useState<DriveWorkspaceUserViewModel[]>([]);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, PermissionDraft>>({});
  const [shareDrafts, setShareDrafts] = useState<Record<string, ShareDraft>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, GroupDraft>>({});
  const [newPrincipalType, setNewPrincipalType] = useState<Exclude<DrivePrincipalType, 'anyone'>>('user');
  const [newPrincipalRole, setNewPrincipalRole] = useState<Exclude<DrivePermissionRole, 'commenter'>>('viewer');
  const [newPrincipalUserId, setNewPrincipalUserId] = useState('');
  const [newPrincipalGroupId, setNewPrincipalGroupId] = useState('');
  const [newPrincipalDomain, setNewPrincipalDomain] = useState('');
  const [newPrincipalExpiresAt, setNewPrincipalExpiresAt] = useState('');
  const [newShareVisibility, setNewShareVisibility] = useState<DriveShareVisibility>('anyone_with_link');
  const [newShareRole, setNewShareRole] = useState<DriveShareRole>('viewer');
  const [newShareExpiresAt, setNewShareExpiresAt] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const directPermissions = useMemo(
    () => permissions.filter((permission) => !permission.isInherited),
    [permissions],
  );
  const inheritedPermissions = useMemo(
    () => permissions.filter((permission) => permission.isInherited),
    [permissions],
  );
  const workspacePermission = useMemo(
    () =>
      directPermissions.find((permission) => permission.principalType === 'workspace') ?? null,
    [directPermissions],
  );

  const syncShareRows = async (rows: DriveShareViewModel[]) => {
    setShareLinks(rows);
    if (item) {
      await onSyncShares(item.id, rows);
    }
  };

  const hydrateDrafts = (
    nextPermissions: DrivePermissionViewModel[],
    nextGroups: DriveGroupViewModel[],
    nextShares: DriveShareViewModel[],
  ) => {
    setPermissionDrafts(
      Object.fromEntries(
        nextPermissions.map((permission) => [
          permission.id,
          {
            expiresAt: toDateTimeLocalValue(permission.expiresAt),
            role: permission.role,
          },
        ]),
      ),
    );
    setGroupDrafts(
      Object.fromEntries(
        nextGroups.map((group) => [
          group.id,
          {
            description: group.description,
            memberUserId: '',
            name: group.name,
          },
        ]),
      ),
    );
    setShareDrafts(
      Object.fromEntries(
        nextShares.map((share) => [
          share.id,
          {
            expiresAt: toDateTimeLocalValue(share.expiresAt),
            role: share.role === 'editor' ? 'editor' : 'viewer',
            visibility: share.visibility === 'restricted' ? 'restricted' : 'anyone_with_link',
          },
        ]),
      ),
    );
  };

  const reload = async () => {
    if (!open || !item || !session) return;
    setIsLoading(true);
    setError('');
    try {
      const [permissionsResponse, groupsResponse, sharesResponse, usersResponse] = await Promise.all([
        fetchDrivePermissions(session, item.id, { includeInherited: true }),
        fetchDriveGroups(session),
        fetchDriveShares(session, { itemId: item.id }),
        fetchDriveWorkspaceUsers(session),
      ]);

      const nextPermissions = permissionsResponse.rows.map(mapWorkspaceDrivePermission);
      const nextGroups = groupsResponse.rows.map(mapWorkspaceDriveGroup);
      const nextShares = sharesResponse.rows.map(mapWorkspaceDriveShare);
      const nextUsers = usersResponse.map(mapWorkspaceUser);
      setPermissions(nextPermissions);
      setGroups(nextGroups);
      setUsers(nextUsers);
      hydrateDrafts(nextPermissions, nextGroups, nextShares);
      await syncShareRows(nextShares);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '공유 설정을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, session?.token]);

  const availableUsers = useMemo(
    () => users.filter((user) => user.id !== session?.userId),
    [session?.userId, users],
  );

  const createPermissionForWorkspace = async () => {
    if (!item || !session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await createDrivePermission(session, item.id, {
        principalType: 'workspace',
        principalId: session.workspaceId,
        role: 'editor',
      });
      setNotice('작업공간 기본 권한을 복구했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '작업공간 권한을 복구하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!item || !session) return;
    const principalId =
      newPrincipalType === 'user'
        ? newPrincipalUserId
        : newPrincipalType === 'group'
          ? newPrincipalGroupId
          : newPrincipalType === 'domain'
            ? newPrincipalDomain
            : session.workspaceId;
    if (!principalId.trim()) {
      setError('공유 대상을 선택해 주세요.');
      return;
    }
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await createDrivePermission(session, item.id, {
        principalType: newPrincipalType,
        principalId,
        role: newPrincipalRole,
        expiresAt: fromDateTimeLocalValue(newPrincipalExpiresAt),
      });
      setNewPrincipalExpiresAt('');
      setNewPrincipalUserId('');
      setNewPrincipalGroupId('');
      setNewPrincipalDomain('');
      setNotice('접근 권한을 추가했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '접근 권한을 추가하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSavePermission = async (permission: DrivePermissionViewModel) => {
    if (!session) return;
    const draft = permissionDrafts[permission.id];
    if (!draft) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await updateDrivePermission(session, permission.id, {
        expiresAt: fromDateTimeLocalValue(draft.expiresAt),
        role: draft.role,
      });
      setNotice('권한 설정을 저장했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '권한 설정을 저장하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await deleteDrivePermission(session, permissionId);
      setNotice('권한을 제거했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '권한을 제거하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!item || !session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await createDriveShareLink(session, {
        itemId: item.id,
        expiresAt: fromDateTimeLocalValue(newShareExpiresAt),
        role: newShareRole,
        visibility: newShareVisibility,
      });
      setNewShareExpiresAt('');
      setNotice('공유 링크를 만들었습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '공유 링크를 만들지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveShareLink = async (share: DriveShareViewModel) => {
    if (!session) return;
    const draft = shareDrafts[share.id];
    if (!draft) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await updateDriveShareLink(session, share.id, {
        expiresAt: fromDateTimeLocalValue(draft.expiresAt),
        role: draft.role,
        visibility: draft.visibility,
      });
      setNotice('링크 설정을 저장했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '링크 설정을 저장하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRevokeShareLink = async (shareId: string) => {
    if (!session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await revokeDriveShareLink(session, shareId);
      setNotice('공유 링크를 폐기했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '공유 링크를 폐기하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCopyLink = async (share: DriveShareViewModel) => {
    if (!share.token || typeof navigator === 'undefined' || !navigator.clipboard) {
      setError('클립보드에 링크를 복사할 수 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(buildShareUrl(share.token));
      setNotice('공유 링크를 복사했습니다.');
    } catch {
      setError('공유 링크를 복사하지 못했습니다.');
    }
  };

  const handleCreateGroup = async () => {
    if (!session || !newGroupName.trim()) {
      setError('그룹 이름을 입력해 주세요.');
      return;
    }
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await createDriveGroup(session, {
        description: newGroupDescription.trim(),
        name: newGroupName.trim(),
      });
      setNewGroupDescription('');
      setNewGroupName('');
      setNotice('그룹을 만들었습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹을 만들지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveGroup = async (groupId: string) => {
    if (!session) return;
    const draft = groupDrafts[groupId];
    if (!draft?.name.trim()) {
      setError('그룹 이름을 입력해 주세요.');
      return;
    }
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await updateDriveGroup(session, groupId, {
        description: draft.description.trim(),
        name: draft.name.trim(),
      });
      setNotice('그룹 정보를 저장했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 정보를 저장하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await deleteDriveGroup(session, groupId);
      setNotice('그룹을 삭제했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹을 삭제하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddGroupMember = async (groupId: string) => {
    if (!session) return;
    const userId = groupDrafts[groupId]?.memberUserId || '';
    if (!userId) {
      setError('추가할 사용자를 선택해 주세요.');
      return;
    }
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await addDriveGroupMember(session, groupId, userId);
      setNotice('그룹에 사용자를 추가했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 멤버를 추가하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
    if (!session) return;
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      await removeDriveGroupMember(session, groupId, memberId);
      setNotice('그룹 멤버를 제거했습니다.');
      await reload();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 멤버를 제거하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  if (!open || !item) {
    return null;
  }

  return (
    <div className={styles.scrim} onClick={onClose} role="presentation">
      <section
        className={`erp-panel modal-card ${styles.card}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-share-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="page-kicker">공유 설정</span>
            <h2 id="drive-share-dialog-title" className={styles.title}>
              {item.name}
            </h2>
            <span className={styles.subtitle}>
              사용자, 그룹, 도메인 권한과 링크 공유를 한곳에서 관리합니다.
            </span>
          </div>
          <button type="button" className="erp-button erp-button-secondary" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={styles.body}>
          {(error || notice) && (
            <div className={styles.feedback}>
              {error ? <div className={styles.error}>{error}</div> : null}
              {notice ? <div className={styles.notice}>{notice}</div> : null}
            </div>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>접근 권한</h3>
                <div className={styles.sectionHint}>
                  직접 부여된 권한은 수정할 수 있고, 상속 권한은 읽기 전용으로 확인할 수 있습니다.
                </div>
              </div>
              {!workspacePermission && !item.parentId ? (
                <button
                  type="button"
                  className="erp-button erp-button-secondary"
                  disabled={isMutating}
                  onClick={() => void createPermissionForWorkspace()}
                >
                  작업공간 기본 권한 복구
                </button>
              ) : null}
            </div>

            {isLoading ? (
              <div className={styles.empty}>공유 설정을 불러오는 중입니다.</div>
            ) : (
              <>
                {directPermissions.map((permission) => {
                  const draft = permissionDrafts[permission.id];
                  const isOwner = permission.role === 'owner';
                  return (
                    <article key={permission.id} className={styles.row}>
                      <div className={styles.rowHeader}>
                        <div className={styles.rowTitle}>
                          <strong>{buildPermissionLabel(permission, groups, users)}</strong>
                          <span className={styles.sectionHint}>{buildPermissionMeta(permission)}</span>
                        </div>
                        <div className={styles.rowMeta}>
                          <span className={styles.chip}>{permission.role}</span>
                          {permission.expiresAt ? (
                            <span className={`${styles.chip} ${styles.chipMuted}`}>만료 설정됨</span>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.controls}>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>역할</span>
                          <select
                            className="erp-select"
                            disabled={isOwner || isMutating}
                            value={draft?.role || permission.role}
                            onChange={(event) =>
                              setPermissionDrafts((current) => ({
                                ...current,
                                [permission.id]: {
                                  expiresAt: current[permission.id]?.expiresAt || '',
                                  role: event.target.value as DrivePermissionRole,
                                },
                              }))
                            }
                          >
                            {isOwner ? <option value="owner">owner</option> : null}
                            {permission.role === 'commenter' ? <option value="commenter">commenter</option> : null}
                            {MUTABLE_PERMISSION_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span className={styles.fieldLabel}>만료일</span>
                          <input
                            className="erp-input"
                            disabled={isOwner || isMutating}
                            type="datetime-local"
                            value={draft?.expiresAt || ''}
                            onChange={(event) =>
                              setPermissionDrafts((current) => ({
                                ...current,
                                [permission.id]: {
                                  expiresAt: event.target.value,
                                  role: current[permission.id]?.role || permission.role,
                                },
                              }))
                            }
                          />
                        </label>
                        <div className={styles.actions}>
                          {!isOwner ? (
                            <>
                              <button
                                type="button"
                                className="erp-button erp-button-secondary"
                                disabled={isMutating}
                                onClick={() => void handleSavePermission(permission)}
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                className="erp-button erp-button-text"
                                disabled={isMutating}
                                onClick={() => void handleDeletePermission(permission.id)}
                              >
                                제거
                              </button>
                            </>
                          ) : (
                            <span className={styles.sectionHint}>owner 권한은 현재 MVP에서 고정됩니다.</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {inheritedPermissions.length > 0 ? (
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <div>
                        <h4 className={styles.sectionTitle}>상속된 권한</h4>
                        <div className={styles.sectionHint}>상위 폴더에서 내려온 권한입니다.</div>
                      </div>
                    </div>
                    {inheritedPermissions.map((permission) => (
                      <article key={permission.id} className={styles.row}>
                        <div className={styles.rowHeader}>
                          <div className={styles.rowTitle}>
                            <strong>{buildPermissionLabel(permission, groups, users)}</strong>
                            <span className={styles.sectionHint}>{buildPermissionMeta(permission)}</span>
                          </div>
                          <div className={styles.rowMeta}>
                            <span className={styles.chip}>{permission.role}</span>
                            <span className={`${styles.chip} ${styles.chipMuted}`}>읽기 전용</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>공유 대상</span>
                    <select
                      className="erp-select"
                      value={newPrincipalType}
                      onChange={(event) => setNewPrincipalType(event.target.value as Exclude<DrivePrincipalType, 'anyone'>)}
                    >
                      <option value="user">사용자</option>
                      <option value="group">그룹</option>
                      <option value="domain">도메인</option>
                      <option value="workspace">현재 작업공간</option>
                    </select>
                  </label>
                  {newPrincipalType === 'user' ? (
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>사용자 선택</span>
                      <select className="erp-select" value={newPrincipalUserId} onChange={(event) => setNewPrincipalUserId(event.target.value)}>
                        <option value="">사용자 선택</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} · {user.email}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {newPrincipalType === 'group' ? (
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>그룹 선택</span>
                      <select className="erp-select" value={newPrincipalGroupId} onChange={(event) => setNewPrincipalGroupId(event.target.value)}>
                        <option value="">그룹 선택</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {newPrincipalType === 'domain' ? (
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>도메인</span>
                      <input
                        className="erp-input"
                        placeholder="example.com"
                        value={newPrincipalDomain}
                        onChange={(event) => setNewPrincipalDomain(event.target.value)}
                      />
                    </label>
                  ) : null}
                  {newPrincipalType === 'workspace' ? (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>대상</span>
                      <div className={styles.sectionHint}>현재 작업공간 전체 구성원에게 적용합니다.</div>
                    </div>
                  ) : null}
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>역할</span>
                    <select className="erp-select" value={newPrincipalRole} onChange={(event) => setNewPrincipalRole(event.target.value as Exclude<DrivePermissionRole, 'commenter'>)}>
                      <option value="viewer">viewer</option>
                      <option value="editor">editor</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>만료일</span>
                    <input
                      className="erp-input"
                      type="datetime-local"
                      value={newPrincipalExpiresAt}
                      onChange={(event) => setNewPrincipalExpiresAt(event.target.value)}
                    />
                  </label>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="erp-button erp-button-primary"
                      disabled={isMutating}
                      onClick={() => void handleCreatePermission()}
                    >
                      권한 추가
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>링크 공유</h3>
                <div className={styles.sectionHint}>
                  restricted 링크는 로그인과 명시적 권한이 모두 있어야 열립니다.
                </div>
              </div>
            </div>

            {shareLinks.length === 0 ? (
              <div className={styles.empty}>아직 발급된 공유 링크가 없습니다.</div>
            ) : (
              shareLinks.map((share) => {
                const draft = shareDrafts[share.id];
                return (
                  <article key={share.id} className={styles.row}>
                    <div className={styles.rowHeader}>
                      <div className={styles.rowTitle}>
                        <strong className={styles.linkValue}>
                          {share.token ? buildShareUrl(share.token) : '링크 정보를 확인할 수 없습니다.'}
                        </strong>
                        <span className={styles.sectionHint}>
                          {share.visibility === 'restricted' ? '로그인 + 권한 필요' : '링크 보유자 접근 가능'}
                        </span>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={styles.chip}>{draft?.role || share.role || 'viewer'}</span>
                        <span className={styles.chip}>{draft?.visibility || share.visibility || 'anyone_with_link'}</span>
                      </div>
                    </div>
                    <div className={styles.controls}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>공개 범위</span>
                        <select
                          className="erp-select"
                          value={draft?.visibility || 'anyone_with_link'}
                          onChange={(event) =>
                            setShareDrafts((current) => ({
                              ...current,
                              [share.id]: {
                                expiresAt: current[share.id]?.expiresAt || '',
                                role: current[share.id]?.role || 'viewer',
                                visibility: event.target.value as DriveShareVisibility,
                              },
                            }))
                          }
                        >
                          <option value="anyone_with_link">anyone_with_link</option>
                          <option value="restricted">restricted</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>링크 역할</span>
                        <select
                          className="erp-select"
                          value={draft?.role || 'viewer'}
                          onChange={(event) =>
                            setShareDrafts((current) => ({
                              ...current,
                              [share.id]: {
                                expiresAt: current[share.id]?.expiresAt || '',
                                role: event.target.value as DriveShareRole,
                                visibility: current[share.id]?.visibility || 'anyone_with_link',
                              },
                            }))
                          }
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>만료일</span>
                        <input
                          className="erp-input"
                          type="datetime-local"
                          value={draft?.expiresAt || ''}
                          onChange={(event) =>
                            setShareDrafts((current) => ({
                              ...current,
                              [share.id]: {
                                expiresAt: event.target.value,
                                role: current[share.id]?.role || 'viewer',
                                visibility: current[share.id]?.visibility || 'anyone_with_link',
                              },
                            }))
                          }
                        />
                      </label>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="erp-button erp-button-secondary"
                          disabled={isMutating}
                          onClick={() => void handleSaveShareLink(share)}
                        >
                          저장
                        </button>
                        {share.token ? (
                          <>
                            <button
                              type="button"
                              className="erp-button erp-button-secondary"
                              onClick={() => void handleCopyLink(share)}
                            >
                              링크 복사
                            </button>
                            <Link href={buildShareUrl(share.token)} target="_blank" className="erp-button erp-button-secondary">
                              열기
                            </Link>
                          </>
                        ) : null}
                        <button
                          type="button"
                          className="erp-button erp-button-text"
                          disabled={isMutating}
                          onClick={() => void handleRevokeShareLink(share.id)}
                        >
                          폐기
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>새 링크 공개 범위</span>
                <select className="erp-select" value={newShareVisibility} onChange={(event) => setNewShareVisibility(event.target.value as DriveShareVisibility)}>
                  <option value="anyone_with_link">anyone_with_link</option>
                  <option value="restricted">restricted</option>
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>링크 역할</span>
                <select className="erp-select" value={newShareRole} onChange={(event) => setNewShareRole(event.target.value as DriveShareRole)}>
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>만료일</span>
                <input
                  className="erp-input"
                  type="datetime-local"
                  value={newShareExpiresAt}
                  onChange={(event) => setNewShareExpiresAt(event.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="erp-button erp-button-primary"
                  disabled={isMutating}
                  onClick={() => void handleCreateShareLink()}
                >
                  링크 만들기
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>그룹 관리</h3>
                <div className={styles.sectionHint}>워크스페이스에서 재사용할 그룹을 만들고 멤버를 관리합니다.</div>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>새 그룹 이름</span>
                <input className="erp-input" value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>설명</span>
                <input
                  className="erp-input"
                  value={newGroupDescription}
                  onChange={(event) => setNewGroupDescription(event.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="erp-button erp-button-secondary"
                  disabled={isMutating}
                  onClick={() => void handleCreateGroup()}
                >
                  그룹 만들기
                </button>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className={styles.empty}>아직 만들어진 그룹이 없습니다.</div>
            ) : (
              groups.map((group) => {
                const draft = groupDrafts[group.id] || {
                  description: group.description,
                  memberUserId: '',
                  name: group.name,
                };
                const selectableUsers = users.filter(
                  (user) => !group.members.some((member) => member.userId === user.id),
                );
                return (
                  <article key={group.id} className={styles.row}>
                    <div className={styles.rowHeader}>
                      <div className={styles.rowTitle}>
                        <strong>{group.name}</strong>
                        <span className={styles.sectionHint}>{group.description || '설명 없음'}</span>
                      </div>
                      <div className={styles.rowMeta}>
                        <span className={styles.chip}>{group.members.length}명</span>
                      </div>
                    </div>
                    <div className={styles.controls}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>그룹 이름</span>
                        <input
                          className="erp-input"
                          value={draft.name}
                          onChange={(event) =>
                            setGroupDrafts((current) => ({
                              ...current,
                              [group.id]: {
                                ...draft,
                                name: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>설명</span>
                        <input
                          className="erp-input"
                          value={draft.description}
                          onChange={(event) =>
                            setGroupDrafts((current) => ({
                              ...current,
                              [group.id]: {
                                ...draft,
                                description: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="erp-button erp-button-secondary"
                          disabled={isMutating}
                          onClick={() => void handleSaveGroup(group.id)}
                        >
                          그룹 저장
                        </button>
                        <button
                          type="button"
                          className="erp-button erp-button-text"
                          disabled={isMutating}
                          onClick={() => void handleDeleteGroup(group.id)}
                        >
                          그룹 삭제
                        </button>
                      </div>
                    </div>
                    <div className={styles.members}>
                      {group.members.map((member) => (
                        <span key={member.id} className={styles.memberTag}>
                          {member.user?.name || member.userId}
                          <button
                            type="button"
                            className="erp-button erp-button-text"
                            disabled={isMutating}
                            onClick={() => void handleRemoveGroupMember(group.id, member.id)}
                          >
                            제거
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className={styles.controls}>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>멤버 추가</span>
                        <select
                          className="erp-select"
                          value={draft.memberUserId}
                          onChange={(event) =>
                            setGroupDrafts((current) => ({
                              ...current,
                              [group.id]: {
                                ...draft,
                                memberUserId: event.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">사용자 선택</option>
                          {selectableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} · {user.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="erp-button erp-button-secondary"
                          disabled={isMutating}
                          onClick={() => void handleAddGroupMember(group.id)}
                        >
                          멤버 추가
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>

        <div className={styles.footer}>
          <button type="button" className="erp-button erp-button-primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}
