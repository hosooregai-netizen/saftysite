'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import { buildNextTableSort } from '@/features/admin/components/SortableHeaderCell';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import adminStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import {
  downloadPhotoAlbumSelection,
  fetchPhotoAlbum,
  uploadPhotoAlbumAsset,
} from '@/lib/photos/apiClient';
import { createPhotoThumbnail } from '@/lib/photos/thumbnail';
import type { TableSortState } from '@/types/admin';
import type { PhotoAlbumItem } from '@/types/photos';
import styles from './PhotoAlbumPanel.module.css';

interface PhotoAlbumSiteOption {
  headquarterId: string;
  headquarterName: string;
  id: string;
  siteName: string;
}

interface PhotoAlbumPanelProps {
  backHref?: string | null;
  backLabel?: string | null;
  initialHeadquarterId?: string | null;
  initialReportKey?: string | null;
  initialReportTitle?: string | null;
  initialSiteId?: string | null;
  lockedHeadquarterId?: string | null;
  lockedSiteId?: string | null;
  mode: 'admin' | 'worker';
  sites: PhotoAlbumSiteOption[];
}

const PAGE_SIZE = 60;

function formatDateLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(value: number) {
  if (!value) return '-';
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  if (value >= 1024) return `${Math.round(value / 1024)}KB`;
  return `${value}B`;
}

function formatGpsLabel(item: PhotoAlbumItem) {
  if (item.gpsLatitude == null || item.gpsLongitude == null) {
    return 'GPS 없음';
  }

  return `${item.gpsLatitude.toFixed(5)}, ${item.gpsLongitude.toFixed(5)}`;
}

function getSourceLabel(sourceKind: PhotoAlbumItem['sourceKind']) {
  return sourceKind === 'legacy_import' ? '이관된 보고서 사진' : '업로드 사진';
}

