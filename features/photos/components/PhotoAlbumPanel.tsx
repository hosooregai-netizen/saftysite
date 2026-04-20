'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import { SectionHeaderFilterMenu } from '@/features/admin/components/SectionHeaderFilterMenu';
import adminStyles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useSubmittedSearchState } from '@/hooks/useSubmittedSearchState';
import { exportAdminWorkbook } from '@/lib/admin/exportClient';
import {
  deletePhotoAlbumSelection,
  downloadPhotoAlbumSelection,
  fetchPhotoAlbum,
  updatePhotoAlbumRounds,
  uploadPhotoAlbumAsset,
} from '@/lib/photos/apiClient';
import { createPhotoThumbnail } from '@/lib/photos/thumbnail';
import type { PhotoAlbumItem, PhotoAlbumMutationCapabilities } from '@/types/photos';
import styles from './PhotoAlbumPanel.module.css';

interface PhotoAlbumSiteOption {
  headquarterId: string;
  headquarterName: string;
  id: string;
  siteName: string;
  totalRounds?: number | null;
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

interface PhotoAlbumRoundGroup {
  key: string;
  label: string;
  roundNo: number;
  rows: PhotoAlbumItem[];
}

interface PhotoAlbumSiteGroup {
  headquarterName: string;
  key: string;
  siteId: string;
  siteName: string;
  rounds: PhotoAlbumRoundGroup[];
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

function formatRoundLabel(roundNo: number) {
  return roundNo > 0 ? `${roundNo}회차` : '회차 미지정';
}

function compareDisplayRoundNo(left: number, right: number) {
  if (left <= 0 && right <= 0) return 0;
  if (left <= 0) return 1;
  if (right <= 0) return -1;
  return left - right;
}

function getSourceLabel(sourceKind: PhotoAlbumItem['sourceKind']) {
  return sourceKind === 'legacy_import' ? '레거시 보고서 사진' : '사진첩 업로드';
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

async function requestPhotoAlbumRows(input: {
  deferredQuery: string;
  headquarterId: string;
  initialReportKey: string | null;
  lockedHeadquarterId: string | null;
  lockedSiteId: string | null;
  siteId: string;
}) {
  return fetchPhotoAlbum({
    all: true,
    headquarterId: input.lockedHeadquarterId || input.headquarterId || '',
    query: input.deferredQuery,
    reportKey: input.initialReportKey || '',
    siteId: input.lockedSiteId || input.siteId || '',
    sortBy: 'capturedAt',
    sortDir: 'desc',
  });
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
  const { query, queryInput, setQueryInput, submitQuery } = useSubmittedSearchState();
  const [headquarterId, setHeadquarterId] = useState(() => defaultHeadquarterId);
  const [siteId, setSiteId] = useState(() => defaultSiteId);
  const [uploadRoundNo, setUploadRoundNo] = useState(0);
  const [bulkRoundNo, setBulkRoundNo] = useState(0);
  const [rows, setRows] = useState<PhotoAlbumItem[]>([]);
  const [mutationCapabilities, setMutationCapabilities] =
    useState<PhotoAlbumMutationCapabilities | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
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
  }, [deferredQuery, headquarterId, siteId]);

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

  const selectedUploadSite = useMemo(
    () => visibleSiteOptions.find((option) => option.id === (lockedSiteId || siteId || '')) ?? null,
    [lockedSiteId, siteId, visibleSiteOptions],
  );

  const uploadRoundOptions = useMemo(() => {
    const totalRounds = selectedUploadSite?.totalRounds ?? 0;
    if (!totalRounds || totalRounds <= 0) {
      return [];
    }
    return Array.from({ length: totalRounds }, (_, index) => index + 1);
  }, [selectedUploadSite]);

  const canUpload = Boolean((lockedSiteId || siteId) && uploadRoundNo > 0 && uploadRoundOptions.length > 0);
  const showHeaderFilter = (mode === 'admin' && !lockedHeadquarterId) || !lockedSiteId;
  const activeFilterCount =
    (mode === 'admin' && !lockedHeadquarterId && headquarterId ? 1 : 0) +
    (!lockedSiteId && siteId ? 1 : 0);

  useEffect(() => {
    if (!siteId || lockedSiteId) return;
    if (visibleSiteOptions.some((option) => option.id === siteId)) return;
    setSiteId('');
  }, [lockedSiteId, siteId, visibleSiteOptions]);

