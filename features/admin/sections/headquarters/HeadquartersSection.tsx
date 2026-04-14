'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { SitesSection } from '@/features/admin/sections/sites/SitesSection';
import { getSiteStatusLabel } from '@/lib/admin';
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
import { HeadquarterSummaryPanel } from './HeadquarterSummaryPanel';
import { SiteManagementMainPanel } from './SiteManagementMainPanel';
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';

function normalizeHeadquarterValue(value: string | null | undefined) {
  return String(value ?? '').trim();
}

function validateHeadquarterSubmit(
  form: ReturnType<typeof useHeadquartersSectionState>['form'],
  headquarters: SafetyHeadquarter[],
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
  assignments: SafetyAssignment[];
  busy: boolean;
  canDelete: boolean;
  headquarters: SafetyHeadquarter[];
  selectedHeadquarterId: string | null;
  selectedSiteId: string | null;
  sites: SafetySite[];
  users: SafetyUser[];
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
  onReload?: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
}

export function HeadquartersSection(props: HeadquartersSectionProps) {
  const {
    assignments,
    busy,
    canDelete,
    headquarters,
    selectedHeadquarterId,
    selectedSiteId,
    sites,
    users,
    onAssignFieldAgent,
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
  const state = useHeadquartersSectionState(headquarters, busy);
  const selectedHeadquarter = useMemo(
    () => headquarters.find((item) => item.id === selectedHeadquarterId) ?? null,
    [headquarters, selectedHeadquarterId],
  );
  const selectedSite = useMemo(
    () =>
      sites.find(
        (item) =>
          item.id === selectedSiteId &&
          (!selectedHeadquarter || item.headquarter_id === selectedHeadquarter.id),
      ) ?? null,
    [selectedHeadquarter, selectedSiteId, sites],
  );
  const headquarterSites = useMemo(
    () =>
      selectedHeadquarter
        ? sites.filter((site) => site.headquarter_id === selectedHeadquarter.id)
        : [],
    [selectedHeadquarter, sites],
  );
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

  if (busy && headquarters.length === 0 && !selectedHeadquarter && !hasSiteStatusScope) {
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
    const validationMessage = validateHeadquarterSubmit(state.form, headquarters, state.editingId);
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
  };

  const handleDeleteHeadquarter = async (item: SafetyHeadquarter) => {
    const confirmed = window.confirm(
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정 정보도 함께 정리되고, 이 작업은 되돌릴 수 없습니다.`,
    );

    if (!confirmed) return;
    await onDelete(item.id);
  };

  return (
    <div className={styles.drilldownStack}>
      {!selectedHeadquarter && !hasSiteStatusScope ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <HeadquartersTable
            busy={busy}
            canDelete={canDelete}
            exportHeadquarters={state.sortedHeadquarters}
            filteredHeadquarters={state.pagedHeadquarters}
            page={state.page}
            onCreateRequest={state.openCreate}
            onDeleteRequest={handleDeleteHeadquarter}
            onEditRequest={state.openEdit}
            onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
            onPageChange={state.setPage}
            onQueryChange={state.setQuery}
            onSortChange={state.setSort}
            query={state.query}
            sort={state.sort}
            totalCount={state.sortedHeadquarters.length}
            totalPages={state.totalPages}
          />
        </section>
      ) : !selectedHeadquarter ? (
        <SitesSection
          assignments={assignments}
          autoEditSiteId={autoEditSiteId}
          busy={busy}
          canDelete={canDelete}
          headquarters={headquarters}
          initialStatusFilter={siteStatusFilter}
          onAssignFieldAgent={onAssignFieldAgent}
          onCreate={onCreateSite}
          onDelete={onDeleteSite}
          onSelectSiteEntry={(site) => onSelectSite(site.headquarter_id, site.id)}
          onUnassignFieldAgent={onUnassignFieldAgent}
          onUpdate={onUpdateSite}
          showHeadquarterColumn
          sites={sites}
          title={siteStatusTitle}
          users={users}
        />
      ) : selectedSite ? (
        <SiteManagementMainPanel
          headquarter={selectedHeadquarter}
          site={selectedSite}
        />
      ) : (
        <div className={styles.contentStack}>
          <HeadquarterSummaryPanel
            headquarter={selectedHeadquarter}
            sites={headquarterSites}
            onEdit={() => state.openEdit(selectedHeadquarter)}
          />
          <SitesSection
            assignments={assignments}
            autoEditSiteId={autoEditSiteId}
            busy={busy}
            canDelete={canDelete}
            headquarters={headquarters}
            initialStatusFilter={siteStatusFilter}
            lockedHeadquarterId={selectedHeadquarter.id}
            onAssignFieldAgent={onAssignFieldAgent}
            onCreate={onCreateSite}
            onDelete={onDeleteSite}
            onSelectSiteEntry={(site) => onSelectSite(selectedHeadquarter.id, site.id)}
            onUnassignFieldAgent={onUnassignFieldAgent}
            onUpdate={onUpdateSite}
            showHeadquarterColumn={false}
            sites={headquarterSites}
            title={siteStatusTitle}
            users={users}
          />
        </div>
      )}

      <HeadquarterEditorModal
        busy={busy}
        canSubmit={state.editingId !== 'create' || state.isCreateReady}
        editingId={state.editingId}
        form={state.form}
        onClose={state.closeModal}
        onFormChange={state.setForm}
        onSubmit={submit}
        open={state.isOpen}
      />
    </div>
  );
}
