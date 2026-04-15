'use client';

import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  downloadAdminSiteBasicMaterial,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import { normalizeSiteStatusForDisplay, getSiteStatusLabel } from '@/lib/admin';
import {
  fetchAdminDirectoryLookups,
  fetchAdminSitesList,
} from '@/lib/admin/apiClient';
import {
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/features/admin/lib/adminSessionCache';
import {
  EMPTY_FORM,
  buildSitePayload,
  createEditForm,
  isCreateReady,
  type SiteAssignmentFilter,
  type SiteFormState,
  type SitesSectionProps,
} from './siteSectionHelpers';
import type { TableSortState } from '@/types/admin';
import type { SafetySiteStatus, SafetySiteInput, SafetySiteUpdateInput } from '@/types/controller';
import type { SafetySite } from '@/types/backend';

const SITES_PAGE_SIZE = 50;

function normalizeSiteValue(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function validateSiteSubmit(
  form: SiteFormState,
  sites: SafetySite[],
  editingId: string | null,
) {
  const maxLengthChecks: Array<[string, string, number]> = [
    ['현장명', form.site_name, 200],
    ['현장코드', form.site_code, 100],
    ['현장관리번호', form.management_number, 100],
    ['노동관서', form.labor_office, 200],
    ['지도지원원', form.guidance_officer_name, 100],
    ['현장소장명', form.manager_name, 100],
    ['현장소장 연락처', form.manager_phone, 50],
    ['현장대리인 메일', form.site_contact_email, 200],
    ['발주자 사업장관리번호', form.client_management_number, 100],
    ['발주자 사업장명', form.client_business_name, 200],
    ['발주처 대표자', form.client_representative_name, 100],
    ['발주처 법인등록번호', form.client_corporate_registration_no, 50],
    ['발주처 사업자등록번호', form.client_business_registration_no, 50],
    ['발주유형구분', form.order_type_division, 100],
    ['기술지도 구분', form.technical_guidance_kind, 100],
    ['계약담당자', form.contract_contact_name, 100],
    ['점검자', form.inspector_name, 100],
  ];

  for (const [label, value, maxLength] of maxLengthChecks) {
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      return `${label}은(는) ${maxLength}자 이하로 입력해 주세요.`;
    }
  }

  const duplicateSiteCode = normalizeSiteValue(form.site_code);
  if (
    duplicateSiteCode &&
    sites.some((site) => site.id !== editingId && normalizeSiteValue(site.site_code) === duplicateSiteCode)
  ) {
    return `현장코드 '${form.site_code.trim()}'는 이미 다른 현장에서 사용 중입니다.`;
  }

  return null;
}

export function useSitesSectionState({
  autoEditSiteId = null,
  busy,
  currentUserId,
  initialStatusFilter = 'all',
  lockedHeadquarterId = null,
  onCreate,
  onDelete,
  onSelectSiteEntry,
  onUpdate,
  onAssignFieldAgent,
  onUnassignFieldAgent,
}: Pick<
  SitesSectionProps,
  | 'autoEditSiteId'
  | 'busy'
  | 'currentUserId'
  | 'initialStatusFilter'
  | 'lockedHeadquarterId'
  | 'onAssignFieldAgent'
  | 'onCreate'
  | 'onDelete'
  | 'onSelectSiteEntry'
  | 'onUnassignFieldAgent'
  | 'onUpdate'
>) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assignmentSiteId, setAssignmentSiteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | SafetySiteStatus>(initialStatusFilter);
  const [sort, setSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'last_visit_date',
  });
  const [assignmentFilter, setAssignmentFilter] = useState<SiteAssignmentFilter>('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastAutoEditSiteId, setLastAutoEditSiteId] = useState<string | null>(null);
  const [rows, setRows] = useState<SafetySite[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [directoryLookups, setDirectoryLookups] = useState<
    import('@/types/admin').SafetyAdminDirectoryLookupsResponse
  >({
    headquarters: [],
    sites: [],
    users: [],
  });
  const deferredQuery = useDeferredValue(query);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestKey = useMemo(
    () =>
      JSON.stringify({
        assignmentFilter,
        headquarterId: lockedHeadquarterId,
        page,
        query: deferredQuery.trim(),
        sort,
        statusFilter,
      }),
    [assignmentFilter, deferredQuery, lockedHeadquarterId, page, sort, statusFilter],
  );

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    const cachedLookups = readAdminSessionCache<import('@/types/admin').SafetyAdminDirectoryLookupsResponse>(
      currentUserId,
      'directory-lookups',
    );
    if (cachedLookups.value) {
      setDirectoryLookups(cachedLookups.value);
    }
    if (cachedLookups.isFresh && cachedLookups.value) {
      return;
    }
    void fetchAdminDirectoryLookups()
      .then((response) => {
        writeAdminSessionCache(currentUserId, 'directory-lookups', response);
        setDirectoryLookups(response);
      })
      .catch((error) => {
        console.error('Failed to load admin directory lookups', error);
      });
  }, [currentUserId]);

  useEffect(() => {
    const cached = readAdminSessionCache<import('@/types/admin').SafetyAdminSiteListResponse>(
      currentUserId,
      `sites:list:${requestKey}`,
    );
    if (cached.value) {
      setRows(cached.value.rows);
      setTotal(cached.value.total);
    }
    if (cached.isFresh && cached.value) {
      setIsLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);

    void fetchAdminSitesList(
      {
        assignment: assignmentFilter,
        headquarterId: lockedHeadquarterId ?? '',
        limit: SITES_PAGE_SIZE,
        offset: (page - 1) * SITES_PAGE_SIZE,
        query: deferredQuery.trim(),
        sortBy: sort.key,
        sortDir: sort.direction,
        status: statusFilter,
      },
      { signal: abortController.signal },
    )
      .then((response) => {
        writeAdminSessionCache(currentUserId, `sites:list:${requestKey}`, response);
        setRows(response.rows);
        setTotal(response.total);
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          console.error('Failed to load sites list', error);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => abortController.abort();
  }, [assignmentFilter, currentUserId, deferredQuery, lockedHeadquarterId, page, requestKey, sort.direction, sort.key, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / SITES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const isOpen = editingId !== null;
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (assignmentFilter !== 'all' ? 1 : 0);
  const assignmentSite = rows.find((site) => site.id === assignmentSiteId) || null;
  const currentAssignedUserIds = assignmentSite
    ? assignmentSite.assigned_users?.map((user) => user.id) ??
      (assignmentSite.assigned_user ? [assignmentSite.assigned_user.id] : [])
    : [];

  const openCreate = () => {
    setEditingId('create');
    setForm({
      ...EMPTY_FORM,
      headquarter_id: lockedHeadquarterId ?? '',
    });
  };

  const openEdit = (site: SafetySite) => {
    setEditingId(site.id);
    setForm(createEditForm(site));
  };

  const closeModal = () => {
    if (busy) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    if (!autoEditSiteId || busy || lastAutoEditSiteId === autoEditSiteId) return;
    const matchedSite = rows.find((site) => site.id === autoEditSiteId);
    if (matchedSite) {
      openEdit(matchedSite);
      setLastAutoEditSiteId(autoEditSiteId);
      return;
    }
    void fetchAdminSitesList({
      headquarterId: lockedHeadquarterId ?? '',
      limit: 1,
      offset: 0,
      siteId: autoEditSiteId,
    }).then((response) => {
      const site = response.rows[0];
      if (!site) return;
      openEdit(site);
      setLastAutoEditSiteId(autoEditSiteId);
    });
  }, [autoEditSiteId, busy, lastAutoEditSiteId, lockedHeadquarterId, rows]);

  const refreshPage = async (targetPage = currentPage) => {
    const response = await fetchAdminSitesList({
      assignment: assignmentFilter,
      headquarterId: lockedHeadquarterId ?? '',
      limit: SITES_PAGE_SIZE,
      offset: (targetPage - 1) * SITES_PAGE_SIZE,
      query: deferredQuery.trim(),
      sortBy: sort.key,
      sortDir: sort.direction,
      status: statusFilter,
    });
    writeAdminSessionCache(currentUserId, `sites:list:${requestKey}`, response);
    setRows(response.rows);
    setTotal(response.total);
  };

  const submit = async () => {
    const payload = buildSitePayload(form, lockedHeadquarterId);
    if (editingId === 'create' && !isCreateReady(form, lockedHeadquarterId)) return;
    if (editingId !== 'create' && (!payload.headquarter_id || !payload.site_name)) return;
    const validationMessage = validateSiteSubmit(form, rows, editingId);
    if (validationMessage) {
      window.alert(validationMessage);
      return;
    }
    if (editingId === 'create') await onCreate(payload as SafetySiteInput);
    else if (editingId) await onUpdate(editingId, payload as SafetySiteUpdateInput);
    closeModal();
    await refreshPage();
  };

  const deleteSite = async (site: SafetySite) => {
    const confirmed = window.confirm(
      `'${site.site_name}' 현장을 삭제하시겠습니까?\n연결된 현장 배정 정보도 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) return;
    await onDelete(site.id);
    await refreshPage();
  };

  const openSiteEntry = (site: SafetySite) => {
    if (onSelectSiteEntry) {
      onSelectSiteEntry(site);
      return;
    }
    router.push(`/sites/${encodeURIComponent(site.id)}`);
  };

  const downloadBasicMaterial = async (site: SafetySite) => {
    try {
      await downloadAdminSiteBasicMaterial(site.id, `${site.site_name}-기초자료.xlsx`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '기초자료 출력에 실패했습니다.');
    }
  };

  const exportSites = async () => {
    const response = await fetchAdminSitesList({
      assignment: assignmentFilter,
      headquarterId: lockedHeadquarterId ?? '',
      limit: 5000,
      offset: 0,
      query: deferredQuery.trim(),
      sortBy: sort.key,
      sortDir: sort.direction,
      status: statusFilter,
    });

    return exportAdminWorkbook('sites', [
      {
        name: '현장',
        columns: [
          { key: 'site_name', label: '현장명' },
          { key: 'site_code', label: '현장코드' },
          { key: 'management_number', label: '현장관리번호' },
          { key: 'headquarter_name', label: '사업장' },
          { key: 'headquarter_management_number', label: '사업장관리번호' },
          { key: 'headquarter_opening_number', label: '사업장개시번호' },
          { key: 'labor_office', label: '노동관서' },
          { key: 'guidance_officer_name', label: '지도원' },
          { key: 'site_address', label: '소재지' },
          { key: 'project_kind', label: '공사종류' },
          { key: 'project_amount', label: '공사금액' },
          { key: 'status', label: '상태' },
        ],
        rows: response.rows.map((site) => ({
          guidance_officer_name: site.guidance_officer_name ?? '',
          headquarter_management_number: site.headquarter_detail?.management_number ?? '',
          headquarter_name: site.headquarter_detail?.name ?? site.headquarter?.name ?? '',
          headquarter_opening_number: site.headquarter_detail?.opening_number ?? '',
          labor_office: site.labor_office ?? '',
          management_number: site.management_number ?? '',
          project_amount: site.project_amount ?? '',
          project_kind: site.project_kind ?? '',
          site_address: site.site_address ?? '',
          site_code: site.site_code ?? '',
          site_name: site.site_name,
          status: getSiteStatusLabel(site.status),
        })),
      },
    ]);
  };

  const updateStatus = async (site: SafetySite, nextStatus: SafetySiteStatus) => {
    if (normalizeSiteStatusForDisplay(site.status) === nextStatus) return;
    await onUpdate(site.id, { status: nextStatus });
    await refreshPage();
  };

  const resetHeaderFilters = () => {
    setAssignmentFilter('all');
    setStatusFilter('all');
  };

  return {
    activeFilterCount,
    assignmentFilter,
    assignmentSite,
    closeModal,
    currentAssignedUserIds,
    currentPage,
    deleteSite,
    directoryLookups,
    downloadBasicMaterial,
    editingId,
    exportSites,
    form,
    headquarters: directoryLookups.headquarters,
    isCreateReady: isCreateReady(form, lockedHeadquarterId),
    isLoading,
    isOpen,
    lockedHeadquarterId,
    onAssignUser: async (siteId: string, userId: string) => {
      await onAssignFieldAgent(siteId, userId);
      await refreshPage();
    },
    onUnassignUser: async (siteId: string, userId: string) => {
      await onUnassignFieldAgent(siteId, userId);
      await refreshPage();
    },
    openAssignmentModal: (siteId: string) => setAssignmentSiteId(siteId),
    openCreate,
    openEdit,
    openSiteEntry,
    page: currentPage,
    pagedSites: rows,
    query,
    refreshPage,
    resetHeaderFilters,
    setAssignmentFilter: (value: SiteAssignmentFilter) => {
      setPage(1);
      setAssignmentFilter(value);
    },
    setAssignmentSiteId,
    setForm,
    setPage: (nextPage: number) => {
      setPage(Math.max(1, Math.min(nextPage, totalPages)));
    },
    setQuery: (value: string) => {
      setPage(1);
      setQuery(value);
    },
    setSort: (value: TableSortState) => {
      setPage(1);
      setSort(value);
    },
    setStatusFilter: (value: 'all' | SafetySiteStatus) => {
      setPage(1);
      setStatusFilter(value);
    },
    sort,
    sortedSites: rows,
    statusFilter,
    submit,
    total,
    totalPages,
    updateStatus,
    users: directoryLookups.users.map((user) => ({
      auto_provisioned_from_excel: false,
      created_at: '',
      email: user.email,
      id: user.id,
      is_active: user.isActive,
      last_login_at: null,
      name: user.name,
      organization_name: user.organizationName,
      phone: user.phone,
      position: user.position,
      role: user.role,
      updated_at: '',
    })),
  };
}