  useEffect(() => {
    if (uploadRoundOptions.length === 0) {
      setUploadRoundNo(0);
      return;
    }
    setUploadRoundNo((current) =>
      uploadRoundOptions.includes(current) ? current : uploadRoundOptions[0] ?? 0,
    );
  }, [uploadRoundOptions]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await requestPhotoAlbumRows({
          deferredQuery,
          headquarterId,
          initialReportKey,
          lockedHeadquarterId,
          lockedSiteId,
          siteId,
        });
        if (cancelled) return;
        setRows(response.rows);
        setMutationCapabilities(response.capabilities);
        setSelectedIds((current) =>
          current.filter((itemId) => response.rows.some((row) => row.id === itemId)),
        );
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

  const groupedVisibleRows = useMemo<PhotoAlbumSiteGroup[]>(() => {
    const siteGroups = new Map<string, PhotoAlbumSiteGroup>();

    for (const item of visibleRows) {
      const siteKey = `${item.siteId}::${item.headquarterId}`;
      const existingSiteGroup =
        siteGroups.get(siteKey) ??
        {
          headquarterName: item.headquarterName,
          key: siteKey,
          rounds: [],
          siteId: item.siteId,
          siteName: item.siteName,
        };
      if (!siteGroups.has(siteKey)) {
        siteGroups.set(siteKey, existingSiteGroup);
      }

      const roundKey = `round:${item.roundNo}`;
      const existingRoundGroup =
        existingSiteGroup.rounds.find((group) => group.key === roundKey) ??
        {
          key: roundKey,
          label: formatRoundLabel(item.roundNo),
          roundNo: item.roundNo,
          rows: [],
        };
      if (!existingSiteGroup.rounds.some((group) => group.key === roundKey)) {
        existingSiteGroup.rounds.push(existingRoundGroup);
      }
      existingRoundGroup.rows.push(item);
    }

    return Array.from(siteGroups.values()).map((siteGroup) => ({
      ...siteGroup,
      rounds: [...siteGroup.rounds].sort(
        (left, right) =>
          compareDisplayRoundNo(left.roundNo, right.roundNo) ||
          left.label.localeCompare(right.label, 'ko-KR'),
      ),
    }));
  }, [visibleRows]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const selectedSiteIds = useMemo(
    () => Array.from(new Set(selectedRows.map((row) => row.siteId).filter(Boolean))),
    [selectedRows],
  );

  const selectedBulkSite = useMemo(
    () =>
      selectedSiteIds.length === 1
        ? sites.find((site) => site.id === selectedSiteIds[0]) ?? null
        : null,
    [selectedSiteIds, sites],
  );

  const bulkRoundOptions = useMemo(() => {
    const totalRounds = selectedBulkSite?.totalRounds ?? 0;
    if (!selectedBulkSite || totalRounds <= 0) {
      return [];
    }
    return Array.from({ length: totalRounds }, (_, index) => index + 1);
  }, [selectedBulkSite]);

  useEffect(() => {
    if (bulkRoundOptions.length === 0) {
      setBulkRoundNo(0);
      return;
    }
    setBulkRoundNo((current) =>
      bulkRoundOptions.includes(current) ? current : bulkRoundOptions[0] ?? 0,
    );
  }, [bulkRoundOptions]);

  const hasMoreRows = visibleRows.length < rows.length;
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id));
  const hasSelectedRows = selectedIds.length > 0;
  const roundUpdateSupported = mutationCapabilities?.roundUpdateSupported ?? true;
  const deleteSupported = mutationCapabilities?.deleteSupported ?? true;
  const canBulkEditRound =
    roundUpdateSupported &&
    hasSelectedRows &&
    selectedSiteIds.length === 1 &&
    bulkRoundOptions.length > 0 &&
    bulkRoundNo > 0;
  const mutationCapabilityNotice = !roundUpdateSupported && !deleteSupported
    ? '현재 연결된 Safety API 서버가 사진 회차 변경과 삭제를 아직 지원하지 않습니다.'
    : !roundUpdateSupported
      ? '현재 연결된 Safety API 서버가 사진 회차 변경을 아직 지원하지 않습니다.'
      : !deleteSupported
        ? '현재 연결된 Safety API 서버가 사진 삭제를 아직 지원하지 않습니다.'
        : null;

  const activeItemMatchesContext =
    activeItem &&
    matchesContext(
      activeItem,
      lockedHeadquarterId || headquarterId || '',
      lockedSiteId || siteId || '',
      deferredQuery,
    );

  const resetHeaderFilters = () => {
    if (!lockedHeadquarterId) {
      setHeadquarterId(defaultHeadquarterId);
    }
    if (!lockedSiteId) {
      setSiteId(defaultSiteId);
    }
  };

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

  const reloadRows = async (nextSiteId?: string) => {
    const response = await requestPhotoAlbumRows({
      deferredQuery,
      headquarterId,
      initialReportKey,
      lockedHeadquarterId,
      lockedSiteId,
      siteId: nextSiteId ?? siteId,
    });
    setVisibleCount(PAGE_SIZE);
    setRows(response.rows);
    setMutationCapabilities(response.capabilities);
    return response.rows;
  };

