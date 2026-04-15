'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import { fetchAdminHeadquartersList, fetchAdminSitesList } from '@/lib/admin/apiClient';
import { getSiteStatusLabel } from '@/lib/admin';
import type {
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteStatus,
  SafetySiteUpdateInput,
} from '@/types/controller';
import { HeadquarterSummaryPanel } from './HeadquarterSummaryPanel';
import { SiteManagementMainPanel } from './SiteManagementMainPanel';
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';
import { SitesSection } from '../sites/SitesSection';

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
    ['본사 담당자명', form.contact_name, 100],
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
  onCreateSite: (input: SafetySiteInput) => Promise<void>;
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
  const {
    busy,
    canDelete,
    currentUserId,
    selectedHeadquarterId,
    selectedSiteId,
    onAssignFieldAgent,
    onClearHeadquarterSelection,
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
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<import('@/types/controller').SafetyHeadquarter[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    completedCount: 0,
    contactGapCount: 0,
    memoGapCount: 0,
    registrationGapCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHeadquarter, setSelectedHeadquarter] =
    useState<import('@/types/controller').SafetyHeadquarter | null>(null);
  const [selectedSite, setSelectedSite] = useState<import('@/types/backend').SafetySite | null>(null);
  const [selectedHeadquarterSites, setSelectedHeadquarterSites] = useState<
    import('@/types/backend').SafetySite[]
  >([]);
  const state = useHeadquartersSectionState(rows, busy);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        page: state.page,
        query: state.query.trim(),
        sort: state.sort,
      }),
    [state.page, state.query, state.sort],
  );

  const refreshHeadquarterList = async (targetPage = state.page) => {
    const response = await fetchAdminHeadquartersList({
      limit: 30,
      offset: (targetPage - 1) * 30,
      query: state.query.trim(),
      sortBy: state.sort.key,
      sortDir: state.sort.direction,
    });
    writeAdminSessionCache(currentUserId, `headquarters:list:${requestKey}`, response);
    setRows(response.rows);
    setTotal(response.total);
    setSummary(response.summary);
  };

  useEffect(() => {
    const cached = readAdminSessionCache<import('@/types/admin').SafetyAdminHeadquarterListResponse>(
      currentUserId,
      `headquarters:list:${requestKey}`,
    );
    if (cached.value) {
      setRows(cached.value.rows);
      setTotal(cached.value.total);
      setSummary(cached.value.summary);
    }
    if (cached.isFresh && cached.value) {
      setIsLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);

    void fetchAdminHeadquartersList(
      {
        limit: 30,
        offset: (state.page - 1) * 30,
        query: state.query.trim(),
        sortBy: state.sort.key,
        sortDir: state.sort.direction,
      },
      { signal: abortController.signal },
    )
      .then((response) => {
        writeAdminSessionCache(currentUserId, `headquarters:list:${requestKey}`, response);
        setRows(response.rows);
        setTotal(response.total);
        setSummary(response.summary);
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
  }, [currentUserId, requestKey, state.page, state.query, state.sort.direction, state.sort.key]);

  useEffect(() => {
    if (!selectedHeadquarterId) {
      setSelectedHeadquarter(null);
      setSelectedHeadquarterSites([]);
      return;
    }
    void fetchAdminHeadquartersList({ id: selectedHeadquarterId, limit: 1, offset: 0 }).then((response) => {
      setSelectedHeadquarter(response.rows[0] ?? null);
    });
    void fetchAdminSitesList({
      headquarterId: selectedHeadquarterId,
      limit: 5000,
      offset: 0,
      sortBy: 'last_visit_date',
      sortDir: 'desc',
    }).then((response) => {
      setSelectedHeadquarterSites(response.rows);
    });
  }, [selectedHeadquarterId]);

  useEffect(() => {
    if (!selectedSiteId) {
      setSelectedSite(null);
      return;
    }
    void fetchAdminSitesList({ limit: 1, offset: 0, siteId: selectedSiteId }).then((response) => {
      setSelectedSite(response.rows[0] ?? null);
    });
  }, [selectedSiteId]);

  const siteStatusFilter = useMemo(() => {
    const value = searchParams.get('siteStatus');
    return value === 'all' || value === 'planned' || value === 'active' || value === 'closed'
      ? (value as 'all' | SafetySiteStatus)
      : 'all';
  }, [searchParams]);
  const hasSiteStatusScope = searchParams.has('siteStatus');
  const autoEditSiteId = searchParams.get('editSiteId');
  const siteStatusTitle =
    siteStatusFilter === 'all' ? '현장 목록' : `${getSiteStatusLabel(siteStatusFilter)} 현장`;
  const totalPages = Math.max(1, Math.ceil(total / 30));

  if (isLoading && rows.length === 0 && !selectedHeadquarter && !hasSiteStatusScope) {
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
  };

  const handleDeleteHeadquarter = async (item: import('@/types/controller').SafetyHeadquarter) => {
    const confirmed = window.confirm(
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정 정보도 함께 정리되고, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;
    await onDelete(item.id);
    await refreshHeadquarterList();
  };

  return (
    <div className={styles.drilldownStack}>
      {!selectedHeadquarter && !hasSiteStatusScope ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <HeadquartersTable
            busy={busy || isLoading}
            canDelete={canDelete}
            filteredHeadquarters={rows}
            summary={summary}
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
                      { key: 'management_number', label: '사업장관리번호' },
                      { key: 'opening_number', label: '사업장개시번호' },
                      { key: 'business_registration_no', label: '사업자등록번호' },
                      { key: 'corporate_registration_no', label: '법인등록번호' },
                      { key: 'license_no', label: '건설업면허/등록번호' },
                      { key: 'contact_name', label: '본사 담당자명' },
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
                      updated_at: item.updated_at,
                    })),
                  },
                ]);
              })();
            }}
            onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
            onPageChange={state.setPage}
            onQueryChange={state.setQuery}
            onSortChange={state.setSort}
            query={state.query}
            sort={state.sort}
            totalCount={total}
            totalPages={totalPages}
          />
        </section>
      ) : !selectedHeadquarter ? (
        <SitesSection
          autoEditSiteId={autoEditSiteId}
          busy={busy}
          canDelete={canDelete}
          currentUserId={currentUserId}
          emptyMessage="조건에 맞는 현장이 없습니다."
          initialStatusFilter={siteStatusFilter}
          onAssignFieldAgent={onAssignFieldAgent}
          onCreate={onCreateSite}
          onDelete={onDeleteSite}
          onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
          onUnassignFieldAgent={onUnassignFieldAgent}
          onUpdate={onUpdateSite}
          showHeader
          showHeadquarterColumn
          title={siteStatusTitle}
        />
      ) : selectedSite ? (
        <>
          <HeadquarterSummaryPanel
            headquarter={selectedHeadquarter}
            sites={selectedHeadquarterSites}
            onEdit={() => state.openEdit(selectedHeadquarter)}
          />
          <SiteManagementMainPanel
            headquarter={selectedHeadquarter}
            site={selectedSite}
          />
          <SitesSection
            autoEditSiteId={autoEditSiteId}
            busy={busy}
            canDelete={canDelete}
            currentUserId={currentUserId}
            emptyMessage="등록된 현장이 없습니다."
            initialStatusFilter="all"
            lockedHeadquarterId={selectedHeadquarter.id}
            onAssignFieldAgent={onAssignFieldAgent}
            onCreate={onCreateSite}
            onDelete={onDeleteSite}
            onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
            onUnassignFieldAgent={onUnassignFieldAgent}
            onUpdate={onUpdateSite}
            showHeadquarterColumn={false}
            showHeader={false}
          />
        </>
      ) : (
        <>
          <HeadquarterSummaryPanel
            headquarter={selectedHeadquarter}
            sites={selectedHeadquarterSites}
            onEdit={() => state.openEdit(selectedHeadquarter)}
          />
          <SitesSection
            autoEditSiteId={autoEditSiteId}
            busy={busy}
            canDelete={canDelete}
            currentUserId={currentUserId}
            emptyMessage="등록된 현장이 없습니다."
            initialStatusFilter="all"
            lockedHeadquarterId={selectedHeadquarter.id}
            onAssignFieldAgent={onAssignFieldAgent}
            onCreate={onCreateSite}
            onDelete={onDeleteSite}
            onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
            onUnassignFieldAgent={onUnassignFieldAgent}
            onUpdate={onUpdateSite}
            showHeadquarterColumn={false}
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
