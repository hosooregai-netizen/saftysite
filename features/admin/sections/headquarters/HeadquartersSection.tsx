'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import { fetchAdminHeadquartersList, fetchAdminSitesList } from '@/lib/admin/apiClient';
import { getAdminSectionHref, getSiteStatusLabel } from '@/lib/admin';
import type {
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteStatus,
  SafetySiteUpdateInput,
} from '@/types/controller';
import type { SafetySite } from '@/types/backend';
import { HeadquarterSummaryPanel } from './HeadquarterSummaryPanel';
import { SiteManagementMainPanel } from './SiteManagementMainPanel';
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';
import { SitesSection } from '../sites/SitesSection';

const EMPTY_HEADQUARTER_ROWS: import('@/types/controller').SafetyHeadquarter[] = [];
const HEADQUARTERS_PAGE_SIZE = 10;

function buildRequestKey(input: {
  page: number;
  query: string;
  sort: import('@/types/admin').TableSortState;
}) {
  return JSON.stringify(input);
}

function normalizeHeadquarterValue(value: string | null | undefined) {
  return String(value ?? '').trim();
}

function validateHeadquarterSubmit(
  form: ReturnType<typeof useHeadquartersSectionState>['form'],
  headquarters: import('@/types/controller').SafetyHeadquarter[],
  editingId: string | null,
) {
  const maxLengthChecks: Array<[string, string, number]> = [
    ['회사명', form.name, 200],
    ['사업장관리번호', form.management_number, 100],
    ['사업장개시번호', form.opening_number, 100],
    ['사업자등록번호', form.business_registration_no, 50],
    ['법인등록번호', form.corporate_registration_no, 50],
    ['건설업면허/등록번호', form.license_no, 50],
    ['본사 대표자명', form.contact_name, 100],
    ['대표 전화', form.contact_phone, 50],
  ];

  for (const [label, value, maxLength] of maxLengthChecks) {
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      return `${label}는 ${maxLength}자 이하로 입력해 주세요.`;
    }
  }

  const duplicateManagementNumber = normalizeHeadquarterValue(form.management_number);
  if (
    duplicateManagementNumber &&
    headquarters.some(
      (item) =>
        item.id !== editingId &&
        normalizeHeadquarterValue(item.management_number) === duplicateManagementNumber,
    )
  ) {
    return `사업장관리번호 '${duplicateManagementNumber}'는 이미 다른 사업장에서 사용 중입니다.`;
  }

  const duplicateOpeningNumber = normalizeHeadquarterValue(form.opening_number);
  if (
    duplicateOpeningNumber &&
    headquarters.some(
      (item) =>
        item.id !== editingId &&
        normalizeHeadquarterValue(item.opening_number) === duplicateOpeningNumber,
    )
  ) {
    return `사업장개시번호 '${duplicateOpeningNumber}'는 이미 다른 사업장에서 사용 중입니다.`;
  }

  return null;
}

interface HeadquartersSectionProps {
  busy: boolean;
  canDelete: boolean;
  currentUserId: string;
  selectedHeadquarterId: string | null;
  selectedSiteId: string | null;
  onClearHeadquarterSelection: () => void;
  onClearSiteSelection: () => void;
  onCreate: (input: SafetyHeadquarterInput) => Promise<void>;
  onCreateSite: (input: SafetySiteInput) => Promise<SafetySite>;
  onDelete: (id: string) => Promise<void>;
  onDeleteSite: (id: string) => Promise<void>;
  onSelectHeadquarter: (headquarterId: string) => void;
  onSelectSite: (headquarterId: string, siteId: string) => void;
  onUpdate: (id: string, input: SafetyHeadquarterUpdateInput) => Promise<void>;
  onUpdateSite: (id: string, input: SafetySiteUpdateInput) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
}

