'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { readFileAsDataUrl } from '@/lib/fileData';
import {
  bootstrapDemoSession,
  canUseWorkspaceServerApis,
  type DemoSession,
} from '@/lib/reportApi';
import { useDriveSelection } from '@/components/webhard/hooks/useDriveSelection';
import { createDriveItem, deleteDriveItem, fetchDriveItems, fetchDriveShares, revokeDriveShare, updateDriveItem } from '@/lib/webhard/driveApi';
import { createDriveLocalId, mergeServerDriveSnapshot, readDriveSnapshot, writeDriveSnapshot } from '@/lib/webhard/driveGuestStore';
import { mapWorkspaceDriveItem, mapWorkspaceDriveShare } from '@/lib/webhard/driveMappers';
import { isImageContentType } from '@/lib/webhard/drivePreview';
import type { CreateMode, DriveItemViewModel, DriveShareViewModel, ListingMode, NavigationMode, SortMode, WebhardCapabilities } from '@/lib/webhard/driveTypes';

function isGuestLocalDriveId(itemId: string) {
  return itemId.startsWith('drive-');
}

function collectDescendantIds(items: DriveItemViewModel[], rootId: string) {
  const nextIds = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || nextIds.has(currentId)) continue;
    nextIds.add(currentId);
    items
      .filter((item) => item.parentId === currentId)
      .forEach((item) => queue.push(item.id));
  }
  return nextIds;
}

