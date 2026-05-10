'use client';

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { DriveAppMenuDrawer } from '@/features/drive/DriveAppMenuDrawer';
import { DriveBreadcrumbs } from '@/features/drive/DriveBreadcrumbs';
import { DriveContextMenu } from '@/features/drive/DriveContextMenu';
import { DriveCreateMenu } from '@/features/drive/DriveCreateMenu';
import {
  DriveFilterChips,
  type DrivePeopleFilter,
  type DriveShareFilter,
  type DriveTypeFilter,
  type DriveUpdatedFilter,
} from '@/features/drive/DriveFilterChips';
import { DriveEmptyState } from '@/features/drive/DriveEmptyState';
import { DriveFileTable } from '@/features/drive/DriveFileTable';
import { DriveGrid } from '@/features/drive/DriveGrid';
import { DriveMainHeader } from '@/features/drive/DriveMainHeader';
import { DrivePreviewPanel } from '@/features/drive/DrivePreviewPanel';
import { DriveShareDialog } from '@/features/drive/DriveShareDialog';
import { DriveShell } from '@/features/drive/DriveShell';
import { DriveSidebar } from '@/features/drive/DriveSidebar';
import { DriveSnackbar } from '@/features/drive/DriveSnackbar';
import { DriveTopbar } from '@/features/drive/DriveTopbar';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveItemRecord } from '@/features/drive/types';
import { useDriveItems } from '@/features/drive/useDriveItems';
import { useDriveSelection } from '@/features/drive/useDriveSelection';
import { buildShareUrl, isImageContentType, isPdfContentType, isTextLikeItem, triggerDriveDownload } from '@/lib/webhard/drivePreview';

function canPreviewItem(item: DriveItemRecord) {
  if (item.kind === 'folder') return false;
  if (item.fileType === 'link') return false;
  if (isTextLikeItem({ contentType: item.contentType, fileType: item.fileType })) return true;
  if (item.fileType === 'binary' && (isImageContentType(item.contentType) || isPdfContentType(item.contentType))) {
    return true;
  }
  return false;
}

function scopeTitle(scope: ReturnType<typeof useDriveItems>['scope']) {
  if (scope === 'shared') return '공유 문서함';
  if (scope === 'recent') return '최근';
  if (scope === 'starred') return '중요';
  if (scope === 'trash') return '휴지통';
  return '내 드라이브';
}

