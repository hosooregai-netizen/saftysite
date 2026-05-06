'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { SubmitSearchField } from '@/components/ui/SubmitSearchField';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { HeadquarterEditorModal } from '@/features/admin/sections/headquarters/HeadquarterEditorModal';
import { HeadquarterSummaryPanel } from '@/features/admin/sections/headquarters/HeadquarterSummaryPanel';
import { HeadquartersSection } from '@/features/admin/sections/headquarters/HeadquartersSection';
import { HeadquartersTable } from '@/features/admin/sections/headquarters/HeadquartersTable';
import {
  useHeadquartersSectionState,
} from '@/features/admin/sections/headquarters/useHeadquartersSectionState';
import { SiteManagementMainPanel } from '@/features/admin/sections/headquarters/SiteManagementMainPanel';
import { SiteEditorModal } from '@/features/admin/sections/sites/SiteEditorModal';
import { SitesFilterMenu } from '@/features/admin/sections/sites/SitesFilterMenu';
import { SitesTable } from '@/features/admin/sections/sites/SitesTable';
import {
  EMPTY_FORM as EMPTY_SITE_FORM,
  buildSitePayload,
  buildSiteSortComparator,
  isCreateReady as isSiteCreateReady,
  type SiteAssignmentFilter,
  type SiteFormState,
} from '@/features/admin/sections/sites/siteSectionHelpers';
import { getSiteStatusLabel } from '@/lib/admin';
import { fetchCurrentSafetyUser, SafetyApiError } from '@/lib/safetyApi';
import {
  createSafetyAssignment,
  createSafetyHeadquarter,
  createSafetySite,
  deactivateSafetyAssignment,
  deleteSafetyHeadquarter,
  deleteSafetySite,
  fetchSafetyAssignmentsPage,
  fetchSafetyHeadquarters,
  fetchSafetySitesAdmin,
  fetchSafetyUsers,
  updateSafetyAssignment,
  updateSafetyHeadquarter,
  updateSafetySite,
} from '@/lib/safetyApi/adminEndpoints';
import {
  bootstrapDemoSession,
  canUseWorkspaceServerApis,
  isAuthenticatedSession,
  type DemoSession,
} from '@/lib/reportApi';
import {
  readGuestWorkspaceCache,
  setGuestDirectoryCache,
} from '@/lib/guestWorkspaceCache';
import { beginGoogleWorkspaceAuth } from '@/lib/sessionAuthFlow';
import type { TableSortState } from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type {
  SafetyAssignment,
  SafetyHeadquarter,
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteStatus,
  SafetySiteUpdateInput,
} from '@/types/controller';

const HEADQUARTERS_PAGE_SIZE = 30;
const GUEST_SITES_PAGE_SIZE = 10;

function buildHeadquartersHref(
  scope: string | null,
  input: {
    editSiteId?: string | null;
    headquarterId?: string | null;
    siteId?: string | null;
    siteStatus?: string | null;
  },
) {
  const next = new URLSearchParams();
  if (scope) {
    next.set('scope', scope);
  }
  if (input.editSiteId) {
    next.set('editSiteId', input.editSiteId);
  }
  if (input.headquarterId) {
    next.set('headquarterId', input.headquarterId);
  }
  if (input.siteId) {
    next.set('siteId', input.siteId);
  }
  if (input.siteStatus) {
    next.set('siteStatus', input.siteStatus);
  }
  const query = next.toString();
  return query ? `/headquarters?${query}` : '/headquarters';
}

function buildPhotoAlbumHref(headquarterId?: string | null, siteId?: string | null) {
  const next = new URLSearchParams();
  if (headquarterId) {
    next.set('headquarterId', headquarterId);
  }
  if (siteId) {
    next.set('siteId', siteId);
  }
  const query = next.toString();
  return query ? `/photo-album?${query}` : '/photo-album';
}

function buildLoginRequiredHref(nextPath: string) {
  return `/account?auth=required&next=${encodeURIComponent(nextPath)}#account`;
}