export function useWebhardController(input: {
  headquarterId: string | null;
  initialParentId: string | null;
  siteId: string | null;
}) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [items, setItems] = useState<DriveItemViewModel[]>([]);
  const [shares, setShares] = useState<DriveShareViewModel[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(input.initialParentId);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('root');
  const [listingMode, setListingMode] = useState<ListingMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [noteBody, setNoteBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [query, setQuery] = useState('');
  const [shareDialogItemId, setShareDialogItemId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selection = useDriveSelection(items);

  useEffect(() => {
    setCurrentParentId(input.initialParentId);
    if (input.initialParentId) {
      setNavigationMode('root');
    }
  }, [input.initialParentId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const snapshot = await readDriveSnapshot();
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

        const [serverItems, serverShareRows] = await Promise.all([
          fetchDriveItems(nextSession, { includeDeleted: true }),
          fetchDriveShares(nextSession),
        ]);
        if (cancelled) return;
        const nextItems = serverItems.rows.map(mapWorkspaceDriveItem);
        const nextShares = serverShareRows.rows.map(mapWorkspaceDriveShare);
        setItems(nextItems);
        setShares(nextShares);
        await mergeServerDriveSnapshot({ items: nextItems, shares: nextShares });
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

  const capabilities = useMemo<WebhardCapabilities>(() => {
    const canSyncWithServer = Boolean(session && canUseWorkspaceServerApis(session));
    return {
      canManageShares: canSyncWithServer,
      canSyncWithServer,
    };
  }, [session]);

  const selectedItemShares = useMemo(
    () =>
      selection.selectedItem
        ? shares.filter((share) => share.itemId === selection.selectedItem?.id && !share.isRevoked)
        : [],
    [selection.selectedItem, shares],
  );

  const shareDialogItem = useMemo(
    () => items.find((item) => item.id === shareDialogItemId) ?? null,
    [items, shareDialogItemId],
  );

  const persistLocalState = async (nextItems: DriveItemViewModel[], nextShares: DriveShareViewModel[]) => {
    setItems(nextItems);
    setShares(nextShares);
    await writeDriveSnapshot({ items: nextItems, shares: nextShares });
  };

  const syncItemShares = async (itemId: string, nextItemShares: DriveShareViewModel[]) => {
    const mergedShares = [
      ...shares.filter((share) => share.itemId !== itemId),
      ...nextItemShares,
    ].sort((left, right) => `${right.updatedAt || right.createdAt || ''}`.localeCompare(`${left.updatedAt || left.createdAt || ''}`));
    await persistLocalState(items, mergedShares);
  };

  const openFolder = (folderId: string | null) => {
    setNavigationMode('root');
    setCurrentParentId(folderId);
    if (folderId) {
      selection.selectItem(folderId);
      return;
    }
    selection.clearSelection();
  };

  const createItem = async (item: Omit<DriveItemViewModel, 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const localItem: DriveItemViewModel = {
      ...item,
      createdAt: timestamp,
      isStarred: false,
      lastOpenedAt: null,
      ownerUserId: null,
      trashedAt: null,
      updatedAt: timestamp,
      updatedByUserId: null,
    };
    const optimistic = [localItem, ...items];
    await persistLocalState(optimistic, shares);

    if (session && capabilities.canSyncWithServer) {
      const created = await createDriveItem(session, item);
      const mapped = mapWorkspaceDriveItem(created);
      const nextItems = optimistic.map((row) => (row.id === localItem.id ? mapped : row));
      await persistLocalState(nextItems, shares);
      selection.selectItemSnapshot(mapped);
      return mapped;
    }

    selection.selectItemSnapshot(localItem);
    return localItem;
  };

  const patchItem = async (itemId: string, payload: Parameters<typeof updateDriveItem>[2]) => {
    const current = items.find((item) => item.id === itemId);
    if (!current) return null;
    const nextItem: DriveItemViewModel = {
      ...current,
      name: payload.name ?? current.name,
      parentId: payload.parentId ?? current.parentId,
      fileType: payload.fileType ?? current.fileType,
      textContent: payload.textContent ?? current.textContent,
      externalUrl: payload.externalUrl ?? current.externalUrl,
      contentType: payload.contentType ?? current.contentType,
      sizeBytes: payload.sizeBytes ?? current.sizeBytes,
      dataUrl: payload.dataUrl ?? current.dataUrl,
      thumbnailDataUrl: payload.thumbnailDataUrl ?? current.thumbnailDataUrl,
      headquarterId: payload.headquarterId ?? current.headquarterId,
      siteId: payload.siteId ?? current.siteId,
      isDeleted: payload.restore ? false : payload.isDeleted ?? current.isDeleted,
      trashedAt: payload.restore ? null : payload.isDeleted ? new Date().toISOString() : current.trashedAt,
      updatedAt: new Date().toISOString(),
    };
    const optimistic = items.map((item) => (item.id === nextItem.id ? nextItem : item));
    await persistLocalState(optimistic, shares);
    if (session && capabilities.canSyncWithServer && !isGuestLocalDriveId(itemId)) {
      const updated = await updateDriveItem(session, itemId, payload);
      const mapped = mapWorkspaceDriveItem(updated);
      await persistLocalState(
        optimistic.map((item) => (item.id === mapped.id ? mapped : item)),
        shares,
      );
      return mapped;
    }
    return nextItem;
  };

  const handleCreate = async () => {
    try {
      setError('');
      if (!selection.nameInput.trim()) return;
      if (createMode === 'folder') {
        await createItem({
          id: createDriveLocalId('drive-folder'),
          kind: 'folder',
          name: selection.nameInput.trim(),
          parentId: navigationMode === 'root' ? currentParentId : null,
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
        });
      }
      if (createMode === 'note') {
        await createItem({
          id: createDriveLocalId('drive-note'),
          kind: 'file',
          name: selection.nameInput.trim(),
          parentId: currentParentId,
          headquarterId: input.headquarterId,
          siteId: input.siteId,
          fileType: 'note',
          textContent: noteBody,
          externalUrl: '',
          contentType: 'text/plain;charset=utf-8',
          sizeBytes: noteBody.length,
          dataUrl: '',
          thumbnailDataUrl: '',
          isDeleted: false,
        });
      }
      if (createMode === 'link') {
        await createItem({
          id: createDriveLocalId('drive-link'),
          kind: 'file',
          name: selection.nameInput.trim(),
          parentId: currentParentId,
          headquarterId: input.headquarterId,
          siteId: input.siteId,
          fileType: 'link',
          textContent: '',
          externalUrl: linkUrl.trim(),
          contentType: 'text/uri-list',
          sizeBytes: linkUrl.trim().length,
          dataUrl: '',
          thumbnailDataUrl: '',
          isDeleted: false,
        });
      }
      setCreateMode(null);
      setNoteBody('');
      setLinkUrl('');
      setNotice('새 항목을 저장했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '항목을 만들지 못했습니다.');
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    try {
      setError('');
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        await createItem({
          id: createDriveLocalId('drive-file'),
          kind: 'file',
          name: file.name,
          parentId: currentParentId,
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
        });
      }
      setNotice(`${files.length}개 파일을 추가했습니다.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '파일 업로드에 실패했습니다.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDelete = async (item: DriveItemViewModel, purge = false) => {
    try {
      setError('');
      const targetIds = item.kind === 'folder' ? collectDescendantIds(items, item.id) : new Set([item.id]);
      const nextItems = purge
        ? items.filter((row) => !targetIds.has(row.id))
        : items.map((row) =>
            targetIds.has(row.id)
              ? {
                  ...row,
                  isDeleted: true,
                  trashedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : row,
          );
      const nextShares = shares.filter((share) => !targetIds.has(share.itemId));
      await persistLocalState(nextItems, nextShares);
      if (session && capabilities.canSyncWithServer && !isGuestLocalDriveId(item.id)) {
        await deleteDriveItem(session, item.id, purge);
      }
      if (selection.selectedItemId === item.id) {
        selection.clearSelection();
      }
      setNotice(purge ? '항목을 영구 삭제했습니다.' : '항목을 휴지통으로 이동했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '삭제하지 못했습니다.');
    }
  };

  const handleRestore = async (itemId: string) => {
    try {
      setError('');
      await patchItem(itemId, { restore: true });
      setNotice('휴지통에서 복원했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '복원하지 못했습니다.');
    }
  };

  const handleShare = () => {
    if (!selection.selectedItem || !session || !capabilities.canManageShares) {
      setError('공유 링크는 로그인 후 발급할 수 있습니다.');
      return;
    }
    if (isGuestLocalDriveId(selection.selectedItem.id)) {
      setError('서버에 동기화된 항목에서만 공유 링크를 만들 수 있습니다.');
      return;
    }
    setError('');
    setShareDialogItemId(selection.selectedItem.id);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!session || !capabilities.canManageShares) return;
    try {
      setError('');
      await revokeDriveShare(session, shareId);
      const nextShares = shares.filter((share) => share.id !== shareId);
      await persistLocalState(items, nextShares);
      setNotice('공유 링크를 폐기했습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '공유 링크를 폐기하지 못했습니다.');
    }
  };

  const startCreate = (mode: Exclude<CreateMode, null>) => {
    setCreateMode(mode);
    selection.setNameInput('');
    if (mode === 'note') {
      setNoteBody('');
    }
    if (mode === 'link') {
      setLinkUrl('');
    }
  };

  return {
    capabilities,
    closeShareDialog: () => setShareDialogItemId(''),
    createMode,
    currentParentId,
    error,
    handleCreate,
    handleDelete,
    handleRestore,
    handleRevokeShare,
    handleShare,
    handleUpload,
    isLoading,
    items,
    linkUrl,
    listingMode,
    navigationMode,
    noteBody,
    notice,
    openFolder,
    patchItem,
    query,
    shareDialogItem,
    shareDialogOpen: Boolean(shareDialogItemId),
    selection,
    session,
    setCreateMode,
    setCurrentParentId,
    setLinkUrl,
    setListingMode,
    setNavigationMode,
    setNoteBody,
    setQuery,
    setSortMode,
    selectedItemShares,
    shares,
    syncItemShares,
    sortMode,
    startCreate,
    uploadInputRef,
  };
}