function matchesContext(
  item: PhotoAlbumItem,
  headquarterId: string,
  siteId: string,
  query: string,
) {
  if (headquarterId && item.headquarterId !== headquarterId) return false;
  if (siteId && item.siteId !== siteId) return false;
  if (!query) return true;

  return [
    item.fileName,
    item.headquarterName,
    item.siteName,
    item.sourceReportTitle,
    item.uploadedByName,
  ]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export function PhotoAlbumPanel({
  backHref = null,
  backLabel = null,
  initialHeadquarterId = null,
  initialReportKey = null,
  initialSiteId = null,
  lockedHeadquarterId = null,
  lockedSiteId = null,
  mode,
  sites,
}: PhotoAlbumPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const defaultHeadquarterId = lockedHeadquarterId || initialHeadquarterId || '';
  const defaultSiteId = lockedSiteId || initialSiteId || '';
  const [sort, setSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'capturedAt',
  });
  const { query, queryInput, setQueryInput, submitQuery } = useSubmittedSearchState();
  const [headquarterId, setHeadquarterId] = useState(() => defaultHeadquarterId);
  const [siteId, setSiteId] = useState(() => defaultSiteId);
  const [rows, setRows] = useState<PhotoAlbumItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<PhotoAlbumItem | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    setHeadquarterId(defaultHeadquarterId);
  }, [defaultHeadquarterId]);

  useEffect(() => {
    setSiteId(defaultSiteId);
  }, [defaultSiteId]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, headquarterId, siteId, sort.direction, sort.key]);

  const headquarterOptions = useMemo(
    () =>
      Array.from(
        new Map(sites.map((site) => [site.headquarterId, site.headquarterName])).entries(),
      ).map(([id, name]) => ({ id, name })),
    [sites],
  );
  const visibleSiteOptions = useMemo(
    () =>
      sites.filter((site) => {
        if (lockedSiteId && site.id !== lockedSiteId) return false;
        if (lockedHeadquarterId && site.headquarterId !== lockedHeadquarterId) return false;
        if (headquarterId && site.headquarterId !== headquarterId) return false;
        return true;
      }),
    [headquarterId, lockedHeadquarterId, lockedSiteId, sites],
  );
  const canUpload = Boolean(lockedSiteId || siteId);
  const showHeaderFilter =
    (mode === 'admin' && !lockedHeadquarterId) ||
    !lockedSiteId;
  const activeFilterCount =
    (mode === 'admin' && !lockedHeadquarterId && headquarterId ? 1 : 0) +
    (!lockedSiteId && siteId ? 1 : 0);

  useEffect(() => {
    if (!siteId || lockedSiteId) return;
    if (visibleSiteOptions.some((option) => option.id === siteId)) return;
    setSiteId('');
  }, [lockedSiteId, siteId, visibleSiteOptions]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPhotoAlbum({
          all: true,
          headquarterId: lockedHeadquarterId || headquarterId || '',
          query: deferredQuery,
          reportKey: initialReportKey || '',
          siteId: lockedSiteId || siteId || '',
          sortBy: (sort.key as 'capturedAt' | 'createdAt' | 'fileName' | 'siteName') || 'capturedAt',
          sortDir: sort.direction,
        });
        if (cancelled) return;
        setRows(response.rows);
        setSelectedIds((current) => current.filter((itemId) => response.rows.some((row) => row.id === itemId)));
      } catch (nextError) {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : '사진첩을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    deferredQuery,
    headquarterId,
    initialReportKey,
    lockedHeadquarterId,
    lockedSiteId,
    siteId,
    sort.direction,
    sort.key,
  ]);

  useEffect(() => {
    if (!loadMoreRef.current || visibleCount >= rows.length) {
      return;
    }

    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        setVisibleCount((current) => Math.min(rows.length, current + PAGE_SIZE));
      },
      { rootMargin: '320px 0px' },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [rows.length, visibleCount]);

  const visibleRows = useMemo(
    () => rows.slice(0, Math.min(rows.length, visibleCount)),
    [rows, visibleCount],
  );
  const hasMoreRows = visibleRows.length < rows.length;
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id));

  const handleToggleAll = () => {
    const visibleRowIds = visibleRows.map((row) => row.id);
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((itemId) => !visibleRowIds.includes(itemId))
        : Array.from(new Set([...current, ...visibleRowIds])),
    );
  };

  const handleToggleRow = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  };

  const handleDownload = async (itemIds: string[]) => {
    try {
      setError(null);
      await downloadPhotoAlbumSelection(itemIds);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '사진 다운로드에 실패했습니다.');
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    const uploadSiteId = lockedSiteId || siteId;
    if (!uploadSiteId) {
      setError('업로드할 현장을 먼저 선택해 주세요.');
      return;
    }

    const nextFiles = Array.from(files ?? []).filter((file) => file.size > 0);
    if (nextFiles.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      setNotice(null);

      for (const file of nextFiles) {
        const thumbnail = await createPhotoThumbnail(file).catch(() => null);
        await uploadPhotoAlbumAsset({
          file,
          siteId: uploadSiteId,
          thumbnail,
        });
      }

      const refreshed = await fetchPhotoAlbum({
        all: true,
        headquarterId: lockedHeadquarterId || headquarterId || '',
        query: deferredQuery,
        reportKey: initialReportKey || '',
        siteId: uploadSiteId,
        sortBy: (sort.key as 'capturedAt' | 'createdAt' | 'fileName' | 'siteName') || 'capturedAt',
        sortDir: sort.direction,
      });
      setVisibleCount(PAGE_SIZE);
      setRows(refreshed.rows);
      setSelectedIds([]);
      setNotice(`${nextFiles.length}건의 사진을 업로드했습니다.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      setError(null);
      await exportAdminWorkbook('photos', [
        {
          columns: [
            { key: 'headquarterName', label: '사업장' },
            { key: 'siteName', label: '현장' },
            { key: 'fileName', label: '파일명' },
            { key: 'sourceKind', label: '출처' },
            { key: 'sourceReportTitle', label: '원본 보고서' },
            { key: 'capturedAt', label: '촬영일' },
            { key: 'uploadedByName', label: '업로더' },
            { key: 'gps', label: 'GPS' },
            { key: 'createdAt', label: '등록일' },
          ],
          name: '사진첩',
          rows: rows.map((item) => ({
            capturedAt: item.capturedAt ? formatDateLabel(item.capturedAt) : '-',
            createdAt: formatDateLabel(item.createdAt),
            fileName: item.fileName,
            gps: formatGpsLabel(item),
            headquarterName: item.headquarterName,
            siteName: item.siteName,
            sourceKind: getSourceLabel(item.sourceKind),
            sourceReportTitle: item.sourceReportTitle || '-',
            uploadedByName: item.uploadedByName || '-',
          })),
        },
      ]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '사진 메타데이터 내보내기에 실패했습니다.');
    }
  };

  const activeItemMatchesContext =
    activeItem &&
    matchesContext(
      activeItem,
      lockedHeadquarterId || headquarterId || '',
      lockedSiteId || siteId || '',
      deferredQuery,
    );
  const sortOptions: Array<{ defaultDirection: TableSortState['direction']; key: typeof sort.key; label: string }> = [
    { defaultDirection: 'desc', key: 'capturedAt', label: '촬영일' },
    { defaultDirection: 'desc', key: 'createdAt', label: '등록일' },
    { defaultDirection: 'asc', key: 'fileName', label: '파일명' },
    { defaultDirection: 'asc', key: 'siteName', label: '현장명' },
  ];
  const resetHeaderFilters = () => {
    if (!lockedHeadquarterId) {
      setHeadquarterId(defaultHeadquarterId);
    }
    if (!lockedSiteId) {
      setSiteId(defaultSiteId);
    }
  };

  return (
    <div className={adminStyles.dashboardStack}>
      <section className={adminStyles.sectionCard}>
        <div className={adminStyles.sectionHeader}>
          <div className={adminStyles.sectionHeaderTitleBlock}>
            <h2 className={adminStyles.sectionTitle}>
              {mode === 'admin' ? '사진첩' : '현장 사진첩'}
            </h2>
          </div>
          <div className={`${adminStyles.sectionHeaderActions} ${adminStyles.sectionHeaderToolbarActions}`}>
            {backHref ? (
              <Link href={backHref} className="app-button app-button-secondary">
                {backLabel || '이전 화면으로'}
              </Link>
            ) : null}
            <SubmitSearchField
              busy={loading}
              formClassName={`${adminStyles.sectionHeaderSearchShell} ${adminStyles.sectionHeaderToolbarSearch}`}
              inputClassName={`app-input ${adminStyles.sectionHeaderSearchInput}`}
              buttonClassName={adminStyles.sectionHeaderSearchButton}
              placeholder="파일명, 현장명, 보고서명, 업로더 검색"
              value={queryInput}
              onChange={setQueryInput}
              onSubmit={submitQuery}
            />
            {showHeaderFilter ? (
              <SectionHeaderFilterMenu
                activeCount={activeFilterCount}
                ariaLabel="사진첩 필터"
                onReset={resetHeaderFilters}
              >
                <div className={adminStyles.sectionHeaderMenuGrid}>
                  {mode === 'admin' && !lockedHeadquarterId ? (
                    <div className={adminStyles.sectionHeaderMenuField}>
                      <label htmlFor="photo-filter-headquarter">사업장</label>
                      <select
                        id="photo-filter-headquarter"
                        className="app-select"
                        value={headquarterId}
                        onChange={(event) => {
                          setHeadquarterId(event.target.value);
                          setSiteId('');
                        }}
                      >
                        <option value="">전체 사업장</option>
                        {headquarterOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  {!lockedSiteId ? (
                    <div className={adminStyles.sectionHeaderMenuField}>
                      <label htmlFor="photo-filter-site">현장</label>
                      <select
                        id="photo-filter-site"
                        className="app-select"
                        value={siteId}
                        onChange={(event) => setSiteId(event.target.value)}
                      >
                        <option value="">{mode === 'admin' ? '전체 현장' : '현장 선택'}</option>
                        {visibleSiteOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.siteName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </SectionHeaderFilterMenu>
            ) : null}
            {mode === 'admin' ? (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleExport()}
              >
                메타데이터 엑셀
              </button>
            ) : null}
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleDownload(selectedIds)}
              disabled={selectedIds.length === 0 || loading}
            >
              선택 다운로드
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canUpload || uploading}
            >
              {uploading ? '업로드 중...' : '사진 업로드'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              hidden
              onChange={(event) => {
                void handleFilesSelected(event.target.files);
              }}
            />
          </div>
        </div>
        <div className={adminStyles.sectionBody}>
          {error ? <div className={adminStyles.bannerError}>{error}</div> : null}
          {notice ? <div className={adminStyles.bannerNotice}>{notice}</div> : null}

          <div className={styles.sortBar} role="toolbar" aria-label="사진첩 정렬">
            {sortOptions.map((option) => {
              const active = sort.key === option.key;
              const arrow = active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕';
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.sortChip} ${active ? styles.sortChipActive : ''}`}
                  onClick={() =>
                    setSort((current) =>
                      buildNextTableSort(current, option.key, option.defaultDirection),
                    )
                  }
                >
                  <span>{option.label}</span>
                  <span>{arrow}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className={styles.emptyState}>사진첩을 불러오는 중입니다.</div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
              {canUpload ? '표시할 사진이 없습니다.' : '현장을 선택하면 사진첩을 볼 수 있습니다.'}
            </div>
          ) : (
            <>
              <div className={styles.bulkBar}>
                <label className={styles.selectAll}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleAll}
                  />
                  <span>현재 보이는 사진 전체 선택</span>
                </label>
                <span className={adminStyles.sectionHeaderMeta}>선택 {selectedIds.length}건</span>
              </div>

              <div
                className={`${styles.grid} ${mode === 'worker' ? styles.workerCompactGrid : ''}`}
              >
                {visibleRows.map((item) => (
                  <article
                    key={item.id}
                    className={`${styles.card} ${mode === 'worker' ? styles.workerCompactCard : ''}`}
                  >
                    <button
                      type="button"
                      className={`${styles.cardPreviewButton} ${mode === 'worker' ? styles.workerCompactPreviewButton : ''}`}
                      onClick={() => setActiveItem(item)}
                    >
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.fileName}
                          className={`${styles.cardImage} ${mode === 'worker' ? styles.workerCompactImage : ''}`}
                        />
                      ) : (
                        <div
                          className={`${styles.cardImageFallback} ${mode === 'worker' ? styles.workerCompactImageFallback : ''}`}
                        >
                          미리보기 없음
                        </div>
                      )}
                    </button>
                    <label
                      className={`${styles.cardCheckbox} ${mode === 'worker' ? styles.workerCompactCheckbox : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleRow(item.id)}
                      />
                    </label>
                    <div
                      className={`${styles.cardBody} ${mode === 'worker' ? styles.workerCompactBody : ''}`}
                    >
                      <div className={styles.cardMetaRow}>
                        <span className={styles.cardMetaText}>{formatFileSize(item.sizeBytes)}</span>
                      </div>
                      <div className={styles.cardTitle} title={item.fileName}>
                        {item.fileName}
                      </div>
                      <div className={styles.cardMetaText}>{item.siteName}</div>
                      {mode === 'admin' ? (
                        <div className={styles.cardMetaText}>{item.headquarterName}</div>
                      ) : null}
                      <div className={styles.cardMetaText}>
                        {item.capturedAt ? `촬영 ${formatDateLabel(item.capturedAt)}` : `등록 ${formatDateLabel(item.createdAt)}`}
                      </div>
                      <div className={styles.cardMetaText}>
                        {item.uploadedByName ? `업로더 ${item.uploadedByName}` : '업로더 미상'}
                      </div>
                      {item.sourceReportTitle ? (
                        <div className={styles.cardMetaText} title={item.sourceReportTitle}>
                          {item.sourceReportTitle}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={`${styles.cardActions} ${mode === 'worker' ? styles.workerCompactActions : ''}`}
                    >
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => void handleDownload([item.id])}
                      >
                        다운로드
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {hasMoreRows ? (
                <div ref={loadMoreRef} className={styles.loadMoreRow}>
                  <span className={styles.paginationMeta}>
                    아래로 내려 나머지 {rows.length - visibleRows.length}건을 이어서 볼 수 있습니다.
                  </span>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() =>
                      setVisibleCount((current) => Math.min(rows.length, current + PAGE_SIZE))
                    }
                  >
                    사진 더 보기
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <AppModal
        open={Boolean(activeItem && activeItemMatchesContext)}
        title={activeItem?.fileName || '사진 상세'}
        size="large"
        onClose={() => setActiveItem(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setActiveItem(null)}
            >
              닫기
            </button>
            {activeItem ? (
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => void handleDownload([activeItem.id])}
              >
                원본 다운로드
              </button>
            ) : null}
          </>
        }
      >
        {activeItem ? (
          <div className={styles.modalGrid}>
            <div className={styles.modalPreview}>
              {activeItem.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeItem.previewUrl}
                  alt={activeItem.fileName}
                  className={styles.modalImage}
                />
              ) : (
                <div className={styles.cardImageFallback}>미리보기 없음</div>
              )}
            </div>
            <div className={styles.modalMeta}>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>출처</span>
                <span>{getSourceLabel(activeItem.sourceKind)}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>사업장</span>
                <span>{activeItem.headquarterName}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>현장</span>
                <span>{activeItem.siteName}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>촬영일</span>
                <span>{activeItem.capturedAt ? formatDateLabel(activeItem.capturedAt) : '-'}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>등록일</span>
                <span>{formatDateLabel(activeItem.createdAt)}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>업로더</span>
                <span>{activeItem.uploadedByName || '-'}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>크기</span>
                <span>{formatFileSize(activeItem.sizeBytes)}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>GPS</span>
                <span>{formatGpsLabel(activeItem)}</span>
              </div>
              {activeItem.sourceReportTitle ? (
                <>
                  <div className={styles.modalMetaRow}>
                    <span className={styles.modalMetaLabel}>원본 보고서</span>
                    <span>{activeItem.sourceReportTitle || '-'}</span>
                  </div>
                  <div className={styles.modalMetaRow}>
                    <span className={styles.modalMetaLabel}>문서 슬롯</span>
                    <span>{`${activeItem.sourceDocumentKey} / ${activeItem.sourceSlotKey}`}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}