function matchesHeadquarterQuery(
  headquarter: SafetyHeadquarter,
  sites: SafetySite[],
  query: string,
) {
  if (!query) return true;
  return [
    headquarter.name,
    headquarter.management_number,
    headquarter.opening_number,
    headquarter.business_registration_no,
    headquarter.corporate_registration_no,
    headquarter.contact_name,
    headquarter.contact_phone,
    headquarter.address,
    ...sites
      .filter((site) => site.headquarter_id === headquarter.id)
      .flatMap((site) => [site.site_name, site.site_address, site.manager_name]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function compareHeadquarters(
  left: SafetyHeadquarter,
  right: SafetyHeadquarter,
  sort: TableSortState,
) {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const leftCreated = left.created_at ?? '';
  const rightCreated = right.created_at ?? '';
  if (sort.key === 'name') {
    return left.name.localeCompare(right.name, 'ko') * direction;
  }
  return leftCreated.localeCompare(rightCreated) * direction;
}

function matchesSiteQuery(site: SafetySite, query: string) {
  if (!query) return true;
  return [
    site.site_name,
    site.site_address,
    site.manager_name,
    site.client_business_name,
    site.management_number,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function getGuestAuthModalPath(
  scope: string | null,
  selectedHeadquarterId: string | null,
  selectedSiteId: string | null,
  siteStatus: string | null,
) {
  return buildHeadquartersHref(scope, {
    headquarterId: selectedHeadquarterId,
    siteId: selectedSiteId,
    siteStatus,
  });
}

function normalizeGuestSiteStatus(
  value: string | null,
): 'all' | SafetySiteStatus {
  return value === 'planned' ||
    value === 'active' ||
    value === 'paused' ||
    value === 'closed' ||
    value === 'deleted' ||
    value === 'all'
    ? value
    : 'all';
}

function GuestDirectoryScreen({
  headquarters,
  onCreateHeadquarter,
  onCreateSite,
  onRequireLogin,
  scope,
  selectedHeadquarterId,
  selectedSiteId,
  siteStatus,
  sites,
  onSelectHeadquarter,
  onSelectSite,
}: {
  headquarters: SafetyHeadquarter[];
  onCreateHeadquarter: (input: SafetyHeadquarterInput) => Promise<SafetyHeadquarter>;
  onCreateSite: (input: SafetySiteInput) => Promise<SafetySite>;
  onRequireLogin: (reason: string) => void;
  scope: string | null;
  selectedHeadquarterId: string | null;
  selectedSiteId: string | null;
  siteStatus: string | null;
  sites: SafetySite[];
  onSelectHeadquarter: (headquarterId: string | null) => void;
  onSelectSite: (headquarterId: string, siteId: string | null) => void;
}) {
  const initialGuestSiteStatus = normalizeGuestSiteStatus(siteStatus);
  const [headquarterQueryInput, setHeadquarterQueryInput] = useState('');
  const [headquarterQuery, setHeadquarterQuery] = useState('');
  const [headquarterPage, setHeadquarterPage] = useState(1);
  const [headquarterSort, setHeadquarterSort] = useState<TableSortState>({
    direction: 'desc',
    key: 'created_at',
  });
  const [siteQueryInput, setSiteQueryInput] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  const [sitePage, setSitePage] = useState(1);
  const [siteSort, setSiteSort] = useState<TableSortState>({
    direction: 'asc',
    key: 'site_name',
  });
  const [siteStatusFilter, setSiteStatusFilter] =
    useState<'all' | SafetySiteStatus>(initialGuestSiteStatus);
  const [siteAssignmentFilter, setSiteAssignmentFilter] =
    useState<SiteAssignmentFilter>('all');
  const guestHeadquarterState = useHeadquartersSectionState(false);
  const [siteForm, setSiteForm] = useState<SiteFormState>(EMPTY_SITE_FORM);
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [guestMutationBusy, setGuestMutationBusy] = useState(false);

  const filteredHeadquarters = useMemo(() => {
    const normalizedQuery = headquarterQuery.trim().toLowerCase();
    return [...headquarters]
      .filter((headquarter) => matchesHeadquarterQuery(headquarter, sites, normalizedQuery))
      .sort((left, right) => compareHeadquarters(left, right, headquarterSort));
  }, [headquarterQuery, headquarterSort, headquarters, sites]);

  const headquarterTotalPages = Math.max(
    1,
    Math.ceil(filteredHeadquarters.length / HEADQUARTERS_PAGE_SIZE),
  );
  const currentHeadquarterPage = Math.min(headquarterPage, headquarterTotalPages);
  const pagedHeadquarters = filteredHeadquarters.slice(
    (currentHeadquarterPage - 1) * HEADQUARTERS_PAGE_SIZE,
    currentHeadquarterPage * HEADQUARTERS_PAGE_SIZE,
  );
  const selectedHeadquarter =
    filteredHeadquarters.find((item) => item.id === selectedHeadquarterId) ?? null;

  const headquarterSites = useMemo(() => {
    const normalizedQuery = siteQuery.trim().toLowerCase();
    const comparator = buildSiteSortComparator(
      siteSort,
      new Map<string, SafetyAssignment[]>(),
      new Map<string, SafetyUser>(),
    );
    const scopedSites = selectedHeadquarter
      ? sites.filter((site) => site.headquarter_id === selectedHeadquarter.id)
      : sites;
    return [...scopedSites]
      .filter((site) => (siteStatusFilter === 'all' ? true : site.status === siteStatusFilter))
      .filter((site) =>
        siteAssignmentFilter === 'unassigned'
          ? !site.assigned_user && !(site.assigned_users?.length ?? 0)
          : true,
      )
      .filter((site) => matchesSiteQuery(site, normalizedQuery))
      .sort(comparator);
  }, [selectedHeadquarter, siteAssignmentFilter, siteQuery, siteSort, siteStatusFilter, sites]);

  const showGlobalSiteList = Boolean(siteStatus) && !selectedHeadquarter;
  const visibleSiteRows = headquarterSites;
  const visibleSiteTitle =
    showGlobalSiteList && siteStatusFilter !== 'all'
      ? `${getSiteStatusLabel(siteStatusFilter)} 현장`
      : '현장 목록';
  const siteTotalPages = Math.max(1, Math.ceil(visibleSiteRows.length / GUEST_SITES_PAGE_SIZE));
  const currentSitePage = Math.min(sitePage, siteTotalPages);
  const pagedSites = visibleSiteRows.slice(
    (currentSitePage - 1) * GUEST_SITES_PAGE_SIZE,
    currentSitePage * GUEST_SITES_PAGE_SIZE,
  );
  const selectedSite = headquarterSites.find((site) => site.id === selectedSiteId) ?? null;
  const activeSiteFilterCount =
    (siteStatusFilter !== 'all' ? 1 : 0) + (siteAssignmentFilter !== 'all' ? 1 : 0);
  const currentPath = getGuestAuthModalPath(
    scope,
    selectedHeadquarterId,
    selectedSiteId,
    siteStatus,
  );

  const openGuestHeadquarterCreate = () => {
    guestHeadquarterState.openCreate();
  };

  const openGuestSiteCreate = () => {
    setSiteForm({
      ...EMPTY_SITE_FORM,
      headquarter_id: selectedHeadquarterId || '',
      client_business_name: selectedHeadquarter?.name ?? '',
      client_business_registration_no: selectedHeadquarter?.business_registration_no ?? '',
      client_corporate_registration_no: selectedHeadquarter?.corporate_registration_no ?? '',
      contract_contact_name: selectedHeadquarter?.contact_name ?? '',
      management_number: selectedHeadquarter?.management_number ?? '',
    });
    setSiteModalOpen(true);
  };

  const submitGuestHeadquarter = async () => {
    if (!guestHeadquarterState.form.name.trim()) {
      return;
    }
    setGuestMutationBusy(true);
    try {
      const created = await onCreateHeadquarter(guestHeadquarterState.buildPayload());
      guestHeadquarterState.closeModal();
      onSelectHeadquarter(created.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '건설사 추가에 실패했습니다.');
    } finally {
      setGuestMutationBusy(false);
    }
  };

  const submitGuestSite = async () => {
    if (!selectedHeadquarterId) {
      window.alert('현장을 추가할 건설사를 먼저 선택해 주세요.');
      return;
    }
    setGuestMutationBusy(true);
    try {
      const created = await onCreateSite(
        buildSitePayload(siteForm, selectedHeadquarterId) as SafetySiteInput,
      );
      setSiteModalOpen(false);
      setSiteForm(EMPTY_SITE_FORM);
      onSelectSite(created.headquarter_id, created.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '현장 추가에 실패했습니다.');
    } finally {
      setGuestMutationBusy(false);
    }
  };

  const guestModals = (
    <>
      <HeadquarterEditorModal
        busy={guestMutationBusy}
        canSubmit={Boolean(guestHeadquarterState.form.name.trim())}
        editingId={guestHeadquarterState.editingId}
        form={guestHeadquarterState.form}
        onClose={guestHeadquarterState.closeModal}
        onFormChange={guestHeadquarterState.setForm}
        onSubmit={submitGuestHeadquarter}
        open={guestHeadquarterState.isOpen}
      />
      <SiteEditorModal
        busy={guestMutationBusy}
        editingId={siteModalOpen ? 'create' : null}
        form={siteForm}
        headquarters={headquarters.map((item) => ({ id: item.id, name: item.name }))}
        isCreateReady={isSiteCreateReady(siteForm, selectedHeadquarterId || null)}
        lockedHeadquarterId={selectedHeadquarterId || null}
        onClose={() => {
          if (!guestMutationBusy) {
            setSiteModalOpen(false);
          }
        }}
        onCreateHeadquarter={onCreateHeadquarter}
        onSubmit={submitGuestSite}
        setForm={setSiteForm}
      />
    </>
  );

  if (selectedSite && selectedHeadquarter) {
    return (
      <>
        <div className={styles.drilldownStack}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitleBlock}>
              <button
                type="button"
                className={styles.sectionTitleInlineAction}
                onClick={() => onSelectSite(selectedHeadquarter.id, null)}
              >
                현장 목록으로
              </button>
            </div>
          </div>
          <SiteManagementMainPanel
            headquarter={selectedHeadquarter}
            photoHref={buildPhotoAlbumHref(selectedHeadquarter.id, selectedSite.id)}
            reportHref={`/reports/new?headquarterId=${encodeURIComponent(selectedHeadquarter.id)}&siteId=${encodeURIComponent(selectedSite.id)}`}
            site={selectedSite}
            siteEditHref={buildLoginRequiredHref(currentPath)}
          />
        </div>
        {guestModals}
      </>
    );
  }

  if (selectedHeadquarter) {
    return (
      <>
      <div className={styles.drilldownStack}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <button
              type="button"
              className={styles.sectionTitleInlineAction}
              onClick={() => onSelectHeadquarter(null)}
            >
              건설사 목록
            </button>
          </div>
        </div>

        <HeadquarterSummaryPanel
          headquarter={selectedHeadquarter}
          onEdit={() => onRequireLogin('건설사 수정')}
          onOpenAssignment={() => onRequireLogin('지도요원 배정')}
          sites={sites.filter((site) => site.headquarter_id === selectedHeadquarter.id)}
        />

        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderTitleBlock}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>현장 목록</h2>
                <Link
                  href={buildHeadquartersHref(scope, {})}
                  className={styles.sectionTitleInlineAction}
                >
                  건설사 목록
                </Link>
              </div>
            </div>
            <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
              <SubmitSearchField
                busy={false}
                buttonClassName={styles.sectionHeaderSearchButton}
                formClassName={`${styles.sectionHeaderSearchShell} ${styles.sectionHeaderToolbarSearch}`}
                inputClassName={`app-input ${styles.sectionHeaderSearchInput}`}
                onChange={setSiteQueryInput}
                onSubmit={() => {
                  setSiteQuery(siteQueryInput);
                  setSitePage(1);
                }}
                placeholder="현장명, 건설사, 사업장관리번호, 주소, 담당자로 검색"
                value={siteQueryInput}
              />
              <SitesFilterMenu
                activeCount={activeSiteFilterCount}
                assignmentFilter={siteAssignmentFilter}
                onAssignmentFilterChange={(value) => {
                  setSiteAssignmentFilter(value);
                  setSitePage(1);
                }}
                onReset={() => {
                  setSiteAssignmentFilter('all');
                  setSiteStatusFilter('all');
                  setSitePage(1);
                }}
                onStatusFilterChange={(value) => {
                  setSiteStatusFilter(value);
                  setSitePage(1);
                }}
                statusFilter={siteStatusFilter}
              />
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => onRequireLogin('현장 엑셀 내보내기')}
              >
                엑셀 내보내기
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={openGuestSiteCreate}
              >
                현장 추가
              </button>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.tableShell}>
              {visibleSiteRows.length === 0 ? (
                <div className={styles.tableEmpty}>등록된 현장이 없습니다.</div>
              ) : (
                <SitesTable
                  busy={false}
                  canDelete={false}
                  hasCustomEntry
                  onDeleteSite={() => onRequireLogin('현장 삭제')}
                  onDownloadBasicMaterial={() => onRequireLogin('기초자료 출력')}
                  onOpenAssignmentModal={() => onRequireLogin('지도요원 배정')}
                  onOpenEdit={() => onRequireLogin('현장 수정')}
                  onOpenSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
                  onPageChange={setSitePage}
                  onSortChange={(value) => {
                    setSiteSort(value);
                    setSitePage(1);
                  }}
                  page={currentSitePage}
                  sites={pagedSites}
                  sort={siteSort}
                  totalCount={visibleSiteRows.length}
                  totalPages={siteTotalPages}
                />
              )}
            </div>
          </div>
        </section>
      </div>
      {guestModals}
      </>
    );
  }

  if (showGlobalSiteList) {
    return (
      <>
      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderTitleBlock}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{visibleSiteTitle}</h2>
              <Link
                href={buildHeadquartersHref(scope, {})}
                className={styles.sectionTitleInlineAction}
              >
                건설사 목록 보기
              </Link>
            </div>
          </div>
          <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
            <SubmitSearchField
              busy={false}
              buttonClassName={styles.sectionHeaderSearchButton}
              formClassName={`${styles.sectionHeaderSearchShell} ${styles.sectionHeaderToolbarSearch}`}
              inputClassName={`app-input ${styles.sectionHeaderSearchInput}`}
              onChange={setSiteQueryInput}
              onSubmit={() => {
                setSiteQuery(siteQueryInput);
                setSitePage(1);
              }}
              placeholder="현장명, 건설사, 사업장관리번호, 주소, 담당자로 검색"
              value={siteQueryInput}
            />
            <SitesFilterMenu
              activeCount={activeSiteFilterCount}
              assignmentFilter={siteAssignmentFilter}
              onAssignmentFilterChange={(value) => {
                setSiteAssignmentFilter(value);
                setSitePage(1);
              }}
              onReset={() => {
                setSiteAssignmentFilter('all');
                setSiteStatusFilter(initialGuestSiteStatus);
                setSitePage(1);
              }}
              onStatusFilterChange={(value) => {
                setSiteStatusFilter(value);
                setSitePage(1);
              }}
              statusFilter={siteStatusFilter}
            />
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => onRequireLogin('현장 엑셀 내보내기')}
            >
              엑셀 내보내기
            </button>
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.tableShell}>
            {visibleSiteRows.length === 0 ? (
              <div className={styles.tableEmpty}>조건에 맞는 현장이 없습니다.</div>
            ) : (
              <SitesTable
                busy={false}
                canDelete={false}
                hasCustomEntry
                onDeleteSite={() => onRequireLogin('현장 삭제')}
                onDownloadBasicMaterial={() => onRequireLogin('기초자료 출력')}
                onOpenAssignmentModal={() => onRequireLogin('지도요원 배정')}
                onOpenEdit={() => onRequireLogin('현장 수정')}
                onOpenSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
                onPageChange={setSitePage}
                onSortChange={(value) => {
                  setSiteSort(value);
                  setSitePage(1);
                }}
                page={currentSitePage}
                sites={pagedSites}
                sort={siteSort}
                totalCount={visibleSiteRows.length}
                totalPages={siteTotalPages}
              />
            )}
          </div>
        </div>
      </section>
      {guestModals}
      </>
    );
  }

  return (
    <>
      <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
        <HeadquartersTable
          busy={false}
          canDelete={false}
          filteredHeadquarters={pagedHeadquarters}
          onCreateRequest={openGuestHeadquarterCreate}
          onDeleteRequest={() => onRequireLogin('건설사 삭제')}
          onEditRequest={() => onRequireLogin('건설사 수정')}
          onExportRequest={() => onRequireLogin('건설사 엑셀 내보내기')}
          onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
          onPageChange={setHeadquarterPage}
          onQueryChange={setHeadquarterQueryInput}
          onQuerySubmit={() => {
            setHeadquarterQuery(headquarterQueryInput);
            setHeadquarterPage(1);
          }}
          onSortChange={(value) => {
            setHeadquarterSort(value);
            setHeadquarterPage(1);
          }}
          page={currentHeadquarterPage}
          photoAlbumHrefBuilder={(item) => buildPhotoAlbumHref(item.id, null)}
          query={headquarterQueryInput}
          sort={headquarterSort}
          titleActionHref={buildHeadquartersHref(scope, { siteStatus: 'all' })}
          totalCount={filteredHeadquarters.length}
          totalPages={headquarterTotalPages}
        />
      </section>
      {guestModals}
    </>
  );
}

