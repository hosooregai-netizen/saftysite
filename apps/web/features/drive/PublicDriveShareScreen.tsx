'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DriveAppMenuDrawer } from '@/features/drive/DriveAppMenuDrawer';
import { DriveBreadcrumbs } from '@/features/drive/DriveBreadcrumbs';
import { DriveEmptyState } from '@/features/drive/DriveEmptyState';
import {
  DriveFilterChips,
  type DrivePeopleFilter,
  type DriveShareFilter,
  type DriveTypeFilter,
  type DriveUpdatedFilter,
} from '@/features/drive/DriveFilterChips';
import { DriveFileTable } from '@/features/drive/DriveFileTable';
import { DriveGrid } from '@/features/drive/DriveGrid';
import { DriveMainHeader } from '@/features/drive/DriveMainHeader';
import { DrivePreviewPanel } from '@/features/drive/DrivePreviewPanel';
import { DriveShell } from '@/features/drive/DriveShell';
import { DriveSnackbar } from '@/features/drive/DriveSnackbar';
import { DriveTopbar } from '@/features/drive/DriveTopbar';
import { DriveIcon } from '@/features/drive/DriveIcons';
import {
  fetchPublicDriveChildren,
  fetchPublicDriveItem,
  fetchPublicDriveRoot,
} from '@/features/drive/driveApi';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveItemRecord, DrivePathNode, DriveSortMode, DriveViewMode } from '@/features/drive/types';
import { beginGoogleWorkspaceAuth } from '@/lib/sessionAuthFlow';
import {
  canUseWorkspaceServerApis,
  isAnonymousSession,
  peekCachedSession,
  type DemoSession,
} from '@/lib/reportApi';
import { isImageContentType, isPdfContentType, isTextLikeItem, triggerDriveDownload } from '@/lib/webhard/drivePreview';

type PublicState = {
  currentItem: DriveItemRecord;
  path: DrivePathNode[];
  rootItemId: string;
  rows: DriveItemRecord[];
  shareRole: 'viewer' | 'editor';
  shareVisibility: 'restricted' | 'anyone_with_link';
};

function toPublicState(payload: {
  item: DriveItemRecord;
  path: DrivePathNode[];
  rootItemId: string;
  rows: DriveItemRecord[];
  shareRole: 'viewer' | 'editor';
  shareVisibility: 'restricted' | 'anyone_with_link';
}): PublicState {
  return {
    ...payload,
    currentItem: payload.item,
  };
}

function currentPathname() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

function canPreviewItem(item: DriveItemRecord) {
  if (item.kind === 'folder') return false;
  if (item.fileType === 'link') return false;
  if (isTextLikeItem({ contentType: item.contentType, fileType: item.fileType })) return true;
  if (item.fileType === 'binary' && (isImageContentType(item.contentType) || isPdfContentType(item.contentType))) {
    return true;
  }
  return false;
}