export function HeadquartersSection(props: HeadquartersSectionProps) {
  const HEADQUARTER_LIST_CACHE_KEY_PREFIX = 'headquarters:list:v2:';
  const {
    busy,
    canDelete,
    currentUserId,
    selectedHeadquarterId,
    selectedSiteId,
    onAssignFieldAgent,
    onClearSiteSelection,
    onCreate,
    onCreateSite,
    onDelete,
    onDeleteSite,
    onSelectHeadquarter,
    onSelectSite,
    onUnassignFieldAgent,
    onUpdate,
    onUpdateSite,
  } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteStatusParam = searchParams.get('siteStatus');
  const autoEditSiteId = searchParams.get('editSiteId');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHeadquarter, setSelectedHeadquarter] =
    useState<import('@/types/controller').SafetyHeadquarter | null>(null);
  const [selectedSite, setSelectedSite] = useState<import('@/types/backend').SafetySite | null>(null);
  const [selectedHeadquarterSites, setSelectedHeadquarterSites] = useState<
    import('@/types/backend').SafetySite[]
  >([]);
  const [isResolvingSiteContext, setIsResolvingSiteContext] = useState(false);
  const state = useHeadquartersSectionState(busy);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedHeadquarterRequestIdRef = useRef(0);
  const selectedSiteRequestIdRef = useRef(0);
  const requestKey = useMemo(
    () =>
      buildRequestKey({
        page: state.page,
        query: state.query.trim(),
        sort: state.sort,
      }),
    [state.page, state.query, state.sort],
  );
  const cachedResponse = useMemo(
    () =>
      readAdminSessionCache<import('@/types/admin').SafetyAdminHeadquarterListResponse>(
        currentUserId,
        `${HEADQUARTER_LIST_CACHE_KEY_PREFIX}${requestKey}`,
      ),
    [currentUserId, requestKey],
  );
  const [resolvedResponseState, setResolvedResponseState] = useState<{
    requestKey: string;
    response: import('@/types/admin').SafetyAdminHeadquarterListResponse;
  } | null>(null);
  const [lastStableResponse, setLastStableResponse] =
    useState<import('@/types/admin').SafetyAdminHeadquarterListResponse | null>(null);
  const currentResponse = useMemo(
    () =>
      (resolvedResponseState?.requestKey === requestKey ? resolvedResponseState.response : null) ??
      cachedResponse.value ??
      resolvedResponseState?.response ??
      lastStableResponse ??
      null,
    [cachedResponse.value, lastStableResponse, requestKey, resolvedResponseState],
  );
  const rows = currentResponse?.rows ?? EMPTY_HEADQUARTER_ROWS;
  const total = currentResponse?.total ?? 0;
  const resolvedSelectedHeadquarter = useMemo(
    () =>
      selectedHeadquarterId && selectedHeadquarter?.id === selectedHeadquarterId
        ? selectedHeadquarter
        : null,
    [selectedHeadquarter, selectedHeadquarterId],
  );
  const resolvedSelectedHeadquarterSites = useMemo(
    () =>
      selectedHeadquarterId
        ? selectedHeadquarterSites.filter((site) => site.headquarter_id === selectedHeadquarterId)
        : [],
    [selectedHeadquarterId, selectedHeadquarterSites],
  );
  const resolvedSelectedSite = useMemo(
    () =>
      (selectedSiteId
        ? resolvedSelectedHeadquarterSites.find((site) => site.id === selectedSiteId) ?? null
        : null) ??
      (selectedSiteId && selectedSite?.id === selectedSiteId ? selectedSite : null),
    [resolvedSelectedHeadquarterSites, selectedSite, selectedSiteId],
  );
  const isLoadingSelectedSite = Boolean(selectedSiteId && !resolvedSelectedSite);

  const refreshHeadquarterList = async (targetPage = state.page) => {
    const targetRequestKey = buildRequestKey({
      page: targetPage,
      query: state.query.trim(),
      sort: state.sort,
    });
    const response = await fetchAdminHeadquartersList({
      limit: HEADQUARTERS_PAGE_SIZE,
      offset: (targetPage - 1) * HEADQUARTERS_PAGE_SIZE,
      query: state.query.trim(),
      sortBy: state.sort.key,
      sortDir: state.sort.direction,
    });
    writeAdminSessionCache(
      currentUserId,
      `${HEADQUARTER_LIST_CACHE_KEY_PREFIX}${targetRequestKey}`,
      response,
    );
    setResolvedResponseState({
      requestKey: targetRequestKey,
      response,
    });
  };

  const refreshSelectedSiteDetail = async (
    siteId = selectedSiteId,
    fallbackSite: import('@/types/backend').SafetySite | null = null,
  ) => {
    if (!siteId) {
      selectedSiteRequestIdRef.current += 1;
      setSelectedSite(null);
      return;
    }
    const requestId = selectedSiteRequestIdRef.current + 1;
    selectedSiteRequestIdRef.current = requestId;
    const optimisticSite = fallbackSite ?? (selectedSite?.id === siteId ? selectedSite : null);
    setSelectedSite(optimisticSite);
    const response = await fetchAdminSitesList({ limit: 1, offset: 0, siteId });
    if (selectedSiteRequestIdRef.current !== requestId) {
      return;
    }
    const nextSite = response.rows[0] ?? null;
    setSelectedSite(nextSite);
    if (!nextSite) {
      onClearSiteSelection();
    }
  };

  const refreshSelectedHeadquarterContext = async (headquarterId = selectedHeadquarterId) => {
    if (!headquarterId) {
      setSelectedHeadquarter(null);
      setSelectedHeadquarterSites([]);
      await refreshSelectedSiteDetail(null);
      return;
    }
    const [headquarterResponse, siteResponse] = await Promise.all([
      fetchAdminHeadquartersList({ id: headquarterId, limit: 1, offset: 0 }),
      fetchAdminSitesList({
        headquarterId,
        limit: 5000,
        offset: 0,
        sortBy: 'last_visit_date',
        sortDir: 'desc',
      }),
    ]);
    setSelectedHeadquarter(headquarterResponse.rows[0] ?? null);
    setSelectedHeadquarterSites(siteResponse.rows);
    const matchedSelectedSite = selectedSiteId
      ? siteResponse.rows.find((site) => site.id === selectedSiteId) ?? null
      : null;
    await refreshSelectedSiteDetail(selectedSiteId, matchedSelectedSite);
  };

  useEffect(() => {
    if (!selectedSiteId || selectedHeadquarterId) {
      setIsResolvingSiteContext(false);
      return;
    }

    let cancelled = false;
    setIsResolvingSiteContext(true);

    void fetchAdminSitesList({ limit: 1, offset: 0, siteId: selectedSiteId })
      .then((response) => {
        if (cancelled) return;

        const matchedSite =
          response.rows.find((site) => site.id === selectedSiteId) ?? response.rows[0] ?? null;
        const restoredHeadquarterId = String(matchedSite?.headquarter_id ?? '').trim();

        if (restoredHeadquarterId) {
          router.replace(
            getAdminSectionHref('headquarters', {
              editSiteId: autoEditSiteId,
              headquarterId: restoredHeadquarterId,
              siteId: selectedSiteId,
              siteStatus: siteStatusParam,
            }),
          );
          return;
        }

        router.replace(
          getAdminSectionHref('headquarters', {
            editSiteId: autoEditSiteId,
            siteStatus: siteStatusParam,
          }),
        );
        setIsResolvingSiteContext(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to restore headquarters site context', error);
        router.replace(
          getAdminSectionHref('headquarters', {
            editSiteId: autoEditSiteId,
            siteStatus: siteStatusParam,
          }),
        );
        setIsResolvingSiteContext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [autoEditSiteId, router, selectedHeadquarterId, selectedSiteId, siteStatusParam]);

  useEffect(() => {
    if (cachedResponse.isFresh && cachedResponse.value) {
      queueMicrotask(() => {
        setIsLoading(false);
      });
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);

    void fetchAdminHeadquartersList(
      {
        limit: HEADQUARTERS_PAGE_SIZE,
        offset: (state.page - 1) * HEADQUARTERS_PAGE_SIZE,
        query: state.query.trim(),
        sortBy: state.sort.key,
        sortDir: state.sort.direction,
      },
      { signal: abortController.signal },
    )
      .then((response) => {
        writeAdminSessionCache(
          currentUserId,
          `${HEADQUARTER_LIST_CACHE_KEY_PREFIX}${requestKey}`,
          response,
        );
        setResolvedResponseState({
          requestKey,
          response,
        });
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          console.error('Failed to load headquarters list', error);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => abortController.abort();
  }, [
    cachedResponse.isFresh,
    cachedResponse.value,
    currentUserId,
    requestKey,
    state.page,
    state.query,
    state.sort.direction,
    state.sort.key,
  ]);

  useEffect(() => {
    if (!selectedHeadquarterId) {
      selectedHeadquarterRequestIdRef.current += 1;
      setSelectedHeadquarter(null);
      setSelectedHeadquarterSites([]);
      return;
    }
    const requestId = selectedHeadquarterRequestIdRef.current + 1;
    selectedHeadquarterRequestIdRef.current = requestId;
    setSelectedHeadquarter(null);
    setSelectedHeadquarterSites([]);
    void Promise.all([
      fetchAdminHeadquartersList({ id: selectedHeadquarterId, limit: 1, offset: 0 }),
      fetchAdminSitesList({
        headquarterId: selectedHeadquarterId,
        limit: 5000,
        offset: 0,
        sortBy: 'last_visit_date',
        sortDir: 'desc',
      }),
    ])
      .then(([headquarterResponse, siteResponse]) => {
        if (selectedHeadquarterRequestIdRef.current !== requestId) {
          return;
        }
        setSelectedHeadquarter(headquarterResponse.rows[0] ?? null);
        setSelectedHeadquarterSites(siteResponse.rows);
      })
      .catch((error) => {
        if (selectedHeadquarterRequestIdRef.current !== requestId) {
          return;
        }
        console.error('Failed to load selected headquarter context', error);
      });
  }, [selectedHeadquarterId]);

  useEffect(() => {
    if (!selectedSiteId) {
      selectedSiteRequestIdRef.current += 1;
      setSelectedSite(null);
      return;
    }
    const matchedSite =
      resolvedSelectedHeadquarterSites.find((site) => site.id === selectedSiteId) ?? null;
    const requestId = selectedSiteRequestIdRef.current + 1;
    selectedSiteRequestIdRef.current = requestId;
    setSelectedSite(matchedSite);
    void fetchAdminSitesList({ limit: 1, offset: 0, siteId: selectedSiteId })
      .then((response) => {
        if (selectedSiteRequestIdRef.current !== requestId) {
          return;
        }
        const nextSite =
          response.rows.find((site) => site.id === selectedSiteId) ?? response.rows[0] ?? matchedSite;
        setSelectedSite(nextSite);
        if (!nextSite) {
          onClearSiteSelection();
        }
      })
      .catch((error) => {
        if (selectedSiteRequestIdRef.current !== requestId) {
          return;
        }
        console.error('Failed to load selected site detail', error);
      });
  }, [onClearSiteSelection, resolvedSelectedHeadquarterSites, selectedSiteId]);

  const siteStatusFilter = useMemo(() => {
    const value = siteStatusParam;
    return value === 'all' || value === 'planned' || value === 'active' || value === 'closed'
      ? (value as 'all' | SafetySiteStatus)
      : 'all';
  }, [siteStatusParam]);
  const hasSiteStatusScope = searchParams.has('siteStatus');
  const siteStatusTitle =
    siteStatusFilter === 'all' ? '현장 목록' : `${getSiteStatusLabel(siteStatusFilter)} 현장`;
  const totalPages = Math.max(1, Math.ceil(total / HEADQUARTERS_PAGE_SIZE));

  if (
    isResolvingSiteContext ||
    isLoadingSelectedSite ||
    (isLoading && rows.length === 0 && !resolvedSelectedHeadquarter && !hasSiteStatusScope)
  ) {
    return (
      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>사업장</h2>
            <div className={styles.sectionHeaderMeta}>사업장과 현장 목록을 불러오는 중입니다.</div>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.contentTableSkeleton} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`headquarters-skeleton-${index + 1}`} className={styles.contentTableSkeletonRow}>
                <span className={styles.contentTableSkeletonLine} />
                <span className={`${styles.contentTableSkeletonLine} ${styles.contentTableSkeletonLineMedium}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const submit = async () => {
    try {
      if (state.editingId === 'create' && !state.isCreateReady) return;
      if (state.editingId !== 'create' && !state.form.name.trim()) return;
      const validationMessage = validateHeadquarterSubmit(state.form, rows, state.editingId);
      if (validationMessage) {
        window.alert(validationMessage);
        return;
      }
      const payload = state.buildPayload();
      if (state.editingId === 'create') {
        await onCreate(payload);
      } else if (state.editingId) {
        await onUpdate(state.editingId, payload);
      }
      state.closeModal();
      await refreshHeadquarterList();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '사업장 저장에 실패했습니다.');
    }
  };

  const handleDeleteHeadquarter = async (item: import('@/types/controller').SafetyHeadquarter) => {
    const confirmed = window.confirm(
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정 정보도 함께 정리되고, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;
    await onDelete(item.id);
    await refreshHeadquarterList();
  };

  const handleCreateSite = async (input: SafetySiteInput) => {
    const createdSite = await onCreateSite(input);
    await refreshSelectedHeadquarterContext(input.headquarter_id);
    return createdSite;
  };

  const handleUpdateSite = async (id: string, input: SafetySiteUpdateInput) => {
    await onUpdateSite(id, input);
    await refreshSelectedHeadquarterContext(input.headquarter_id ?? selectedHeadquarterId);
  };

  const handleDeleteSite = async (id: string) => {
    await onDeleteSite(id);
    await refreshSelectedHeadquarterContext();
  };

  return (
    <div className={styles.drilldownStack}>
      {!selectedHeadquarter && !hasSiteStatusScope ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <HeadquartersTable
            busy={busy || isLoading}
            canDelete={canDelete}
            filteredHeadquarters={rows}
            page={state.page}
            onCreateRequest={state.openCreate}
            onDeleteRequest={handleDeleteHeadquarter}
            onEditRequest={state.openEdit}
            onExportRequest={() => {
              void (async () => {
                const response = await fetchAdminHeadquartersList({
                  limit: 5000,
                  offset: 0,
                  query: state.query.trim(),
                  sortBy: state.sort.key,
                  sortDir: state.sort.direction,
                });
                const { exportAdminWorkbook } = await import('@/lib/admin/exportClient');
                void exportAdminWorkbook('headquarters', [
                  {
                    name: '사업장',
                    columns: [
                      { key: 'name', label: '회사명' },
                      { key: 'site_count', label: '현장 수' },
                      { key: 'management_number', label: '사업장관리번호' },
                      { key: 'opening_number', label: '사업장개시번호' },
                      { key: 'business_registration_no', label: '사업자등록번호' },
                      { key: 'corporate_registration_no', label: '법인등록번호' },
                      { key: 'license_no', label: '건설업면허/등록번호' },
                      { key: 'contact_name', label: '본사 대표자명' },
                      { key: 'contact_phone', label: '대표 전화' },
                      { key: 'address', label: '본사 주소' },
                      { key: 'memo', label: '운영 메모' },
                      { key: 'updated_at', label: '수정일' },
                    ],
                    rows: response.rows.map((item) => ({
                      address: item.address || '',
                      business_registration_no: item.business_registration_no || '',
                      contact_name: item.contact_name || '',
                      contact_phone: item.contact_phone || '',
                      corporate_registration_no: item.corporate_registration_no || '',
                      license_no: item.license_no || '',
                      management_number: item.management_number || '',
                      memo: item.memo || '',
                      name: item.name,
                      opening_number: item.opening_number || '',
                      site_count: item.site_count ?? 0,
                      updated_at: item.updated_at,
                    })),
                  },
                ]);
              })();
            }}
            onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
            onPageChange={(nextPage) => {
              if (currentResponse) {
                setLastStableResponse(currentResponse);
              }
              state.setPage(nextPage);
            }}
            onQueryChange={state.setQueryInput}
            onQuerySubmit={state.submitQuery}
            onSortChange={state.setSort}
            query={state.queryInput}
            sort={state.sort}
            totalCount={total}
            totalPages={totalPages}
          />
        </section>
      ) : !resolvedSelectedHeadquarter ? (
        <SitesSection
          autoEditSiteId={autoEditSiteId}
          busy={busy}
          canDelete={canDelete}
          currentUserId={currentUserId}
          emptyMessage="조건에 맞는 현장이 없습니다."
          initialStatusFilter={siteStatusFilter}
          onAssignFieldAgent={onAssignFieldAgent}
          onCreate={handleCreateSite}
          onDelete={handleDeleteSite}
          onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
          onUnassignFieldAgent={onUnassignFieldAgent}
          onUpdate={handleUpdateSite}
          showHeader
          title={siteStatusTitle}
          titleActionHref={getAdminSectionHref('headquarters')}
          titleActionLabel="사업장 목록 보기"
        />
      ) : resolvedSelectedSite ? (
        <SiteManagementMainPanel
          headquarter={resolvedSelectedHeadquarter}
          site={resolvedSelectedSite}
        />
      ) : (
        <>
          <HeadquarterSummaryPanel
            headquarter={resolvedSelectedHeadquarter}
            sites={resolvedSelectedHeadquarterSites}
            onEdit={() => state.openEdit(resolvedSelectedHeadquarter)}
          />
          <SitesSection
            autoEditSiteId={autoEditSiteId}
            busy={busy}
            canDelete={canDelete}
            currentUserId={currentUserId}
            emptyMessage="등록된 현장이 없습니다."
            initialStatusFilter="all"
            lockedHeadquarterId={resolvedSelectedHeadquarter.id}
            onAssignFieldAgent={onAssignFieldAgent}
            onCreate={handleCreateSite}
            onDelete={handleDeleteSite}
            onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
            onUnassignFieldAgent={onUnassignFieldAgent}
            onUpdate={handleUpdateSite}
            showHeader={false}
          />
        </>
      )}

      <HeadquarterEditorModal
        busy={busy}
        canSubmit={state.isCreateReady}
        editingId={state.editingId}
        form={state.form}
        onClose={state.closeModal}
        onFormChange={state.setForm}
        onSubmit={() => void submit()}
        open={state.isOpen}
      />
    </div>
  );
}
