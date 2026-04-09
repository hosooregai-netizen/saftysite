'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { SitesSection } from '@/features/admin/sections/sites/SitesSection';
import { SiteEntryHubPanel } from '@/features/home/components/SiteEntryHubPanel';
import { SITE_STATUS_LABELS } from '@/lib/admin';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
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
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';

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
    siteStatusFilter === 'all' ? '현장 목록' : `${SITE_STATUS_LABELS[siteStatusFilter]} 현장`;
  const selectedInspectionSite = useMemo(
    () => (selectedSite ? mapSafetySiteToInspectionSite(selectedSite) : null),
    [selectedSite],
  );

  const submit = async () => {
    if (state.editingId === 'create' && !state.isCreateReady) return;
    if (state.editingId !== 'create' && !state.form.name.trim()) return;
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
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정 정보는 함께 정리되며, 이 작업은 되돌릴 수 없습니다.`,
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
            filteredHeadquarters={state.sortedHeadquarters}
            onCreateRequest={state.openCreate}
            onDeleteRequest={handleDeleteHeadquarter}
            onEditRequest={state.openEdit}
            onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
            onQueryChange={state.setQuery}
            onSortChange={state.setSort}
            query={state.query}
            sort={state.sort}
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
        selectedInspectionSite ? (
          <SiteEntryHubPanel
            className={styles.contentStack}
            currentSite={selectedInspectionSite}
            reportMetaText="현장 메인에서 기술지도 보고서 목록과 추가 업무 문서로 이동할 수 있습니다."
          />
        ) : (
          <section className={styles.sectionCard}>
            <div className={styles.sectionBody}>
              <div className={styles.empty}>현장 정보를 불러오는 중입니다.</div>
            </div>
          </section>
        )
      ) : (
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