  const handleFilesSelected = async (files: FileList | null) => {
    const uploadSiteId = lockedSiteId || siteId;
    if (!uploadSiteId) {
      setError('업로드할 현장을 먼저 선택해 주세요.');
      return;
    }

    if (uploadRoundOptions.length === 0 || uploadRoundNo <= 0) {
      setError('업로드할 회차를 먼저 선택해 주세요.');
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
          roundNo: uploadRoundNo,
          siteId: uploadSiteId,
          thumbnail,
        });
      }

      await reloadRows(uploadSiteId);
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

  const handleBulkRoundChange = async () => {
    if (!roundUpdateSupported) {
      setError('현재 연결된 Safety API 서버가 사진 회차 변경을 아직 지원하지 않습니다.');
      return false;
    }

    if (!canBulkEditRound) {
      return false;
    }

    try {
      setBulkUpdating(true);
      setError(null);
      setNotice(null);
      const selectedCount = selectedIds.length;
      await updatePhotoAlbumRounds(selectedIds, bulkRoundNo);
      await reloadRows();
      setSelectedIds([]);
      setRoundModalOpen(false);
      setNotice(`${selectedCount}건의 사진을 ${formatRoundLabel(bulkRoundNo)}로 변경했습니다.`);
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '사진 회차를 변경하지 못했습니다.');
      return false;
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!deleteSupported) {
      setError('현재 연결된 Safety API 서버가 사진 삭제를 아직 지원하지 않습니다.');
      return;
    }

    if (!hasSelectedRows) {
      return;
    }

    const confirmed = window.confirm(`선택한 사진 ${selectedIds.length}건을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setNotice(null);
      const deletingIds = [...selectedIds];
      await deletePhotoAlbumSelection(deletingIds);
      await reloadRows();
      if (activeItem && deletingIds.includes(activeItem.id)) {
        setActiveItem(null);
      }
      setSelectedIds([]);
      setNotice(`${deletingIds.length}건의 사진을 삭제했습니다.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '사진 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenRoundModal = () => {
    if (!roundUpdateSupported) {
      setError('현재 연결된 Safety API 서버가 사진 회차 변경을 아직 지원하지 않습니다.');
      return;
    }

    if (!hasSelectedRows) {
      return;
    }
    setRoundModalOpen(true);
  };

