'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dialogStyles from '@/features/drive/DriveShareDialog.module.css';
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
  removeDriveGroupMember,
  revokeDriveShareLink,
  transferDriveOwner,
  updateDriveGroup,
  updateDrivePermission,
  updateDriveShareLink,
} from '@/features/drive/driveApi';
import type {
  DriveGroupRecord,
  DriveItemRecord,
  DrivePermissionRecord,
  DrivePermissionRole,
  DriveShareRecord,
  DriveShareRole,
  DriveShareVisibility,
  DriveUserRecord,
} from '@/features/drive/types';
import type { DemoSession } from '@/lib/reportApi';
import { buildShareUrl } from '@/lib/webhard/drivePreview';

function permissionLabel(
  permission: DrivePermissionRecord,
  users: DriveUserRecord[],
  groups: DriveGroupRecord[],
) {
  if (permission.principalType === 'workspace') return '현재 작업공간';
  if (permission.principalType === 'domain') return `도메인 · ${permission.principalId}`;
  if (permission.principalType === 'group') {
    const group = groups.find((row) => row.id === permission.principalId);
    return group ? `그룹 · ${group.name}` : `그룹 · ${permission.principalId}`;
  }
  if (permission.principalType === 'anyone') return 'Anyone';
  if (permission.principalType === 'user') {
    const matched = users.find((user) => user.id === permission.principalId);
    if (matched) return `${matched.name} · ${matched.email}`;
  }
  return permission.email || permission.principalId;
}

function permissionRoleLabel(role: DrivePermissionRole) {
  if (role === 'owner') return 'Owner';
  if (role === 'editor') return 'Editor';
  return 'Viewer';
}

function toLocalDateTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, '').replace(/^.*@/, '');
}

const MUTABLE_ROLES: Array<Extract<DrivePermissionRole, 'viewer' | 'editor'>> = ['viewer', 'editor'];