function sortRows(rows: DriveItemRecord[], sortMode: DriveSortMode) {
  const next = [...rows];
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

export function PublicDriveShareScreen({ token }: { token: string }) {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(() => peekCachedSession());
  const [authRequired, setAuthRequired] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<DriveSortMode>('updated');
  const [viewMode, setViewMode] = useState<DriveViewMode>('table');
  const [detailOpen, setDetailOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [state, setState] = useState<PublicState | null>(null);
  const [typeFilter, setTypeFilter] = useState<DriveTypeFilter>('all');
  const [updatedFilterState, setUpdatedFilterState] = useState<{ referenceNow: number; value: DriveUpdatedFilter }>(
    () => ({
      referenceNow: Date.now(),
      value: 'all',
    }),
  );
  const [peopleFilter, setPeopleFilter] = useState<DrivePeopleFilter>('all');
  const [shareFilter, setShareFilter] = useState<DriveShareFilter>('all');

  const authorizedSession = useMemo(
    () => (session && canUseWorkspaceServerApis(session) ? session : null),
    [session],
  );

  const selectedItem = useMemo(() => {
    if (!state) return null;
    if (selectedItemId === state.currentItem.id) return state.currentItem;
    return state.rows.find((row) => row.id === selectedItemId) ?? null;
  }, [selectedItemId, state]);

  const visibleRows = useMemo(() => {
    if (!state) return [];
    const normalizedQuery = query.trim().toLowerCase();
    const baseRows = normalizedQuery
      ? state.rows.filter((item) =>
          [item.name, item.textContent, item.externalUrl, item.contentType].join(' ').toLowerCase().includes(normalizedQuery),
        )
      : state.rows;
    return sortRows(
      baseRows.filter((item) => {
        if (typeFilter === 'folders' && item.kind !== 'folder') return false;
        if (typeFilter === 'files' && item.kind !== 'file') return false;
        if (updatedFilterState.value !== 'all') {
          const updatedAt = new Date(item.updatedAt).getTime();
          const cutoff = updatedFilterState.value === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          if (!Number.isFinite(updatedAt) || updatedFilterState.referenceNow - updatedAt > cutoff) return false;
        }
        return true;
      }),
      sortMode,
    );
  }, [query, sortMode, state, typeFilter, updatedFilterState]);

  const loadRoot = async (nextSession?: DemoSession | null) => {
    const payload = await fetchPublicDriveRoot(token, nextSession ?? authorizedSession);
    setState(toPublicState(payload));
    setSelectedItemId(payload.item.id);
  };

  const loadFolder = async (folderId: string | null, nextSession?: DemoSession | null) => {
    const payload = await fetchPublicDriveChildren(token, folderId, nextSession ?? authorizedSession);
    setState(toPublicState(payload));
    setSelectedItemId(payload.item.id);
  };

  const loadFile = async (itemId: string, nextSession?: DemoSession | null) => {
    const payload = await fetchPublicDriveItem(token, itemId, nextSession ?? authorizedSession);
    setState(toPublicState(payload));
    setSelectedItemId(payload.item.id);
    setDetailOpen(true);
  };

  const handleViewerError = (nextError: unknown, fallbackMessage: string) => {
    const status = typeof nextError === 'object' && nextError && 'status' in nextError
      ? Number((nextError as { status?: unknown }).status)
      : 0;
    if (status === 401) {
      setAuthRequired(true);
      return;
    }
    if (status === 403 || status === 404) {
      setIsUnavailable(true);
      return;
    }
    setError(nextError instanceof Error ? nextError.message : fallbackMessage);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true);
        setError('');
        setAuthRequired(false);
        setIsUnavailable(false);
        const cached = peekCachedSession();
        if (!cancelled) {
          setSession(cached);
        }
        const payload = await fetchPublicDriveRoot(
          token,
          cached && canUseWorkspaceServerApis(cached) ? cached : null,
        );
        if (!cancelled) {
          setState(toPublicState(payload));
          setSelectedItemId(payload.item.id);
        }
      } catch (nextError) {
        if (cancelled) return;
        handleViewerError(nextError, '공유 자료를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleGoogleLogin = async () => {
    const anonymousToken = session && isAnonymousSession(session) ? session.token : undefined;
    await beginGoogleWorkspaceAuth({
      anonymousToken,
      nextPath: currentPathname(),
    });
  };

  const handleDownload = (item: DriveItemRecord) => {
    if (item.fileType === 'link' && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    triggerDriveDownload(item);
  };

  const handleActivateItem = (item: DriveItemRecord) => {
    setSelectedItemId(item.id);
    if (item.kind === 'folder') {
      void loadFolder(item.id).catch((nextError) => handleViewerError(nextError, '폴더를 열지 못했습니다.'));
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
    void loadFile(item.id).catch((nextError) => handleViewerError(nextError, '파일을 불러오지 못했습니다.'));
  };

  const currentPathLabel = useMemo(
    () => (state ? state.path.map((node) => node.name).join(' / ') : ''),
    [state],
  );

  const folderQuickLinks = useMemo(
    () => visibleRows.filter((row) => row.kind === 'folder'),
    [visibleRows],
  );
  const publicShareSummaries = useMemo(
    () =>
      Object.fromEntries(
        [state?.currentItem, ...visibleRows]
          .filter(Boolean)
          .map((item) => [(item as DriveItemRecord).id, { label: '링크 공유', tone: 'shared' as const }]),
      ),
    [state, visibleRows],
  );

  if (authRequired) {
    return (
      <div className={styles.host}>
        <div className={styles.canvas}>
          <div className={styles.roleBanner}>
            <div>
              <strong>제한 공유</strong>
              <p className={styles.muted}>이 자료는 권한이 있는 사용자만 열 수 있습니다.</p>
            </div>
            <button type="button" className="erp-button erp-button-primary" onClick={() => void handleGoogleLogin()}>
              Google로 계속
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <div className={styles.host}>
        <div className={styles.canvas}>
          <DriveEmptyState title="공유 링크가 만료되었거나 사용할 수 없습니다." body="링크가 폐기되었거나 더 이상 접근할 수 없는 자료입니다." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.host}>
        <div className={styles.canvas}>
          <DriveEmptyState title="공유 자료를 열 수 없습니다." body={error} />
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className={styles.sidebar}>
      <section className={styles.navSection}>
        <button type="button" className={`${styles.navButton} ${styles.navButtonActive}`} onClick={() => void loadRoot()}>
          <span className={styles.navButtonLabel}>
            <DriveIcon name="folder" size={18} />
            <span className={styles.navPrimary}>공유 루트</span>
          </span>
        </button>
      </section>

      <section className={styles.navSection}>
        <div className={styles.navSectionLabel}>하위 폴더</div>
        <div className={styles.folderTree}>
          {folderQuickLinks.length === 0 ? <span className={styles.muted}>이 위치에는 하위 폴더가 없습니다.</span> : null}
          {folderQuickLinks.map((folder) => (
            <button key={folder.id} type="button" className={styles.folderTreeButton} onClick={() => void loadFolder(folder.id)}>
              <span className={styles.folderTreeLabel}>
                <DriveIcon name="folder" size={18} />
                <span className={styles.navPrimary}>{folder.name}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const main = (
    <div className={styles.canvas}>
      {state ? (
        <div className={styles.roleBanner}>
          <div>
            <strong>{state.shareRole === 'editor' ? 'Editor link' : 'Viewer link'}</strong>
            <p className={styles.muted}>
              {state.shareVisibility === 'restricted'
                ? '권한이 있는 사용자에게만 허용된 제한 공유입니다.'
                : '링크를 받은 사용자가 열람할 수 있는 공유 링크입니다.'}
            </p>
          </div>
          <span className={styles.roleBadge}>{state.shareVisibility === 'restricted' ? 'Restricted' : 'Anyone with link'}</span>
        </div>
      ) : null}

      <DriveMainHeader
        canBulkDownload={visibleRows.some((item) => item.id === selectedItemId && item.kind === 'file')}
        canEditSingleSelection={false}
        detailOpen={detailOpen}
        selectionCount={0}
        onToggleDetails={() => setDetailOpen(!detailOpen)}
        setSortMode={setSortMode}
        setViewMode={setViewMode}
        sortMode={sortMode}
        title={state?.path[state.path.length - 1]?.name || '공유 자료'}
        viewMode={viewMode}
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

      <section className={styles.canvasSurface}>
        {state ? <DriveBreadcrumbs currentPath={state.path} onOpenFolder={(folderId) => void loadFolder(folderId)} scope="root" /> : null}

        {isLoading || !state ? (
          <DriveEmptyState title="공유 자료를 불러오는 중입니다." body="읽기 전용 범위의 파일과 폴더를 정리하고 있습니다." />
        ) : visibleRows.length === 0 && state.currentItem.kind === 'folder' ? (
          <DriveEmptyState title="이 폴더에는 표시할 자료가 없습니다." body="공유 범위 안의 하위 항목만 표시됩니다." />
        ) : state.currentItem.kind === 'folder' ? (
          viewMode === 'table' ? (
            <DriveFileTable
              items={visibleRows}
              onActivateItem={handleActivateItem}
              onOpenContextMenu={() => undefined}
              onSelectItem={(itemId) => setSelectedItemId(itemId)}
              readOnly
              selectedIds={new Set(selectedItemId ? [selectedItemId] : [])}
              shareSummaryById={publicShareSummaries}
              userNameById={{}}
            />
          ) : (
            <DriveGrid
              items={visibleRows}
              onActivateItem={handleActivateItem}
              onOpenContextMenu={() => undefined}
              onSelectItem={(itemId) => setSelectedItemId(itemId)}
              readOnly
              selectedIds={new Set(selectedItemId ? [selectedItemId] : [])}
              shareSummaryById={publicShareSummaries}
            />
          )
        ) : (
          <DriveEmptyState title="파일을 선택했습니다." body="오른쪽 상세 패널에서 미리보기와 다운로드를 진행할 수 있습니다." />
        )}
      </section>
    </div>
  );

  return (
    <DriveShell
      topbar={
        <DriveTopbar
          accountLabel={session?.userName || '계정'}
          onOpenInfo={() => setDetailOpen(!detailOpen)}
          onOpenAccount={() => router.push('/account#account')}
          onOpenMenu={() => setNavOpen(true)}
          onOpenWorkspaceMenu={() => setNavOpen(true)}
          query={query}
          readOnly
          sectionTitle="공유 자료"
          setQuery={setQuery}
          title="대한안전산업연구원"
        />
      }
      sidebar={sidebar}
      main={main}
      detailOpen={detailOpen}
      detail={
        <DrivePreviewPanel
          activeFolders={[]}
          currentPath={currentPathLabel}
          detailOpen={detailOpen}
          accessTagLabel={state?.shareRole === 'editor' ? 'Editor link' : 'Viewer link'}
          isShared
          item={selectedItem}
          moveTargetId=""
          nameDraft=""
          onChangeMoveTargetId={() => undefined}
          onChangeNameDraft={() => undefined}
          onDownload={handleDownload}
          onOpenFolder={(folderId) => void loadFolder(folderId)}
          onRestore={() => undefined}
          onSaveMeta={() => undefined}
          onShare={() => undefined}
          onToggleStar={() => undefined}
          onTrash={() => undefined}
          readOnly
          userLabel="공유 자료"
        />
      }
      navDrawer={
        <>
          <DriveAppMenuDrawer
            open={navOpen}
            onClose={() => setNavOpen(false)}
            readOnly
            supplemental={<div className={styles.drawerSidebarSupplement}>{sidebar}</div>}
          />
          {detailOpen ? (
            <>
              <div className={`${styles.scrim} ${styles.mobileDetailScrim}`} role="presentation" onClick={() => setDetailOpen(false)} />
              <aside className={`${styles.drawerPanel} ${styles.drawerRight} ${styles.mobileDetailDrawer}`}>
                <DrivePreviewPanel
                  activeFolders={[]}
                  currentPath={currentPathLabel}
                  detailOpen={detailOpen}
                  accessTagLabel={state?.shareRole === 'editor' ? 'Editor link' : 'Viewer link'}
                  isShared
                  item={selectedItem}
                  moveTargetId=""
                  nameDraft=""
                  onChangeMoveTargetId={() => undefined}
                  onChangeNameDraft={() => undefined}
                  onDownload={handleDownload}
                  onOpenFolder={(folderId) => void loadFolder(folderId)}
                  onRestore={() => undefined}
                  onSaveMeta={() => undefined}
                  onShare={() => undefined}
                  onToggleStar={() => undefined}
                  onTrash={() => undefined}
                  readOnly
                  userLabel="공유 자료"
                />
              </aside>
            </>
          ) : null}
        </>
      }
      snackbar={
        <DriveSnackbar
          message={error}
          onClose={() => setError('')}
          tone="error"
        />
      }
    />
  );
}