  const handleExport = async () => {
    try {
      setError(null);
      await exportAdminWorkbook('photos', [
        {
          columns: [
            { key: 'headquarterName', label: '사업장' },
            { key: 'siteName', label: '현장' },
            { key: 'roundNo', label: '회차' },
            { key: 'fileName', label: '파일명' },
            { key: 'sourceKind', label: '출처' },
            { key: 'sourceReportTitle', label: '원본 보고서' },
            { key: 'capturedAt', label: '촬영일' },
            { key: 'uploadedByName', label: '업로드' },
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
            roundNo: formatRoundLabel(item.roundNo),
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
              placeholder="파일명, 현장명, 보고서명, 업로드 검색"
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
            {(lockedSiteId || siteId) ? (
              <div className={adminStyles.sectionHeaderMenuField}>
                <label htmlFor="photo-upload-round">업로드 회차</label>
                <select
                  id="photo-upload-round"
                  className="app-select"
                  value={uploadRoundNo}
                  onChange={(event) => setUploadRoundNo(Number.parseInt(event.target.value, 10) || 0)}
                  disabled={uploadRoundOptions.length === 0}
                >
                  {uploadRoundOptions.length === 0 ? (
                    <option value="0">업로드 가능한 회차 없음</option>
                  ) : null}
                  {uploadRoundOptions.map((roundNo) => (
                    <option key={roundNo} value={roundNo}>
                      {formatRoundLabel(roundNo)}
                    </option>
                  ))}
                </select>
              </div>
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
          {mutationCapabilityNotice ? (
            <div className={adminStyles.bannerNotice}>{mutationCapabilityNotice}</div>
          ) : null}

          {loading ? (
            <div className={styles.emptyState}>사진첩을 불러오는 중입니다.</div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>
              {canUpload ? '표시할 사진이 없습니다.' : '현장을 선택하면 사진첩을 볼 수 있습니다.'}
            </div>
          ) : (
            <>
              <div className={styles.bulkBar}>
                <div className={styles.bulkActions}>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={handleToggleAll}
                    disabled={visibleRows.length === 0 || bulkUpdating || deleting}
                  >
                    모두 선택
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={handleOpenRoundModal}
                    disabled={!roundUpdateSupported || !hasSelectedRows || bulkUpdating || deleting}
                  >
                    선택 회차 변경
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => void handleDownload(selectedIds)}
                    disabled={!hasSelectedRows || bulkUpdating || deleting}
                  >
                    선택 다운로드
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-danger"
                    onClick={() => void handleDeleteSelected()}
                    disabled={!deleteSupported || !hasSelectedRows || bulkUpdating || deleting}
                  >
                    {deleting ? '삭제 중...' : '선택 삭제'}
                  </button>
                </div>
              </div>

              <div className={styles.groupStack}>
                {groupedVisibleRows.map((siteGroup) => (
                  <section key={siteGroup.key} className={styles.groupSection}>
                    <header className={styles.groupHeader}>
                      <div>
                        <h3 className={styles.groupTitle}>{siteGroup.siteName}</h3>
                        <div className={styles.groupMeta}>
                          {mode === 'admin'
                            ? `${siteGroup.headquarterName} · ${siteGroup.rounds.length}개 회차`
                            : `${siteGroup.rounds.length}개 회차`}
                        </div>
                      </div>
                    </header>
                    <div className={styles.roundStack}>
                      {siteGroup.rounds.map((roundGroup) => (
                        <section key={`${siteGroup.key}:${roundGroup.key}`} className={styles.roundSection}>
                          <div className={styles.roundHeader}>
                            <strong>{roundGroup.label}</strong>
                            <span className={styles.groupMeta}>{roundGroup.rows.length}건</span>
                          </div>
                          <div
                            className={`${styles.grid} ${mode === 'worker' ? styles.workerCompactGrid : ''}`}
                          >
                            {roundGroup.rows.map((item) => {
                              const isSelected = selectedIds.includes(item.id);
                              return (
                                <article
                                  key={item.id}
                                  className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${
                                    mode === 'worker' ? styles.workerCompactCard : ''
                                  }`}
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
                                      checked={isSelected}
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
                                    <div className={styles.cardMetaText}>
                                      {item.siteName} · {formatRoundLabel(item.roundNo)}
                                    </div>
                                    {mode === 'admin' ? (
                                      <div className={styles.cardMetaText}>{item.headquarterName}</div>
                                    ) : null}
                                    <div className={styles.cardMetaText}>
                                      {item.capturedAt
                                        ? `촬영 ${formatDateLabel(item.capturedAt)}`
                                        : `등록 ${formatDateLabel(item.createdAt)}`}
                                    </div>
                                    <div className={styles.cardMetaText}>
                                      {item.uploadedByName ? `업로드 ${item.uploadedByName}` : '업로드 정보 없음'}
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
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {hasMoreRows ? (
                <div ref={loadMoreRef} className={styles.loadMoreRow}>
                  <span className={styles.paginationMeta}>
                    아래로 내려 남은 {rows.length - visibleRows.length}건을 더 볼 수 있습니다.
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
        open={roundModalOpen}
        title="선택 회차 변경"
        onClose={() => setRoundModalOpen(false)}
        mobileActionsLayout="row"
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setRoundModalOpen(false)}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleBulkRoundChange()}
              disabled={!canBulkEditRound || bulkUpdating}
            >
              {bulkUpdating ? '변경 중...' : '변경하기'}
            </button>
          </>
        }
      >
        <div className={styles.roundModalBody}>
          {selectedSiteIds.length !== 1 ? (
            <p className={styles.roundModalMessage}>
              같은 현장 사진만 함께 선택하면 회차를 변경할 수 있습니다.
            </p>
          ) : bulkRoundOptions.length === 0 ? (
            <p className={styles.roundModalMessage}>
              선택한 현장의 회차 정보가 없어 회차를 변경할 수 없습니다.
            </p>
          ) : (
            <>
              <p className={styles.roundModalMessage}>
                선택한 사진 {selectedIds.length}건의 회차를 변경합니다.
              </p>
              <div className={styles.roundModalField}>
                <label htmlFor="photo-bulk-round" className={styles.roundModalLabel}>
                  변경할 회차
                </label>
                <select
                  id="photo-bulk-round"
                  className="app-select"
                  value={bulkRoundNo}
                  onChange={(event) => setBulkRoundNo(Number.parseInt(event.target.value, 10) || 0)}
                >
                  {bulkRoundOptions.map((roundNo) => (
                    <option key={roundNo} value={roundNo}>
                      {formatRoundLabel(roundNo)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </AppModal>

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
                <span className={styles.modalMetaLabel}>회차</span>
                <span>{formatRoundLabel(activeItem.roundNo)}</span>
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
                <span className={styles.modalMetaLabel}>업로드</span>
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
                    <span className={styles.modalMetaLabel}>문서 위치</span>
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
