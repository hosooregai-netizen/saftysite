'use client';

import { useMemo } from 'react';
import OperationalReportsPanel from '@/components/site/OperationalReportsPanel';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { SitesSection } from '@/features/admin/sections/sites/SitesSection';
import { SiteReportListPanel } from '@/features/site-reports/components/SiteReportListPanel';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter } from '@/types/controller';
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
  onCreate: (input: {
    name: string;
    business_registration_no?: string | null;
    corporate_registration_no?: string | null;
    license_no?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    memo?: string | null;
    is_active?: boolean;
  }) => Promise<void>;
  onCreateSite: (input: {
    headquarter_id: string;
    site_name: string;
    site_code?: string | null;
    management_number?: string | null;
    project_start_date?: string | null;
    project_end_date?: string | null;
    project_amount?: number | null;
    manager_name?: string | null;
    manager_phone?: string | null;
    site_address?: string | null;
    status?: 'planned' | 'active' | 'closed';
    memo?: string | null;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteSite: (id: string) => Promise<void>;
  onSelectHeadquarter: (headquarterId: string) => void;
  onSelectSite: (headquarterId: string, siteId: string) => void;
  onUpdate: (
    id: string,
    input: Partial<{
      name: string;
      business_registration_no?: string | null;
      corporate_registration_no?: string | null;
      license_no?: string | null;
      contact_name?: string | null;
      contact_phone?: string | null;
      address?: string | null;
      memo?: string | null;
      is_active?: boolean;
    }>,
  ) => Promise<void>;
  onUpdateSite: (
    id: string,
    input: Partial<{
      headquarter_id: string;
      site_name: string;
      site_code?: string | null;
      management_number?: string | null;
      project_start_date?: string | null;
      project_end_date?: string | null;
      project_amount?: number | null;
      manager_name?: string | null;
      manager_phone?: string | null;
      site_address?: string | null;
      status?: 'planned' | 'active' | 'closed';
      memo?: string | null;
    }>,
  ) => Promise<void>;
  onAssignFieldAgent: (siteId: string, userId: string) => Promise<void>;
  onUnassignFieldAgent: (siteId: string, userId: string) => Promise<void>;
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
  const reportListState = useSiteReportListState(selectedSite?.id ?? null, {
    siteOverride: selectedSite ? mapSafetySiteToInspectionSite(selectedSite) : null,
  });

  const submit = async () => {
    if (!state.form.name.trim()) return;
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
      {!selectedHeadquarter ? (
        <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
          <HeadquartersTable
            busy={busy}
            canDelete={canDelete}
            filteredHeadquarters={state.filteredHeadquarters}
            onCreateRequest={state.openCreate}
            onDeleteRequest={handleDeleteHeadquarter}
            onEditRequest={state.openEdit}
            onOpenSitesRequest={(item) => onSelectHeadquarter(item.id)}
            onQueryChange={state.setQuery}
            query={state.query}
            totalHeadquarterCount={headquarters.length}
          />
        </section>
      ) : selectedSite ? (
        <>
          {reportListState.currentSite ? (
            <>
              <SiteReportListPanel
                assignedUserDisplay={reportListState.assignedUserDisplay}
                canArchiveReports={reportListState.canArchiveReports}
                canCreateReport={reportListState.canCreateReport}
                createReport={reportListState.createReport}
                currentSite={reportListState.currentSite}
                deleteSession={reportListState.deleteSession}
                filteredReportItems={reportListState.filteredReportItems}
                reloadReportIndex={reportListState.reloadReportIndex}
                reportIndexError={reportListState.reportIndexError}
                reportIndexStatus={reportListState.reportIndexStatus}
                reportItems={reportListState.reportItems}
                reportQuery={reportListState.reportQuery}
                reportSortMode={reportListState.reportSortMode}
                setReportQuery={reportListState.setReportQuery}
                setReportSortMode={reportListState.setReportSortMode}
                showSummaryBar={false}
              />
              <OperationalReportsPanel
                currentSite={reportListState.currentSite}
                currentUser={reportListState.currentUser}
                siteReportCount={reportListState.reportItems.length}
              />
            </>
          ) : (
            <section className={styles.sectionCard}>
              <div className={styles.sectionBody}>
                <div className={styles.empty}>현장 보고서 정보를 불러오는 중입니다.</div>
              </div>
            </section>
          )}
        </>
      ) : (
        <SitesSection
          assignments={assignments}
          busy={busy}
          canDelete={canDelete}
          headquarters={headquarters}
          lockedHeadquarterId={selectedHeadquarter.id}
          onAssignFieldAgent={onAssignFieldAgent}
          onCreate={onCreateSite}
          onDelete={onDeleteSite}
          onSelectSiteReports={(site) => onSelectSite(selectedHeadquarter.id, site.id)}
          onUnassignFieldAgent={onUnassignFieldAgent}
          onUpdate={onUpdateSite}
          showHeadquarterColumn={false}
          sites={headquarterSites}
          title="현장 목록"
          users={users}
        />
      )}

      <HeadquarterEditorModal
        busy={busy}
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