export function DriveShareDialog({
  item,
  onClose,
  onSyncShares,
  open,
  session,
  users,
}: {
  item: DriveItemRecord | null;
  onClose: () => void;
  onSyncShares: (itemId: string, shares: DriveShareRecord[]) => Promise<void>;
  open: boolean;
  session: DemoSession | null;
  users: DriveUserRecord[];
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [permissions, setPermissions] = useState<DrivePermissionRecord[]>([]);
  const [shares, setShares] = useState<DriveShareRecord[]>([]);
  const [groups, setGroups] = useState<DriveGroupRecord[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'editor'>('viewer');
  const [principalMode, setPrincipalMode] = useState<'user' | 'group' | 'domain'>('user');
  const [ownerTransferUserId, setOwnerTransferUserId] = useState('');
  const [groupDrafts, setGroupDrafts] = useState<Record<string, { description: string; memberUserId: string; name: string }>>({});
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupDescriptionInput, setGroupDescriptionInput] = useState('');
  const [visibility, setVisibility] = useState<DriveShareVisibility>('restricted');
  const [linkRole, setLinkRole] = useState<DriveShareRole>('viewer');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const directPermissions = useMemo(
    () => permissions.filter((permission) => !permission.isInherited),
    [permissions],
  );
  const inheritedPermissions = useMemo(
    () => permissions.filter((permission) => permission.isInherited),
    [permissions],
  );
  const workspacePermissions = useMemo(
    () => directPermissions.filter((permission) => permission.principalType === 'workspace'),
    [directPermissions],
  );
  const peoplePermissions = useMemo(
    () => directPermissions.filter((permission) => permission.principalType !== 'workspace'),
    [directPermissions],
  );
  const activeShare = useMemo(
    () => shares.find((share) => !share.isRevoked) ?? null,
    [shares],
  );
  const currentOwnerPermission = useMemo(
    () =>
      peoplePermissions.find(
        (permission) =>
          permission.role === 'owner' &&
          permission.principalType === 'user' &&
          permission.principalId === item?.ownerUserId,
      ) ?? null,
    [item?.ownerUserId, peoplePermissions],
  );
  const isCurrentOwner = Boolean(item && session && item.ownerUserId && item.ownerUserId === session.userId);
  const availableOwnerTargets = useMemo(
    () => users.filter((user) => user.id !== item?.ownerUserId),
    [item?.ownerUserId, users],
  );

  const refresh = async () => {
    if (!item || !session) return;
    const [nextPermissions, nextShares, nextGroups] = await Promise.all([
      fetchDrivePermissions(session, item.id),
      fetchDriveShares(session, item.id),
      fetchDriveGroups(session),
    ]);
    setPermissions(nextPermissions);
    setShares(nextShares);
    setGroups(nextGroups);
    const share = nextShares.find((row) => !row.isRevoked) ?? null;
    setVisibility(share?.visibility ?? 'restricted');
    setLinkRole(share?.role ?? 'viewer');
    setExpiresAt(toLocalDateTime(share?.expiresAt ?? null));
    await onSyncShares(item.id, nextShares);
  };

  useEffect(() => {
    setGroupDrafts((previous) => {
      const next: Record<string, { description: string; memberUserId: string; name: string }> = {};
      groups.forEach((group) => {
        next[group.id] = {
          description: previous[group.id]?.description ?? group.description,
          memberUserId: previous[group.id]?.memberUserId ?? '',
          name: previous[group.id]?.name ?? group.name,
        };
      });
      return next;
    });
  }, [groups]);

  useEffect(() => {
    if (!open || !item || !session) return;
    let cancelled = false;
    setIsLoading(true);
    setError('');
    setNotice('');
    void (async () => {
      try {
        const [nextPermissions, nextShares, nextGroups] = await Promise.all([
          fetchDrivePermissions(session, item.id),
          fetchDriveShares(session, item.id),
          fetchDriveGroups(session),
        ]);
        if (cancelled) return;
        setPermissions(nextPermissions);
        setShares(nextShares);
        setGroups(nextGroups);
        const share = nextShares.find((row) => !row.isRevoked) ?? null;
        setVisibility(share?.visibility ?? 'restricted');
        setLinkRole(share?.role ?? 'viewer');
        setExpiresAt(toLocalDateTime(share?.expiresAt ?? null));
        setOwnerTransferUserId('');
        setPrincipalMode('user');
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '공유 설정을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item, open, session]);

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const firstFocusable = root.querySelector<HTMLElement>('button, input, select, textarea');
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => !node.hasAttribute('disabled'));
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open || !item || !session) {
    return null;
  }

  const handleAddPrincipal = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      if (principalMode === 'user') {
        const normalized = emailInput.trim().toLowerCase();
        if (!normalized) {
          throw new Error('공유할 사용자 이메일을 입력해 주세요.');
        }
        const matched = users.find((user) => user.email.trim().toLowerCase() === normalized);
        if (!matched) {
          throw new Error('현재 작업공간에 등록된 사용자만 공유할 수 있습니다.');
        }
        await createDrivePermission(session, item.id, {
          principalType: 'user',
          principalId: matched.id,
          role: newRole,
          email: matched.email,
        });
        setEmailInput('');
      } else if (principalMode === 'group') {
        if (!selectedGroupId) {
          throw new Error('권한을 부여할 그룹을 선택해 주세요.');
        }
        await createDrivePermission(session, item.id, {
          principalType: 'group',
          principalId: selectedGroupId,
          role: newRole,
        });
        setSelectedGroupId('');
      } else {
        const normalizedDomain = normalizeDomain(domainInput);
        if (!normalizedDomain) {
          throw new Error('도메인을 입력해 주세요.');
        }
        await createDrivePermission(session, item.id, {
          principalType: 'domain',
          principalId: normalizedDomain,
          role: newRole,
        });
        setDomainInput('');
      }
      setNotice('접근 권한을 추가했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '접근 권한을 추가하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionRole = async (
    permission: DrivePermissionRecord,
    role: 'viewer' | 'editor',
  ) => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await updateDrivePermission(session, permission.id, { role });
      setNotice('접근 권한을 저장했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '접근 권한을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionDelete = async (permissionId: string) => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await deleteDrivePermission(session, permissionId);
      setNotice('접근 권한을 제거했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '접근 권한을 제거하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransferOwner = async () => {
    if (!ownerTransferUserId) {
      setError('소유권을 이전할 사용자를 선택해 주세요.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await transferDriveOwner(session, item.id, ownerTransferUserId);
      setOwnerTransferUserId('');
      setNotice('소유권을 이전했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '소유권을 이전하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreWorkspaceAccess = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await createDrivePermission(session, item.id, {
        principalType: 'workspace',
        principalId: session.workspaceId,
        role: 'editor',
      });
      setNotice('현재 작업공간 기본 접근을 복구했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '기본 접근을 복구하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const persistLink = async () => {
    if (activeShare) {
      return updateDriveShareLink(session, activeShare.id, {
        expiresAt: toIsoDateTime(expiresAt),
        role: linkRole,
        visibility,
      });
    }
    return createDriveShareLink(session, {
      itemId: item.id,
      visibility,
      role: linkRole,
      expiresAt: toIsoDateTime(expiresAt),
    });
  };

  const handleSaveLink = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await persistLink();
      setNotice('링크 접근 설정을 저장했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '링크 설정을 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const share = activeShare ?? (await persistLink());
      await refresh();
      if (!share.token) {
        throw new Error('공유 링크를 생성하지 못했습니다.');
      }
      await navigator.clipboard.writeText(buildShareUrl(share.token));
      setNotice('공유 링크를 복사했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '링크를 복사하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeShare) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await revokeDriveShareLink(session, activeShare.id);
      setNotice('링크를 폐기했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '링크를 폐기하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupNameInput.trim()) {
      setError('그룹 이름을 입력해 주세요.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await createDriveGroup(session, {
        description: groupDescriptionInput.trim(),
        name: groupNameInput.trim(),
      });
      setGroupNameInput('');
      setGroupDescriptionInput('');
      setNotice('그룹을 만들었습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹을 만들지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGroupDraftChange = (
    groupId: string,
    patch: Partial<{ description: string; memberUserId: string; name: string }>,
  ) => {
    setGroupDrafts((previous) => ({
      ...previous,
      [groupId]: {
        description: patch.description ?? previous[groupId]?.description ?? '',
        memberUserId: patch.memberUserId ?? previous[groupId]?.memberUserId ?? '',
        name: patch.name ?? previous[groupId]?.name ?? '',
      },
    }));
  };

  const handleSaveGroup = async (group: DriveGroupRecord) => {
    const draft = groupDrafts[group.id];
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await updateDriveGroup(session, group.id, {
        description: draft?.description ?? group.description,
        name: draft?.name ?? group.name,
      });
      setNotice('그룹 정보를 저장했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 정보를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await deleteDriveGroup(session, groupId);
      setNotice('그룹을 삭제했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹을 삭제하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGroupMember = async (groupId: string) => {
    const draft = groupDrafts[groupId];
    if (!draft?.memberUserId) {
      setError('그룹에 추가할 사용자를 선택해 주세요.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await addDriveGroupMember(session, groupId, draft.memberUserId);
      setNotice('그룹 멤버를 추가했습니다.');
      handleGroupDraftChange(groupId, { memberUserId: '' });
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 멤버를 추가하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGroupMember = async (groupId: string, memberId: string) => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await removeDriveGroupMember(session, groupId, memberId);
      setNotice('그룹 멤버를 제거했습니다.');
      await refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '그룹 멤버를 제거하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={dialogStyles.scrim} role="presentation" onClick={onClose}>
      <section
        ref={dialogRef}
        className={dialogStyles.card}
        role="dialog"
        aria-modal="true"
        aria-label="공유 설정"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={dialogStyles.header}>
          <div>
            <h2 className={dialogStyles.title}>공유</h2>
            <p className={dialogStyles.subtitle}>{item.name}의 접근 권한과 링크 공유 범위를 관리합니다.</p>
          </div>
          <button type="button" className="erp-button erp-button-secondary" onClick={onClose}>
            닫기
          </button>
        </header>

        {item.kind === 'folder' ? (
          <div className={dialogStyles.helper}>
            <strong>폴더 공유 안내</strong>
            <span>이 폴더를 공유하면 하위 파일과 하위 폴더에도 같은 접근 권한이 적용됩니다.</span>
          </div>
        ) : null}

        <div className={dialogStyles.feedback}>
          {error ? <div className={dialogStyles.error}>{error}</div> : null}
          {notice ? <div className={dialogStyles.notice}>{notice}</div> : null}
        </div>

        <div className={dialogStyles.body}>
          <section className={dialogStyles.section}>
            <div className={dialogStyles.sectionHeader}>
              <div>
                <h3 className={dialogStyles.sectionTitle}>People with access</h3>
                <p className={dialogStyles.sectionHint}>사용자, 그룹, 도메인 단위로 Viewer 또는 Editor 권한을 부여할 수 있습니다.</p>
              </div>
            </div>

            {isLoading ? (
              <div className={dialogStyles.emptyState}>공유 권한을 불러오는 중입니다.</div>
            ) : peoplePermissions.length === 0 ? (
              <div className={dialogStyles.emptyState}>직접 설정된 사용자·그룹·도메인 권한이 없습니다.</div>
            ) : (
              peoplePermissions.map((permission) => {
                const immutable = permission.role === 'owner';
                return (
                  <div key={permission.id} className={dialogStyles.row}>
                    <div className={dialogStyles.rowHeader}>
                      <div className={dialogStyles.rowTitle}>
                        <strong>{permissionLabel(permission, users, groups)}</strong>
                        <span className={dialogStyles.subtitle}>
                          {permission.principalType === 'group'
                            ? '그룹 공유'
                            : permission.principalType === 'domain'
                              ? '도메인 공유'
                              : permission.principalType === 'user'
                                ? '직접 공유'
                                : '공유'}
                        </span>
                      </div>
                      <span className={dialogStyles.pill}>{permissionRoleLabel(permission.role)}</span>
                    </div>
                    {!immutable ? (
                      <div className={dialogStyles.actions}>
                        <select
                          className="erp-select"
                          value={permission.role === 'editor' ? 'editor' : 'viewer'}
                          onChange={(event) => void handlePermissionRole(permission, event.target.value as 'viewer' | 'editor')}
                        >
                          {MUTABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role === 'editor' ? 'Editor' : 'Viewer'}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="erp-button erp-button-text" onClick={() => void handlePermissionDelete(permission.id)}>
                          제거
                        </button>
                      </div>
                    ) : (
                      <span className={dialogStyles.mutedInline}>소유자 권한은 삭제할 수 없습니다.</span>
                    )}
                  </div>
                );
              })
            )}

            {currentOwnerPermission ? (
              <div className={dialogStyles.helper}>
                <strong>현재 소유자</strong>
                <span>{permissionLabel(currentOwnerPermission, users, groups)}</span>
              </div>
            ) : null}

            {isCurrentOwner ? (
              <div className={dialogStyles.row}>
                <div className={dialogStyles.rowTitle}>
                  <strong>소유권 이전</strong>
                  <span className={dialogStyles.subtitle}>owner는 한 명만 유지됩니다. 이전 후 기존 owner는 Editor로 전환됩니다.</span>
                </div>
                <div className={dialogStyles.formGridCompact}>
                  <label className={dialogStyles.field}>
                    <span className={dialogStyles.fieldLabel}>이전 대상</span>
                    <select
                      className="erp-select"
                      value={ownerTransferUserId}
                      onChange={(event) => setOwnerTransferUserId(event.target.value)}
                    >
                      <option value="">사용자 선택</option>
                      {availableOwnerTargets.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} · {user.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={dialogStyles.field}>
                    <span className={dialogStyles.fieldLabel}>실행</span>
                    <button type="button" className="erp-button erp-button-secondary" disabled={isSaving} onClick={() => void handleTransferOwner()}>
                      소유권 이전
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className={dialogStyles.tabList} role="tablist" aria-label="공유 대상 추가">
              {([
                ['user', '사용자'],
                ['group', '그룹'],
                ['domain', '도메인'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={principalMode === mode}
                  className={`${dialogStyles.tabButton} ${principalMode === mode ? dialogStyles.tabButtonActive : ''}`}
                  onClick={() => setPrincipalMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={dialogStyles.formGrid}>
              {principalMode === 'user' ? (
                <label className={dialogStyles.field}>
                  <span className={dialogStyles.fieldLabel}>사용자 이메일</span>
                  <input
                    className="erp-input"
                    list="drive-share-user-list"
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />
                  <datalist id="drive-share-user-list">
                    {users.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.name}
                      </option>
                    ))}
                  </datalist>
                </label>
              ) : null}

              {principalMode === 'group' ? (
                <label className={dialogStyles.field}>
                  <span className={dialogStyles.fieldLabel}>그룹</span>
                  <select
                    className="erp-select"
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                  >
                    <option value="">그룹 선택</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {principalMode === 'domain' ? (
                <label className={dialogStyles.field}>
                  <span className={dialogStyles.fieldLabel}>도메인</span>
                  <input
                    className="erp-input"
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value)}
                  />
                  <span className={dialogStyles.mutedInline}>현재 작업공간에 속한 같은 이메일 도메인 사용자에게만 적용됩니다.</span>
                </label>
              ) : null}

              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>역할</span>
                <select
                  className="erp-select"
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value as 'viewer' | 'editor')}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </label>

              <div className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>추가</span>
                <button type="button" className="erp-button erp-button-primary" disabled={isSaving} onClick={() => void handleAddPrincipal()}>
                  권한 추가
                </button>
              </div>
            </div>

            {inheritedPermissions.length > 0 ? (
              <div className={dialogStyles.helper}>
                <strong>상속된 권한</strong>
                <div className={dialogStyles.stack}>
                  {inheritedPermissions.map((permission) => (
                    <span key={permission.id} className={dialogStyles.subtitle}>
                      {permissionLabel(permission, users, groups)}
                      {' · '}
                      {permission.sourceItemName || '상위 폴더'}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className={dialogStyles.section}>
            <div className={dialogStyles.sectionHeader}>
              <div>
                <h3 className={dialogStyles.sectionTitle}>Workspace default access</h3>
                <p className={dialogStyles.sectionHint}>현재 작업공간 전체에 적용되는 기본 접근 범위를 별도로 관리합니다.</p>
              </div>
            </div>

            {workspacePermissions.length === 0 ? (
              <div className={dialogStyles.row}>
                <div className={dialogStyles.rowTitle}>
                  <strong>기본 접근이 비활성화되어 있습니다.</strong>
                  <span className={dialogStyles.subtitle}>복구하면 현재 작업공간 사용자가 이 항목을 다시 열람·편집할 수 있습니다.</span>
                </div>
                <div className={dialogStyles.actions}>
                  <button type="button" className="erp-button erp-button-secondary" disabled={isSaving} onClick={() => void handleRestoreWorkspaceAccess()}>
                    기본 접근 복구
                  </button>
                </div>
              </div>
            ) : (
              workspacePermissions.map((permission) => (
                <div key={permission.id} className={dialogStyles.row}>
                  <div className={dialogStyles.rowHeader}>
                    <div className={dialogStyles.rowTitle}>
                      <strong>현재 작업공간</strong>
                      <span className={dialogStyles.subtitle}>기본 접근 범위</span>
                    </div>
                    <span className={dialogStyles.pill}>{permissionRoleLabel(permission.role)}</span>
                  </div>
                  <div className={dialogStyles.actions}>
                    <select
                      className="erp-select"
                      value={permission.role === 'viewer' ? 'viewer' : 'editor'}
                      onChange={(event) => void handlePermissionRole(permission, event.target.value as 'viewer' | 'editor')}
                    >
                      {MUTABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role === 'editor' ? 'Editor' : 'Viewer'}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="erp-button erp-button-text" onClick={() => void handlePermissionDelete(permission.id)}>
                      제거
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className={dialogStyles.section}>
            <div className={dialogStyles.sectionHeader}>
              <div>
                <h3 className={dialogStyles.sectionTitle}>그룹 관리</h3>
                <p className={dialogStyles.sectionHint}>작업공간에서 재사용할 공유 그룹을 만들고 멤버를 관리합니다.</p>
              </div>
            </div>

            <div className={dialogStyles.formGrid}>
              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>새 그룹 이름</span>
                <input className="erp-input" value={groupNameInput} onChange={(event) => setGroupNameInput(event.target.value)} />
              </label>
              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>설명</span>
                <input className="erp-input" value={groupDescriptionInput} onChange={(event) => setGroupDescriptionInput(event.target.value)} />
              </label>
              <div className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>생성</span>
                <button type="button" className="erp-button erp-button-primary" disabled={isSaving} onClick={() => void handleCreateGroup()}>
                  그룹 만들기
                </button>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className={dialogStyles.emptyState}>아직 만든 그룹이 없습니다.</div>
            ) : (
              groups.map((group) => {
                const draft = groupDrafts[group.id] ?? { description: group.description, memberUserId: '', name: group.name };
                const availableMembers = users.filter(
                  (user) => !group.members.some((member) => member.userId === user.id),
                );
                return (
                  <div key={group.id} className={dialogStyles.groupCard}>
                    <div className={dialogStyles.formGridCompact}>
                      <label className={dialogStyles.field}>
                        <span className={dialogStyles.fieldLabel}>그룹 이름</span>
                        <input
                          className="erp-input"
                          value={draft.name}
                          onChange={(event) => handleGroupDraftChange(group.id, { name: event.target.value })}
                        />
                      </label>
                      <label className={dialogStyles.field}>
                        <span className={dialogStyles.fieldLabel}>설명</span>
                        <input
                          className="erp-input"
                          value={draft.description}
                          onChange={(event) => handleGroupDraftChange(group.id, { description: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className={dialogStyles.actions}>
                      <button type="button" className="erp-button erp-button-secondary" disabled={isSaving} onClick={() => void handleSaveGroup(group)}>
                        저장
                      </button>
                      <button type="button" className="erp-button erp-button-text" onClick={() => void handleDeleteGroup(group.id)}>
                        삭제
                      </button>
                    </div>

                    <div className={dialogStyles.stack}>
                      <strong className={dialogStyles.fieldLabel}>멤버</strong>
                      {group.members.length === 0 ? (
                        <span className={dialogStyles.mutedInline}>아직 등록된 멤버가 없습니다.</span>
                      ) : (
                        group.members.map((member) => (
                          <div key={member.id} className={dialogStyles.memberRow}>
                            <span>{member.user ? `${member.user.name} · ${member.user.email}` : member.userId}</span>
                            <button type="button" className="erp-button erp-button-text" onClick={() => void handleRemoveGroupMember(group.id, member.id)}>
                              제거
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={dialogStyles.formGridCompact}>
                      <label className={dialogStyles.field}>
                        <span className={dialogStyles.fieldLabel}>멤버 추가</span>
                        <select
                          className="erp-select"
                          value={draft.memberUserId}
                          onChange={(event) => handleGroupDraftChange(group.id, { memberUserId: event.target.value })}
                        >
                          <option value="">사용자 선택</option>
                          {availableMembers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} · {user.email}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className={dialogStyles.field}>
                        <span className={dialogStyles.fieldLabel}>실행</span>
                        <button type="button" className="erp-button erp-button-secondary" disabled={isSaving} onClick={() => void handleAddGroupMember(group.id)}>
                          멤버 추가
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className={dialogStyles.section}>
            <div className={dialogStyles.sectionHeader}>
              <div>
                <h3 className={dialogStyles.sectionTitle}>General access</h3>
                <p className={dialogStyles.sectionHint}>Restricted 또는 Anyone with link 범위를 선택하고 링크 역할을 저장합니다.</p>
              </div>
            </div>

            <div className={dialogStyles.formGrid}>
              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>접근 범위</span>
                <select className="erp-select" value={visibility} onChange={(event) => setVisibility(event.target.value as DriveShareVisibility)}>
                  <option value="restricted">Restricted</option>
                  <option value="anyone_with_link">Anyone with link</option>
                </select>
              </label>
              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>링크 역할</span>
                <select className="erp-select" value={linkRole} onChange={(event) => setLinkRole(event.target.value as DriveShareRole)}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              <label className={dialogStyles.field}>
                <span className={dialogStyles.fieldLabel}>만료일</span>
                <input className="erp-input" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </label>
            </div>

            {activeShare?.token ? (
              <div className={dialogStyles.row}>
                <div className={dialogStyles.rowTitle}>
                  <strong>현재 공유 링크</strong>
                  <span className={`${dialogStyles.subtitle} ${dialogStyles.linkValue}`}>{buildShareUrl(activeShare.token)}</span>
                </div>
                <div className={dialogStyles.actions}>
                  <button type="button" className="erp-button erp-button-secondary" onClick={() => void handleCopyLink()}>
                    Copy link
                  </button>
                  <button type="button" className="erp-button erp-button-text" onClick={() => void handleRevoke()}>
                    Revoke link
                  </button>
                </div>
              </div>
            ) : (
              <div className={dialogStyles.emptyState}>생성된 링크가 없습니다. Save를 눌러 링크를 만들 수 있습니다.</div>
            )}
          </section>
        </div>

        <footer className={dialogStyles.footer}>
          <button type="button" className="erp-button erp-button-secondary" onClick={onClose}>
            닫기
          </button>
          <button type="button" className="erp-button erp-button-primary" disabled={isSaving} onClick={() => void handleSaveLink()}>
            Save
          </button>
        </footer>
      </section>
    </div>
  );
}