export function HeadquartersHubScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = searchParams.get('scope');
  const siteStatus = searchParams.get('siteStatus');
  const [session, setSession] = useState<DemoSession | null>(null);
  const [currentUser, setCurrentUser] = useState<SafetyUser | null>(null);
  const [users, setUsers] = useState<SafetyUser[]>([]);
  const [headquarters, setHeadquarters] = useState<SafetyHeadquarter[]>([]);
  const [sites, setSites] = useState<SafetySite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedHeadquarterId, setSelectedHeadquarterId] = useState<string | null>(
    searchParams.get('headquarterId'),
  );
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    searchParams.get('siteId'),
  );
  const [loginGateReason, setLoginGateReason] = useState<string | null>(null);

  const currentPath = useMemo(
    () =>
      getGuestAuthModalPath(
        scope,
        selectedHeadquarterId,
        selectedSiteId,
        siteStatus,
      ),
    [scope, selectedHeadquarterId, selectedSiteId, siteStatus],
  );
  const hasAuthenticatedSession = Boolean(session && isAuthenticatedSession(session));
  const authenticatedSession = session && isAuthenticatedSession(session) ? session : null;
  const buildCurrentHeadquartersHref = useCallback(
    (input: {
      editSiteId?: string | null;
      headquarterId?: string | null;
      siteId?: string | null;
      siteStatus?: string | null;
    }) => buildHeadquartersHref(scope, input),
    [scope],
  );

  useEffect(() => {
    setSelectedHeadquarterId(searchParams.get('headquarterId'));
    setSelectedSiteId(searchParams.get('siteId'));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const cache = await readGuestWorkspaceCache();
        if (cancelled) return;
        setHeadquarters(cache.directory.headquarters);
        setSites(cache.directory.sites);

        const nextSession = await bootstrapDemoSession();
        if (cancelled) return;
        setSession(nextSession);

        if (!isAuthenticatedSession(nextSession)) {
          return;
        }

        const [nextCurrentUser, nextUsers, nextHeadquarters, nextSites] = await Promise.all([
          fetchCurrentSafetyUser(nextSession.token),
          fetchSafetyUsers(nextSession.token),
          fetchSafetyHeadquarters(nextSession.token),
          fetchSafetySitesAdmin(nextSession.token),
        ]);
        if (cancelled) return;
        setCurrentUser(nextCurrentUser);
        setUsers(nextUsers);
        setHeadquarters(nextHeadquarters);
        setSites(nextSites);
        await setGuestDirectoryCache({
          headquarters: nextHeadquarters,
          sites: nextSites,
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '건설사/현장 화면을 불러오지 못했습니다.');
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

  const handleSelectHeadquarter = useCallback(
    (headquarterId: string | null) => {
      setSelectedHeadquarterId(headquarterId);
      setSelectedSiteId(null);
      router.replace(
        buildCurrentHeadquartersHref({
          headquarterId,
          siteStatus,
        }),
      );
    },
    [buildCurrentHeadquartersHref, router, siteStatus],
  );

  const handleSelectSite = useCallback(
    (headquarterId: string, siteId: string | null) => {
      setSelectedHeadquarterId(headquarterId);
      setSelectedSiteId(siteId);
      router.replace(
        buildCurrentHeadquartersHref({
          headquarterId,
          siteId,
          siteStatus,
        }),
      );
    },
    [buildCurrentHeadquartersHref, router, siteStatus],
  );

  const requireLogin = useCallback((reason: string) => {
    setLoginGateReason(reason);
  }, []);

  const refreshGuestDirectory = useCallback(async (token: string) => {
    const [nextHeadquarters, nextSites] = await Promise.all([
      fetchSafetyHeadquarters(token),
      fetchSafetySitesAdmin(token),
    ]);
    setHeadquarters(nextHeadquarters);
    setSites(nextSites);
    await setGuestDirectoryCache({
      headquarters: nextHeadquarters,
      sites: nextSites,
    });
  }, []);

  const createGuestHeadquarter = useCallback(
    async (input: SafetyHeadquarterInput) => {
      if (session && canUseWorkspaceServerApis(session)) {
        const created = await createSafetyHeadquarter(session.token, input);
        await refreshGuestDirectory(session.token);
        return created;
      }

      const timestamp = new Date().toISOString();
      const created: SafetyHeadquarter = {
        id: `guest-hq-${Date.now()}`,
        name: input.name.trim(),
        management_number: input.management_number ?? null,
        opening_number: input.opening_number ?? null,
        business_registration_no: input.business_registration_no ?? null,
        corporate_registration_no: input.corporate_registration_no ?? null,
        license_no: input.license_no ?? null,
        contact_name: input.contact_name ?? null,
        contact_phone: input.contact_phone ?? null,
        address: input.address ?? null,
        memo: input.memo ?? null,
        is_active: input.is_active ?? true,
        lifecycle_status: input.lifecycle_status ?? 'active',
        site_count: 0,
        created_at: timestamp,
        updated_at: timestamp,
      };
      const nextHeadquarters = [created, ...headquarters];
      setHeadquarters(nextHeadquarters);
      await setGuestDirectoryCache({
        headquarters: nextHeadquarters,
        sites,
      });
      return created;
    },
    [headquarters, refreshGuestDirectory, session, sites],
  );

  const createGuestSite = useCallback(
    async (input: SafetySiteInput) => {
      if (session && canUseWorkspaceServerApis(session)) {
        const created = await createSafetySite(session.token, input);
        await refreshGuestDirectory(session.token);
        return created;
      }

      const timestamp = new Date().toISOString();
      const headquarter = headquarters.find((item) => item.id === input.headquarter_id) ?? null;
      const primaryManager = input.site_managers?.find((item) => item.is_primary) ?? input.site_managers?.[0] ?? null;
      const normalizedTotalRounds =
        typeof input.total_rounds === 'number' && input.total_rounds > 0
          ? input.total_rounds
          : 1;
      const created: SafetySite = {
        id: `guest-site-${Date.now()}`,
        headquarter_id: input.headquarter_id,
        headquarter: headquarter ? { id: headquarter.id, name: headquarter.name } : null,
        headquarter_detail: headquarter,
        assigned_user: null,
        assigned_users: [],
        active_assignment_count: 0,
        site_name: input.site_name,
        site_code: input.site_code ?? null,
        management_number: input.management_number ?? null,
        labor_office: input.labor_office ?? null,
        guidance_officer_name: input.guidance_officer_name ?? null,
        project_start_date: input.project_start_date ?? null,
        project_end_date: input.project_end_date ?? null,
        project_amount: input.project_amount ?? null,
        project_scale: input.project_scale ?? null,
        project_kind: input.project_kind ?? null,
        client_management_number: input.client_management_number ?? null,
        client_business_name: input.client_business_name ?? null,
        client_representative_name: input.client_representative_name ?? null,
        client_corporate_registration_no: input.client_corporate_registration_no ?? null,
        client_business_registration_no: input.client_business_registration_no ?? null,
        order_type_division: input.order_type_division ?? null,
        technical_guidance_kind: input.technical_guidance_kind ?? null,
        manager_name: input.manager_name ?? primaryManager?.name ?? null,
        inspector_name: input.inspector_name ?? null,
        contract_contact_name: input.contract_contact_name ?? null,
        manager_phone: input.manager_phone ?? primaryManager?.phone ?? null,
        site_contact_email: input.site_contact_email ?? primaryManager?.email ?? null,
        site_managers: input.site_managers ?? [],
        primary_site_manager: primaryManager,
        client_contacts: input.client_contacts ?? [],
        is_high_risk_site: input.is_high_risk_site ?? null,
        site_address: input.site_address ?? null,
        status: input.status ?? 'active',
        pause_start_date: input.pause_start_date ?? null,
        lifecycle_status: input.lifecycle_status ?? input.status ?? 'active',
        is_active: input.status !== 'deleted',
        memo: input.memo ?? null,
        contract_date: input.contract_date ?? null,
        contract_start_date: input.contract_start_date ?? null,
        contract_end_date: input.contract_end_date ?? null,
        contract_signed_date: input.contract_signed_date ?? null,
        contract_type: input.contract_type ?? null,
        contract_status: input.contract_status ?? null,
        total_rounds: normalizedTotalRounds,
        guidance_max_visit_round: null,
        per_visit_amount: input.per_visit_amount ?? null,
        total_contract_amount: input.total_contract_amount ?? null,
        last_visit_date: null,
        required_completion_fields: input.required_completion_fields ?? [],
        dispatch_policy: input.dispatch_policy ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      };
      const nextSites = [created, ...sites];
      const nextHeadquarters = headquarters.map((item) =>
        item.id === created.headquarter_id
          ? { ...item, site_count: (item.site_count ?? 0) + 1, updated_at: timestamp }
          : item,
      );
      setHeadquarters(nextHeadquarters);
      setSites(nextSites);
      await setGuestDirectoryCache({
        headquarters: nextHeadquarters,
        sites: nextSites,
      });
      return created;
    },
    [headquarters, refreshGuestDirectory, session, sites],
  );

  const assignFieldAgentToSite = useCallback(
    async (siteId: string, userId: string) => {
      if (!session || !isAuthenticatedSession(session)) {
        throw new Error('로그인 후 지도요원 배정을 사용할 수 있습니다.');
      }

      try {
        await createSafetyAssignment(session.token, {
          site_id: siteId,
          user_id: userId,
          role_on_site: '현장 지도요원',
        });
      } catch (error) {
        if (!(error instanceof SafetyApiError) || error.status !== 409) {
          throw error;
        }
        const assignments = await fetchSafetyAssignmentsPage(session.token, {
          activeOnly: false,
          limit: 500,
          siteId,
          userId,
        });
        const existing = assignments.find(
          (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
        );
        if (!existing) {
          throw error;
        }
        await updateSafetyAssignment(session.token, existing.id, {
          is_active: true,
          role_on_site: existing.role_on_site || '현장 지도요원',
        });
      }

      await refreshGuestDirectory(session.token);
    },
    [refreshGuestDirectory, session],
  );

  const unassignFieldAgentFromSite = useCallback(
    async (siteId: string, userId: string) => {
      if (!session || !isAuthenticatedSession(session)) {
        throw new Error('로그인 후 지도요원 배정 해제를 사용할 수 있습니다.');
      }

      const assignments = await fetchSafetyAssignmentsPage(session.token, {
        activeOnly: false,
        limit: 500,
        siteId,
        userId,
      });
      const activeAssignment = assignments.find(
        (assignment) => assignment.site_id === siteId && assignment.user_id === userId && assignment.is_active,
      );
      if (!activeAssignment) {
        return;
      }
      await deactivateSafetyAssignment(session.token, activeAssignment.id);
      await refreshGuestDirectory(session.token);
    },
    [refreshGuestDirectory, session],
  );

  if (isLoading) {
    return (
      <div className="erp-page">
        <section className="erp-panel">
          <h1 className="page-title">건설사/현장 화면을 불러오는 중입니다.</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="erp-page">
      {loadError ? <div className="row-meta">{loadError}</div> : null}

      {authenticatedSession && currentUser ? (
        <HeadquartersSection
          buildHeadquarterPhotoAlbumHref={(headquarterId) =>
            buildPhotoAlbumHref(headquarterId, null)
          }
          buildHeadquartersHref={buildCurrentHeadquartersHref}
          buildSiteEditHref={(headquarterId, siteId) =>
            buildCurrentHeadquartersHref({
              editSiteId: siteId,
              headquarterId,
              siteId,
              siteStatus,
            })
          }
          buildSitePhotoHref={(site) =>
            buildPhotoAlbumHref(site.headquarter_id, site.id)
          }
          busy={false}
          canDelete
          currentUserId={currentUser.id}
          onAssignFieldAgent={assignFieldAgentToSite}
          onClearHeadquarterSelection={() => handleSelectHeadquarter(null)}
          onClearSiteSelection={() => {
            if (selectedHeadquarterId) {
              handleSelectSite(selectedHeadquarterId, null);
              return;
            }
            handleSelectHeadquarter(null);
          }}
          onCreate={async (input: SafetyHeadquarterInput) => {
            const created = await createSafetyHeadquarter(authenticatedSession.token, input);
            await refreshGuestDirectory(authenticatedSession.token);
            return created;
          }}
          onCreateSite={async (input: SafetySiteInput) => {
            const created = await createSafetySite(authenticatedSession.token, input);
            await refreshGuestDirectory(authenticatedSession.token);
            return created;
          }}
          onDelete={async (id: string) => {
            await deleteSafetyHeadquarter(authenticatedSession.token, id);
            await refreshGuestDirectory(authenticatedSession.token);
          }}
          onDeleteSite={async (id: string) => {
            await deleteSafetySite(authenticatedSession.token, id);
            await refreshGuestDirectory(authenticatedSession.token);
          }}
          onSelectHeadquarter={(headquarterId) => handleSelectHeadquarter(headquarterId)}
          onSelectSite={(headquarterId, siteId) => handleSelectSite(headquarterId, siteId)}
          onUnassignFieldAgent={unassignFieldAgentFromSite}
          onUpdate={async (id: string, input: SafetyHeadquarterUpdateInput) => {
            await updateSafetyHeadquarter(authenticatedSession.token, id, input);
            await refreshGuestDirectory(authenticatedSession.token);
          }}
          onUpdateSite={async (id: string, input: SafetySiteUpdateInput) => {
            await updateSafetySite(authenticatedSession.token, id, input);
            await refreshGuestDirectory(authenticatedSession.token);
          }}
          selectedHeadquarterId={selectedHeadquarterId}
          selectedSiteId={selectedSiteId}
          users={users}
        />
      ) : (
        <GuestDirectoryScreen
          headquarters={headquarters}
          onCreateHeadquarter={createGuestHeadquarter}
          onCreateSite={createGuestSite}
          onRequireLogin={requireLogin}
          onSelectHeadquarter={handleSelectHeadquarter}
          onSelectSite={handleSelectSite}
          scope={scope}
          selectedHeadquarterId={selectedHeadquarterId}
          selectedSiteId={selectedSiteId}
          siteStatus={siteStatus}
          sites={sites}
        />
      )}

      <AppModal
        open={Boolean(loginGateReason)}
        title="로그인 후 이용할 수 있습니다"
        onClose={() => setLoginGateReason(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setLoginGateReason(null)}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => {
                void beginGoogleWorkspaceAuth({
                  anonymousToken: session?.isAnonymous ? session.token : null,
                  nextPath: currentPath,
                }).catch((error) => {
                  window.alert(
                    error instanceof Error ? error.message : '구글 로그인으로 이동하지 못했습니다.',
                  );
                });
              }}
            >
              Google 로그인
            </button>
          </>
        }
      >
        <div className={styles.modalForm}>
          <p className={styles.modalHint}>
            {loginGateReason
              ? `${loginGateReason} 기능은 로그인 후 사용할 수 있습니다.`
              : '로그인 후 사용할 수 있습니다.'}
          </p>
          <p className={styles.modalHint}>
            비로그인 상태에서는 추가한 사업장과 현장을 임시 보관하고, 서버 작업은 로그인 후 이어집니다.
          </p>
        </div>
      </AppModal>
    </div>
  );
}
