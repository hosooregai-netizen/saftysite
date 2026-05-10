'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { readFileAsDataUrl } from '@/lib/fileData';
import {
  bootstrapDemoSession,
  canUseWorkspaceServerApis,
  type DemoSession,
} from '@/lib/reportApi';
import {
  createDriveShareLink,
  createDriveItem,
  createLocalItemId,
  deleteDriveItem,
  fetchDrivePermissions,
  fetchDriveShares,
  fetchWorkspaceDriveState,
  mergeServerDriveState,
  readLocalDriveSnapshot,
  updateDriveItem,
  writeLocalDriveSnapshot,
  type DriveUserRecord,
} from '@/features/drive/driveApi';
import type {
  DriveCapabilities,
  DriveItemRecord,
  DrivePathNode,
  DrivePermissionRecord,
  DriveShareSummary,
  DriveScope,
  DriveShareRecord,
  DriveSortMode,
  DriveUploadBatchSummary,
  DriveUploadQueueItem,
  DriveViewMode,
} from '@/features/drive/types';
import { isImageContentType } from '@/lib/webhard/drivePreview';

function isGuestLocalDriveId(itemId: string) {
  return itemId.startsWith('drive-');
}

function collectDescendantIds(items: DriveItemRecord[], rootId: string) {
  const result = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || result.has(currentId)) continue;
    result.add(currentId);
    items
      .filter((item) => item.parentId === currentId)
      .forEach((item) => queue.push(item.id));
  }
  return result;
}

function sortRows(rows: DriveItemRecord[], sortMode: DriveSortMode, scope: DriveScope) {
  const next = [...rows];
  if (scope === 'recent') {
    next.sort((left, right) => `${right.lastOpenedAt || right.updatedAt}`.localeCompare(`${left.lastOpenedAt || left.updatedAt}`));
    return next;
  }
  next.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'folder' ? -1 : 1;
    }
    if (sortMode === 'updated') {
      return right.updatedAt.localeCompare(left.updatedAt);
    }
    if (sortMode === 'size') {
      return right.sizeBytes - left.sizeBytes;
    }
    if (sortMode === 'type') {
      return `${left.fileType || left.kind}`.localeCompare(`${right.fileType || right.kind}`, 'ko');
    }
    return left.name.localeCompare(right.name, 'ko');
  });
  return next;
}

function buildPath(items: DriveItemRecord[], currentParentId: string | null): DrivePathNode[] {
  if (!currentParentId) {
    return [{ id: 'root', kind: 'folder', name: '내 자료함' }];
  }
  const byId = new Map(items.map((item) => [item.id, item]));
  const path: DrivePathNode[] = [];
  let current = byId.get(currentParentId) || null;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.push({ id: current.id, kind: current.kind, name: current.name });
    current = current.parentId ? byId.get(current.parentId) || null : null;
  }
  path.reverse();
  return [{ id: 'root', kind: 'folder', name: '내 자료함' }, ...path];
}

function hasMeaningfulSharedPermission(
  permission: DrivePermissionRecord,
  item: Pick<DriveItemRecord, 'ownerUserId'>,
  session: DemoSession,
) {
  if (
    permission.principalType === 'workspace' &&
    permission.principalId === session.workspaceId &&
    permission.role === 'editor'
  ) {
    return false;
  }
  if (
    permission.principalType === 'user' &&
    permission.principalId === item.ownerUserId &&
    permission.role === 'owner'
  ) {
    return false;
  }
  return true;
}

function diffDaysFromNow(value: string) {
  const next = new Date(value).getTime();
  if (!Number.isFinite(next)) return null;
  const days = Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000));
  return days;
}