export function DriveScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drive = useDriveItems({
    headquarterId: searchParams.get('headquarterId') || null,
    initialParentId: searchParams.get('parentId') || null,
    siteId: searchParams.get('siteId') || null,
  });
  const selection = useDriveSelection(drive.items);
  const [typeFilter, setTypeFilter] = useState<DriveTypeFilter>('all');
  const [peopleFilter, setPeopleFilter] = useState<DrivePeopleFilter>('all');
  const [updatedFilterState, setUpdatedFilterState] = useState<{ referenceNow: number; value: DriveUpdatedFilter }>(
    () => ({
      referenceNow: Date.now(),
      value: 'all',
    }),
  );
  const [shareFilter, setShareFilter] = useState<DriveShareFilter>('all');
  const sessionUserId = drive.session?.userId ?? null;
  const selectedItems = useMemo(
    () => drive.items.filter((item) => selection.selectedSet.has(item.id)),
    [drive.items, selection.selectedSet],
  );
  const singleSelectedItem = selection.selectionCount === 1 ? selection.selectedItem : null;

  const currentPathLabel = useMemo(
    () => drive.currentPath.map((node) => node.name).join(' / '),
    [drive.currentPath],
  );

  const currentTitle = useMemo(() => {
    if (drive.scope !== 'root') {
      return scopeTitle(drive.scope);
    }
    return drive.currentPath[drive.currentPath.length - 1]?.name || '내 드라이브';
  }, [drive.currentPath, drive.scope]);

  const canvasItems = useMemo(() => {
    return drive.visibleItems.filter((item) => {
      if (typeFilter === 'folders' && item.kind !== 'folder') return false;
      if (typeFilter === 'files' && item.kind !== 'file') return false;
      if (peopleFilter === 'owned' && sessionUserId && item.ownerUserId !== sessionUserId) return false;
      if (updatedFilterState.value !== 'all') {
        const updatedAt = new Date(item.updatedAt).getTime();
        const cutoff = updatedFilterState.value === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        if (!Number.isFinite(updatedAt) || updatedFilterState.referenceNow - updatedAt > cutoff) return false;
      }
      if (shareFilter === 'shared' && !drive.sharedIds.has(item.id)) return false;
      return true;
    });
  }, [drive.sharedIds, drive.visibleItems, peopleFilter, sessionUserId, shareFilter, typeFilter, updatedFilterState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selection.selectionCount > 0 && !selection.shareDialogOpen && !selection.createKind) {
        event.preventDefault();
        void drive.trashItems(selection.selectedIds);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drive, selection.createKind, selection.selectedIds, selection.selectionCount, selection.shareDialogOpen]);

  const handleDownload = (item: DriveItemRecord) => {
    if (item.fileType === 'link' && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.kind === 'folder') {
      drive.openFolder(item.id);
      return;
    }
    triggerDriveDownload(item);
  };

  const handleActivateItem = (item: DriveItemRecord) => {
    selection.selectItem(item.id, 'replace');
    void drive.markOpened(item.id);
    if (item.kind === 'folder') {
      drive.openFolder(item.id);
      return;
    }
    if (item.fileType === 'link' && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!canPreviewItem(item)) {
      triggerDriveDownload(item);
      return;
    }
    selection.setDetailOpen(true);
  };

  const handleSaveCreate = async () => {
    const trimmedName = selection.createName.trim();
    if (!trimmedName) {
      drive.setError('이름을 입력해 주세요.');
      return;
    }
    if (selection.createKind === 'link' && !selection.createLinkUrl.trim()) {
      drive.setError('링크 주소를 입력해 주세요.');
      return;
    }
    try {
      drive.setError('');
      await drive.createByKind(selection.createKind!, {
        linkUrl: selection.createLinkUrl.trim(),
        name: trimmedName,
        noteBody: selection.createNoteBody,
      });
      selection.closeCreate();
      drive.setNotice('항목을 생성했습니다.');
    } catch (nextError) {
      drive.setError(nextError instanceof Error ? nextError.message : '항목을 생성하지 못했습니다.');
    }
  };

  const handleSaveMeta = async (item: DriveItemRecord) => {
    try {
      drive.setError('');
      await drive.patchItem(item.id, {
        name: selection.nameDraft.trim() || item.name,
        parentId: selection.moveTargetId || null,
      });
      drive.setNotice('이름과 위치를 저장했습니다.');
    } catch (nextError) {
      drive.setError(nextError instanceof Error ? nextError.message : '항목 정보를 저장하지 못했습니다.');
    }
  };

  const handleOpenShare = (item: DriveItemRecord) => {
    selection.selectItem(item.id, 'replace');
    selection.setShareDialogOpen(true);
  };

  const handleContextMenu = (item: DriveItemRecord, x: number, y: number) => {
    selection.selectItem(item.id, 'replace');
    selection.setContextMenu({ itemId: item.id, x, y });
  };

  const handleCopyLink = async (item: DriveItemRecord) => {
    try {
      drive.setError('');
      const share = await drive.ensureShareLink(item.id);
      if (!share.token) {
        throw new Error('공유 링크를 만들지 못했습니다.');
      }
      await navigator.clipboard.writeText(buildShareUrl(share.token));
      drive.setNotice('공유 링크를 복사했습니다.');
    } catch (nextError) {
      drive.setError(nextError instanceof Error ? nextError.message : '공유 링크를 복사하지 못했습니다.');
    }
  };

  const handleRenameSelection = () => {
    if (!singleSelectedItem) return;
    selection.setDetailOpen(true);
  };

  const handleMoveSelection = () => {
    if (!singleSelectedItem) return;
    selection.setDetailOpen(true);
  };

  const handleDownloadSelection = () => {
    selectedItems.filter((item) => item.kind === 'file').forEach((item) => handleDownload(item));
  };

  const handleToggleStarSelection = async () => {
    if (selectedItems.length === 0) return;
    const shouldStar = selectedItems.some((item) => !item.isStarred);
    try {
      drive.setError('');
      await drive.setItemsStarred(
        selectedItems.map((item) => item.id),
        shouldStar,
      );
    } catch (nextError) {
      drive.setError(nextError instanceof Error ? nextError.message : '중요 표시를 갱신하지 못했습니다.');
    }
  };

  const handleSelectionMore = (event: MouseEvent<HTMLButtonElement>) => {
    if (!singleSelectedItem) return;
    const rect = event.currentTarget.getBoundingClientRect();
    selection.setContextMenu({ itemId: singleSelectedItem.id, x: rect.left, y: rect.bottom + 8 });
  };

  const emptyActions = (
    <>
      <button type="button" className="erp-button erp-button-primary" onClick={() => drive.uploadInputRef.current?.click()}>
        파일 업로드
      </button>
      <button type="button" className="erp-button erp-button-secondary" onClick={() => selection.beginCreate('folder')}>
        새 폴더 만들기
      </button>
    </>
  );

  const sidebarPanels = (
    <DriveSidebar
      createMenu={
        <DriveCreateMenu
          createKind={selection.createKind}
          createLinkUrl={selection.createLinkUrl}
          createMenuOpen={selection.createMenuOpen}
          createName={selection.createName}
          createNoteBody={selection.createNoteBody}
          onBeginCreate={selection.beginCreate}
          onCloseCreate={selection.closeCreate}
          onSaveCreate={() => void handleSaveCreate()}
          onUploadChange={(event) => void drive.handleUpload(event)}
          onUploadFolderChange={(event) => void drive.handleFolderUpload(event)}
          setCreateLinkUrl={selection.setCreateLinkUrl}
          setCreateMenuOpen={selection.setCreateMenuOpen}
          setCreateName={selection.setCreateName}
          setCreateNoteBody={selection.setCreateNoteBody}
          folderUploadInputRef={drive.folderUploadInputRef}
          uploadInputRef={drive.uploadInputRef}
        />
      }
      currentParentId={drive.currentParentId}
      headquarterId={drive.input.headquarterId}
      onOpenFolder={(folderId) => {
        selection.clearSelection();
        drive.openFolder(folderId);
      }}
      onSelectScope={(nextScope) => {
        selection.clearSelection();
        drive.setScope(nextScope);
      }}
      scope={drive.scope}
      sharedCount={drive.sharedIds.size}
      siteId={drive.input.siteId}
      starredCount={drive.items.filter((item) => !item.isDeleted && item.isStarred).length}
      trashCount={drive.items.filter((item) => item.isDeleted).length}
      folders={drive.activeFolders}
    />
  );

  const main = (
    <div className={styles.canvas}>
      <DriveMainHeader
        detailOpen={selection.detailOpen}
        canBulkDownload={selectedItems.some((item) => item.kind === 'file')}
        canEditSingleSelection={Boolean(singleSelectedItem)}
        onDownloadSelection={handleDownloadSelection}
        onMoveSelection={handleMoveSelection}
        onOpenSelectionMore={handleSelectionMore}
        onRenameSelection={handleRenameSelection}
        onShareSelection={() => singleSelectedItem && handleOpenShare(singleSelectedItem)}
        onToggleStarSelection={() => void handleToggleStarSelection()}
        onToggleDetails={() => selection.setDetailOpen(!selection.detailOpen)}
        onTrashSelection={() => void drive.trashItems(selection.selectedIds)}
        selectionCount={selection.selectionCount}
        setSortMode={drive.setSortMode}
        setViewMode={drive.setViewMode}
        sortMode={drive.sortMode}
        title={currentTitle}
        viewMode={drive.viewMode}
      />

      <DriveFilterChips
        peopleFilter={peopleFilter}
        setPeopleFilter={setPeopleFilter}
        setShareFilter={setShareFilter}
        setTypeFilter={setTypeFilter}
        setUpdatedFilter={(value) => setUpdatedFilterState({ referenceNow: Date.now(), value })}
        shareFilter={shareFilter}
        typeFilter={typeFilter}
        updatedFilter={updatedFilterState.value}
      />

      <section
        className={`${styles.canvasSurface} ${drive.isDragOver ? styles.canvasSurfaceDragOver : ''}`}
        onDragEnter={drive.onDragEnter}
        onDragLeave={drive.onDragLeave}
        onDragOver={drive.onDragOver}
        onDrop={(event) => void drive.onDrop(event)}
      >
        <DriveBreadcrumbs
          currentPath={drive.currentPath}
          onOpenFolder={(folderId) => {
            selection.clearSelection();
            drive.openFolder(folderId);
          }}
          scope={drive.scope}
        />

        {drive.isLoading ? (
          <DriveEmptyState title="자료함을 불러오는 중입니다." body="목록과 공유 상태를 정리하고 있습니다." />
        ) : canvasItems.length === 0 ? (
          <DriveEmptyState
            title={drive.scope === 'trash' ? '휴지통이 비어 있습니다.' : '아직 이 폴더에 자료가 없습니다.'}
            body={
              drive.scope === 'trash'
                ? '삭제된 자료가 여기에 보관됩니다.'
                : '파일을 끌어다 놓거나 새 폴더를 만들어 자료를 정리해보세요.'
            }
            actions={drive.scope === 'trash' ? null : emptyActions}
          />
        ) : drive.viewMode === 'table' ? (
          <DriveFileTable
            items={canvasItems}
            onActivateItem={handleActivateItem}
            onOpenContextMenu={handleContextMenu}
            onSelectItem={selection.selectItem}
            selectedIds={selection.selectedSet}
            shareSummaryById={drive.shareSummaryById}
            userNameById={drive.userNameById}
          />
        ) : (
          <DriveGrid
            items={canvasItems}
            onActivateItem={handleActivateItem}
            onOpenContextMenu={handleContextMenu}
            onSelectItem={selection.selectItem}
            readOnly={false}
            selectedIds={selection.selectedSet}
            shareSummaryById={drive.shareSummaryById}
          />
        )}
        {drive.isDragOver ? (
          <div className={styles.dropOverlay}>
            <strong>여기에 파일을 놓아 업로드</strong>
            <span className={styles.emptyBody}>업로드가 끝나면 이 폴더에 바로 정리됩니다.</span>
          </div>
        ) : null}
      </section>
    </div>
  );

  return (
    <>
      <DriveShell
        topbar={
          <DriveTopbar
            onOpenInfo={() => selection.setDetailOpen(!selection.detailOpen)}
            onOpenAccount={() => router.push('/account#account')}
            onOpenMenu={() => selection.setAppMenuOpen(true)}
            onOpenWorkspaceMenu={() => selection.setAppMenuOpen(true)}
            query={drive.query}
            accountLabel={drive.session?.userName || '계정'}
            sectionTitle="웹하드"
            setQuery={drive.setQuery}
            title="대한안전산업연구원"
          />
        }
        sidebar={sidebarPanels}
        main={main}
        detailOpen={selection.detailOpen}
        detail={
          <DrivePreviewPanel
            activeFolders={drive.activeFolders}
            currentPath={currentPathLabel}
            detailOpen={selection.detailOpen}
            canManageShares={drive.capabilities.canManageShares}
            isShared={selection.selectedItem ? drive.sharedIds.has(selection.selectedItem.id) : false}
            accessTagLabel={selection.selectedItem ? drive.shareSummaryById[selection.selectedItem.id]?.label || '비공개' : null}
            item={selection.selectedItem}
            moveTargetId={selection.moveTargetId}
            nameDraft={selection.nameDraft}
            onChangeMoveTargetId={selection.setMoveTargetId}
            onChangeNameDraft={selection.setNameDraft}
            onDownload={handleDownload}
            onOpenFolder={(folderId) => drive.openFolder(folderId)}
            onRestore={(itemId) => void drive.restoreItem(itemId)}
            onSaveMeta={(item) => void handleSaveMeta(item)}
            onShare={handleOpenShare}
            onToggleStar={(item) => void drive.toggleStar(item.id)}
            onTrash={(item) => void drive.trashItem(item)}
            userLabel={
              selection.selectedItem?.ownerUserId
                ? drive.userNameById[selection.selectedItem.ownerUserId] || selection.selectedItem.ownerUserId
                : '항목을 선택하세요'
            }
          />
        }
        navDrawer={
          <>
            <DriveAppMenuDrawer
              open={selection.appMenuOpen}
              onClose={() => selection.setAppMenuOpen(false)}
              supplemental={<div className={styles.drawerSidebarSupplement}>{sidebarPanels}</div>}
            />
            {selection.detailOpen ? (
              <>
                <div className={`${styles.scrim} ${styles.mobileDetailScrim}`} role="presentation" onClick={() => selection.setDetailOpen(false)} />
                <aside className={`${styles.drawerPanel} ${styles.drawerRight} ${styles.mobileDetailDrawer}`}>
                  <DrivePreviewPanel
                    activeFolders={drive.activeFolders}
                    currentPath={currentPathLabel}
                    detailOpen={selection.detailOpen}
                    canManageShares={drive.capabilities.canManageShares}
                    isShared={selection.selectedItem ? drive.sharedIds.has(selection.selectedItem.id) : false}
                    accessTagLabel={selection.selectedItem ? drive.shareSummaryById[selection.selectedItem.id]?.label || '비공개' : null}
                    item={selection.selectedItem}
                    moveTargetId={selection.moveTargetId}
                    nameDraft={selection.nameDraft}
                    onChangeMoveTargetId={selection.setMoveTargetId}
                    onChangeNameDraft={selection.setNameDraft}
                    onDownload={handleDownload}
                    onOpenFolder={(folderId) => drive.openFolder(folderId)}
                    onRestore={(itemId) => void drive.restoreItem(itemId)}
                    onSaveMeta={(item) => void handleSaveMeta(item)}
                    onShare={handleOpenShare}
                    onToggleStar={(item) => void drive.toggleStar(item.id)}
                    onTrash={(item) => void drive.trashItem(item)}
                    userLabel={
                      selection.selectedItem?.ownerUserId
                        ? drive.userNameById[selection.selectedItem.ownerUserId] || selection.selectedItem.ownerUserId
                        : '항목을 선택하세요'
                    }
                  />
                </aside>
              </>
            ) : null}
          </>
        }
        snackbar={
          <DriveSnackbar
            lastUploadBatch={drive.lastUploadBatch}
            message={drive.error || drive.notice}
            onClose={() => {
              if (drive.lastUploadBatch || drive.uploadQueue.length > 0) {
                drive.clearUploadState();
              }
              if (drive.error) {
                drive.setError('');
                return;
              }
              drive.setNotice('');
            }}
            onUndoLastUpload={() => void drive.undoLastUpload()}
            tone={drive.error ? 'error' : 'notice'}
            uploadQueue={drive.uploadQueue}
          />
        }
      />

      <DriveContextMenu
        canOpenShare={drive.capabilities.canManageShares}
        canRename={Boolean(singleSelectedItem)}
        isTrashScope={drive.scope === 'trash'}
        item={selection.contextMenuItem}
        onClose={() => selection.setContextMenu(null)}
        onCopyLink={(item) => void handleCopyLink(item)}
        onDeletePermanently={(item) => void drive.trashItem(item, true)}
        onDownload={handleDownload}
        onMove={() => handleMoveSelection()}
        onOpen={handleActivateItem}
        onOpenShare={handleOpenShare}
        onRename={() => handleRenameSelection()}
        onRestore={(item) => void drive.restoreItem(item.id)}
        onToggleStar={(item) => void drive.toggleStar(item.id)}
        onTrash={(item) => void drive.trashItem(item)}
        position={selection.contextMenu ? { x: selection.contextMenu.x, y: selection.contextMenu.y } : null}
      />

      <DriveShareDialog
        item={selection.selectedItem}
        onClose={() => selection.setShareDialogOpen(false)}
        onSyncShares={drive.syncSharesForItem}
        open={selection.shareDialogOpen}
        session={drive.session}
        users={drive.users}
      />
    </>
  );
}