export function useDriveItems(input: {
  headquarterId: string | null;
  initialParentId: string | null;
  siteId: string | null;
}) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const folderUploadInputRef = useRef<HTMLInputElement | null>(null);
  const permissionAuditRowsRef = useRef<Array<{ id: string; ownerUserId: string | null }>>([]);
  const itemsRef = useRef<DriveItemRecord[]>([]);
  const sharesRef = useRef<DriveShareRecord[]>([]);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [items, setItems] = useState<DriveItemRecord[]>([]);
  const [shares, setShares] = useState<DriveShareRecord[]>([]);
  const [users, setUsers] = useState<DriveUserRecord[]>([]);
  const [permissionSharedIds, setPermissionSharedIds] = useState<Set<string>>(new Set());
  const [permissionSharedCounts, setPermissionSharedCounts] = useState<Record<string, number>>({});
  const [scope, setScope] = useState<DriveScope>('root');
  const [currentParentId, setCurrentParentId] = useState<string | null>(input.initialParentId);
  const [sortMode, setSortMode] = useState<DriveSortMode>('updated');
  const [viewMode, setViewMode] = useState<DriveViewMode>('table');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<DriveUploadQueueItem[]>([]);
  const [lastUploadBatch, setLastUploadBatch] = useState<DriveUploadBatchSummary | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setCurrentParentId(input.initialParentId);
    if (input.initialParentId) {
      setScope('root');
    }
  }, [input.initialParentId]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    sharesRef.current = shares;
  }, [shares]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const snapshot = await readLocalDriveSnapshot();
        if (cancelled) return;
        setItems(snapshot.items);
        setShares(snapshot.shares);

        const nextSession = await bootstrapDemoSession();
        if (cancelled) return;
        setSession(nextSession);

        if (!canUseWorkspaceServerApis(nextSession)) {
          setIsLoading(false);
          return;
        }

        const remote = await fetchWorkspaceDriveState(nextSession);
        if (cancelled) return;
        setItems(remote.items);
        setShares(remote.shares);
        setUsers(remote.users);
        await mergeServerDriveState({
          items: remote.items,
          shares: remote.shares,
          updatedAt: new Date().toISOString(),
        });
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : '웹하드를 불러오지 못했습니다.');
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
  }, []);

  const capabilities = useMemo<DriveCapabilities>(() => {
    const canSyncWithServer = Boolean(session && canUseWorkspaceServerApis(session));
    return {
      canManageShares: canSyncWithServer,
      canSyncWithServer,
    };
  }, [session]);

  const serverItems = useMemo(
    () => items.filter((item) => !isGuestLocalDriveId(item.id)),
    [items],
  );
  const permissionAuditKey = useMemo(
    () =>
      serverItems
        .map((item) => [item.id, item.parentId || 'root', item.ownerUserId || 'none', item.isDeleted ? 'deleted' : 'active'].join(':'))
        .join('|'),
    [serverItems],
  );

  useEffect(() => {
    permissionAuditRowsRef.current = serverItems.map((item) => ({
      id: item.id,
      ownerUserId: item.ownerUserId,
    }));
  }, [serverItems]);

  useEffect(() => {
    if (!session || !capabilities.canManageShares) {
      setPermissionSharedIds(new Set());
      setPermissionSharedCounts({});
      return;
    }
    const auditRows = permissionAuditRowsRef.current;
    if (auditRows.length === 0) {
      setPermissionSharedIds(new Set());
      setPermissionSharedCounts({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const results = await Promise.allSettled(
        auditRows.map(async (item) => ({
          item,
          permissions: await fetchDrivePermissions(session, item.id),
        })),
      );
      if (cancelled) return;
      const nextIds = new Set<string>();
      const nextCounts: Record<string, number> = {};
      results.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const meaningfulPermissions = result.value.permissions.filter((permission) =>
          hasMeaningfulSharedPermission(permission, result.value.item, session),
        );
        if (meaningfulPermissions.length > 0) {
          nextIds.add(result.value.item.id);
          nextCounts[result.value.item.id] = new Set(
            meaningfulPermissions.map((permission) => `${permission.principalType}:${permission.principalId}`),
          ).size;
        }
      });
      setPermissionSharedIds(nextIds);
      setPermissionSharedCounts(nextCounts);
    })();
    return () => {
      cancelled = true;
    };
  }, [capabilities.canManageShares, permissionAuditKey, session, shares]);

  const sharedIds = useMemo(
    () =>
      new Set([
        ...shares.filter((share) => !share.isRevoked).map((share) => share.itemId),
        ...permissionSharedIds,
      ]),
    [permissionSharedIds, shares],
  );

  const userNameById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user.name])),
    [users],
  );

  const activeFolders = useMemo(
    () =>
      items
        .filter((item) => item.kind === 'folder' && !item.isDeleted)
        .sort((left, right) => left.name.localeCompare(right.name, 'ko')),
    [items],
  );

  const currentPath = useMemo(() => buildPath(items, currentParentId), [items, currentParentId]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let baseRows = items;
    if (scope === 'trash') {
      baseRows = items.filter((item) => item.isDeleted);
    } else if (scope === 'shared') {
      baseRows = items.filter((item) => !item.isDeleted && sharedIds.has(item.id));
    } else if (scope === 'starred') {
      baseRows = items.filter((item) => !item.isDeleted && item.isStarred);
    } else if (scope === 'recent') {
      baseRows = items.filter((item) => !item.isDeleted);
    } else {
      baseRows = items.filter((item) => !item.isDeleted && (item.parentId || null) === currentParentId);
    }
    if (input.headquarterId) {
      baseRows = baseRows.filter((item) => item.headquarterId === input.headquarterId || item.kind === 'folder');
    }
    if (input.siteId) {
      baseRows = baseRows.filter((item) => item.siteId === input.siteId || item.kind === 'folder');
    }
    if (normalizedQuery) {
      baseRows = baseRows.filter((item) =>
        [item.name, item.textContent, item.externalUrl, item.contentType].join(' ').toLowerCase().includes(normalizedQuery),
      );
    }
    return sortRows(baseRows, sortMode, scope);
  }, [currentParentId, input.headquarterId, input.siteId, items, query, scope, sharedIds, sortMode]);

  const persistLocalState = async (nextItems: DriveItemRecord[], nextShares: DriveShareRecord[]) => {
    itemsRef.current = nextItems;
    sharesRef.current = nextShares;
    setItems(nextItems);
    setShares(nextShares);
    await writeLocalDriveSnapshot({
      items: nextItems,
      shares: nextShares,
      updatedAt: new Date().toISOString(),
    });
  };

  const syncSharesForItem = async (itemId: string, nextItemShares: DriveShareRecord[]) => {
    const merged = [
      ...sharesRef.current.filter((share) => share.itemId !== itemId),
      ...nextItemShares,
    ].sort((left, right) => `${right.updatedAt || right.createdAt || ''}`.localeCompare(`${left.updatedAt || left.createdAt || ''}`));
    await persistLocalState(itemsRef.current, merged);
  };

  const openFolder = (folderId: string | null) => {
    setScope('root');
    setCurrentParentId(folderId);
  };

  const patchItem = async (
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
  ) => {
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (!current) return null;
    const nextItem: DriveItemRecord = {
      ...current,
      contentType: payload.contentType ?? current.contentType,
      dataUrl: payload.dataUrl ?? current.dataUrl,
      externalUrl: payload.externalUrl ?? current.externalUrl,
      fileType: payload.fileType ?? current.fileType,
      headquarterId: payload.headquarterId ?? current.headquarterId,
      isDeleted: payload.restore ? false : payload.isDeleted ?? current.isDeleted,
      isStarred: payload.isStarred ?? current.isStarred,
      lastOpenedAt: payload.lastOpenedAt ?? current.lastOpenedAt,
      name: payload.name ?? current.name,
      parentId: payload.parentId ?? current.parentId,
      siteId: payload.siteId ?? current.siteId,
      sizeBytes: payload.sizeBytes ?? current.sizeBytes,
      textContent: payload.textContent ?? current.textContent,
      thumbnailDataUrl: payload.thumbnailDataUrl ?? current.thumbnailDataUrl,
      trashedAt: payload.restore ? null : payload.isDeleted ? new Date().toISOString() : current.trashedAt,
      updatedAt:
        payload.lastOpenedAt && !payload.name && !payload.parentId && payload.isStarred === undefined
          ? current.updatedAt
          : new Date().toISOString(),
    };
    const optimistic = itemsRef.current.map((item) => (item.id === itemId ? nextItem : item));
    await persistLocalState(optimistic, sharesRef.current);
    if (session && capabilities.canSyncWithServer && !isGuestLocalDriveId(itemId)) {
      const updated = await updateDriveItem(session, itemId, payload);
      const nextItems = optimistic.map((item) => (item.id === updated.id ? updated : item));
      await persistLocalState(nextItems, sharesRef.current);
      return updated;
    }
    return nextItem;
  };

  const createItem = async (item: Omit<DriveItemRecord, 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const localItem: DriveItemRecord = {
      ...item,
      createdAt: timestamp,
      createdBy: session?.userId || null,
      isStarred: false,
      lastOpenedAt: timestamp,
      ownerUserId: session?.userId || null,
      trashedAt: null,
      updatedAt: timestamp,
      updatedByUserId: session?.userId || null,
    };
    const optimistic = [localItem, ...itemsRef.current];
    await persistLocalState(optimistic, sharesRef.current);
    if (session && capabilities.canSyncWithServer) {
      const created = await createDriveItem(session, item);
      const nextItems = optimistic.map((row) => (row.id === localItem.id ? created : row));
      await persistLocalState(nextItems, sharesRef.current);
      return created;
    }
    return localItem;
  };

  const createFolderAt = async (parentId: string | null, name: string) => {
    const existing = itemsRef.current.find(
      (item) => item.kind === 'folder' && !item.isDeleted && item.parentId === parentId && item.name === name,
    );
    if (existing) {
      return existing;
    }
    return createItem({
      id: createLocalItemId('drive-folder'),
      kind: 'folder',
      name,
      parentId,
      headquarterId: input.headquarterId,
      siteId: input.siteId,
      fileType: null,
      textContent: '',
      externalUrl: '',
      contentType: 'application/octet-stream',
      sizeBytes: 0,
      dataUrl: '',
      thumbnailDataUrl: '',
      isDeleted: false,
      isStarred: false,
      lastOpenedAt: null,
      createdBy: session?.userId || null,
      ownerUserId: session?.userId || null,
      updatedByUserId: session?.userId || null,
      trashedAt: null,
    });
  };

  const createByKind = async (inputKind: 'folder' | 'link' | 'note', fields: { linkUrl?: string; name: string; noteBody?: string }) => {
    const parentId = scope === 'root' ? currentParentId : null;
    if (inputKind === 'folder') {
      return createItem({
        id: createLocalItemId('drive-folder'),
        kind: 'folder',
        name: fields.name,
        parentId,
        headquarterId: input.headquarterId,
        siteId: input.siteId,
        fileType: null,
        textContent: '',
        externalUrl: '',
        contentType: 'application/octet-stream',
        sizeBytes: 0,
        dataUrl: '',
        thumbnailDataUrl: '',
        isDeleted: false,
        isStarred: false,
        lastOpenedAt: null,
        createdBy: session?.userId || null,
        ownerUserId: session?.userId || null,
        updatedByUserId: session?.userId || null,
        trashedAt: null,
      });
    }
    if (inputKind === 'note') {
      return createItem({
        id: createLocalItemId('drive-note'),
        kind: 'file',
        name: fields.name,
        parentId,
        headquarterId: input.headquarterId,
        siteId: input.siteId,
        fileType: 'note',
        textContent: fields.noteBody || '',
        externalUrl: '',
        contentType: 'text/plain;charset=utf-8',
        sizeBytes: (fields.noteBody || '').length,
        dataUrl: '',
        thumbnailDataUrl: '',
        isDeleted: false,
        isStarred: false,
        lastOpenedAt: null,
        createdBy: session?.userId || null,
        ownerUserId: session?.userId || null,
        updatedByUserId: session?.userId || null,
        trashedAt: null,
      });
    }
    return createItem({
      id: createLocalItemId('drive-link'),
      kind: 'file',
      name: fields.name,
      parentId,
      headquarterId: input.headquarterId,
      siteId: input.siteId,
      fileType: 'link',
      textContent: '',
      externalUrl: fields.linkUrl || '',
      contentType: 'text/uri-list',
      sizeBytes: (fields.linkUrl || '').length,
      dataUrl: '',
      thumbnailDataUrl: '',
      isDeleted: false,
      isStarred: false,
      lastOpenedAt: null,
      createdBy: session?.userId || null,
      ownerUserId: session?.userId || null,
      updatedByUserId: session?.userId || null,
      trashedAt: null,
    });
  };

  const uploadFiles = async (
    files: File[],
    options: { preserveFolders?: boolean } = {},
  ) => {
    if (files.length === 0) return;
    const batchId = createLocalItemId('upload-batch');
    const queueEntries: DriveUploadQueueItem[] = files.map((file, index) => ({
      batchId,
      fileName: file.webkitRelativePath || file.name,
      id: `${batchId}-${index}`,
      progress: 0,
      sizeBytes: file.size,
      status: 'queued',
    }));
    const createdItemIds: string[] = [];
    setLastUploadBatch(null);
    setUploadQueue(queueEntries);
    try {
      setError('');
      for (const [index, file] of files.entries()) {
        const queueId = `${batchId}-${index}`;
        setUploadQueue((current) =>
          current.map((row) =>
            row.id === queueId
              ? {
                  ...row,
                  progress: 20,
                  status: 'processing',
                }
              : row,
          ),
        );
        const dataUrl = await readFileAsDataUrl(file);
        setUploadQueue((current) =>
          current.map((row) =>
            row.id === queueId
              ? {
                  ...row,
                  progress: 68,
                }
              : row,
          ),
        );

        let parentId = scope === 'root' ? currentParentId : null;
        if (options.preserveFolders && file.webkitRelativePath) {
          const segments = file.webkitRelativePath.split('/').filter(Boolean);
          const folderSegments = segments.slice(0, -1);
          for (const segment of folderSegments) {
            const folder = await createFolderAt(parentId, segment);
            parentId = folder.id;
          }
        }

        const created = await createItem({
          id: createLocalItemId('drive-file'),
          kind: 'file',
          name: file.name,
          parentId,
          headquarterId: input.headquarterId,
          siteId: input.siteId,
          fileType: 'binary',
          textContent: '',
          externalUrl: '',
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl,
          thumbnailDataUrl: isImageContentType(file.type) ? dataUrl : '',
          isDeleted: false,
          isStarred: false,
          lastOpenedAt: null,
          createdBy: session?.userId || null,
          ownerUserId: session?.userId || null,
          updatedByUserId: session?.userId || null,
          trashedAt: null,
        });
        createdItemIds.push(created.id);
        setUploadQueue((current) =>
          current.map((row) =>
            row.id === queueId
              ? {
                  ...row,
                  progress: 100,
                  status: 'done',
                }
              : row,
          ),
        );
      }
      setLastUploadBatch({
        batchId,
        count: files.length,
        itemIds: createdItemIds,
      });
    } catch (nextError) {
      setUploadQueue((current) =>
        current.map((row) =>
          row.batchId === batchId && row.status !== 'done'
            ? {
                ...row,
                status: 'failed',
              }
            : row,
        ),
      );
      setError(nextError instanceof Error ? nextError.message : '파일 업로드에 실패했습니다.');
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files, { preserveFolders: false });
    event.target.value = '';
  };

  const handleFolderUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await uploadFiles(files, { preserveFolders: true });
    event.target.value = '';
  };

  const trashItem = async (item: DriveItemRecord, purge = false) => {
    try {
      setError('');
      const targetIds = item.kind === 'folder' ? collectDescendantIds(itemsRef.current, item.id) : new Set([item.id]);
      const nextItems = purge
        ? itemsRef.current.filter((row) => !targetIds.has(row.id))
        : itemsRef.current.map((row) =>
            targetIds.has(row.id)
              ? {
                  ...row,
                  isDeleted: true,
                  trashedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : row,
          );
      const nextShares = sharesRef.current.filter((share) => !targetIds.has(share.itemId));
      await persistLocalState(nextItems, nextShares);
      if (session && capabilities.canSyncWithServer && !isGuestLocalDriveId(item.id)) {
        await deleteDriveItem(session, item.id, purge);
      }
      setNotice(purge ? '항목을 영구 삭제했습니다.' : '항목을 휴지통으로 이동했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '삭제하지 못했습니다.');
    }
  };

  const restoreItem = async (itemId: string) => {
    try {
      setError('');
      await patchItem(itemId, { restore: true });
      setNotice('휴지통에서 복원했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '복원하지 못했습니다.');
    }
  };

  const toggleStar = async (itemId: string) => {
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (!current) return;
    try {
      setError('');
      await patchItem(itemId, { isStarred: !current.isStarred });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '중요 표시를 바꾸지 못했습니다.');
    }
  };

  const markOpened = async (itemId: string) => {
    await patchItem(itemId, { lastOpenedAt: new Date().toISOString() });
  };

  const setItemsStarred = async (itemIds: string[], starred: boolean) => {
    for (const itemId of itemIds) {
      await patchItem(itemId, { isStarred: starred });
    }
  };

  const trashItems = async (itemIds: string[]) => {
    for (const itemId of itemIds) {
      const item = itemsRef.current.find((row) => row.id === itemId);
      if (item) {
        await trashItem(item);
      }
    }
  };

  const ensureShareLink = async (itemId: string) => {
    if (!session || !capabilities.canManageShares) {
      throw new Error('로그인 후 공유 링크를 사용할 수 있습니다.');
    }
    const currentShares = await fetchDriveShares(session, itemId);
    const activeShare = currentShares.find((share) => !share.isRevoked && !share.revokedAt);
    if (activeShare) {
      await syncSharesForItem(itemId, currentShares);
      return activeShare;
    }
    const created = await createDriveShareLink(session, {
      itemId,
      role: 'viewer',
      visibility: 'anyone_with_link',
    });
    const nextShares = [created, ...currentShares];
    await syncSharesForItem(itemId, nextShares);
    return created;
  };

  const undoLastUpload = async () => {
    if (!lastUploadBatch) return;
    await trashItems(lastUploadBatch.itemIds);
    setLastUploadBatch(null);
    setUploadQueue([]);
    setNotice(`${lastUploadBatch.count}개 업로드를 실행 취소했습니다.`);
  };

  const clearUploadState = () => {
    setUploadQueue([]);
    setLastUploadBatch(null);
  };

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }
    setIsDragOver(false);
  };

  const onDrop = async (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    setIsDragOver(false);
    await uploadFiles(Array.from(event.dataTransfer.files), { preserveFolders: false });
  };

  const shareSummaryById = useMemo<Record<string, DriveShareSummary>>(() => {
    const next: Record<string, DriveShareSummary> = {};
    items.forEach((item) => {
      const itemShares = shares.filter((share) => share.itemId === item.id);
      const activeShare = itemShares.find((share) => {
        if (share.isRevoked || share.revokedAt) return false;
        if (!share.expiresAt) return true;
        return new Date(share.expiresAt).getTime() > Date.now();
      });
      const hasStoppedShare = itemShares.some((share) => share.isRevoked || share.revokedAt || (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()));
      const permissionCount = permissionSharedCounts[item.id] || 0;
      if (activeShare && activeShare.visibility === 'anyone_with_link') {
        const days = activeShare.expiresAt ? diffDaysFromNow(activeShare.expiresAt) : null;
        next[item.id] = {
          detail: days !== null ? `만료 D-${Math.max(days, 0)}` : null,
          label: '링크 공유',
          tone: days !== null && days <= 3 ? 'warning' : 'shared',
        };
        return;
      }
      if (permissionCount > 0) {
        next[item.id] = {
          detail: activeShare?.expiresAt ? `만료 D-${Math.max(diffDaysFromNow(activeShare.expiresAt) || 0, 0)}` : null,
          label: `사용자 ${permissionCount}명`,
          tone: 'shared',
        };
        return;
      }
      if (activeShare) {
        next[item.id] = {
          label: '링크 공유',
          tone: 'shared',
        };
        return;
      }
      if (hasStoppedShare) {
        next[item.id] = {
          label: '공유 중지됨',
          tone: 'stopped',
        };
        return;
      }
      next[item.id] = {
        label: '비공개',
        tone: 'muted',
      };
    });
    return next;
  }, [items, permissionSharedCounts, shares]);

  return {
    activeFolders,
    capabilities,
    clearUploadState,
    currentParentId,
    currentPath,
    ensureShareLink,
    error,
    folderUploadInputRef,
    handleUpload,
    handleFolderUpload,
    input,
    isDragOver,
    isLoading,
    items,
    lastUploadBatch,
    markOpened,
    notice,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    openFolder,
    patchItem,
    persistLocalState,
    query,
    restoreItem,
    scope,
    session,
    setItemsStarred,
    setIsDragOver,
    setCurrentParentId,
    setError,
    setNotice,
    setQuery,
    setScope,
    setSortMode,
    setViewMode,
    shares,
    sharedIds,
    shareSummaryById,
    sortMode,
    syncSharesForItem,
    toggleStar,
    trashItems,
    trashItem,
    undoLastUpload,
    uploadInputRef,
    uploadFiles,
    uploadQueue,
    userNameById,
    users,
    viewMode,
    visibleItems,
    createByKind,
  };
}
