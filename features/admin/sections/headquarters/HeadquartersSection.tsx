'use client';

import { useMemo } from 'react';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { SafetyAssignment, SafetyHeadquarter } from '@/types/controller';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { useHeadquartersSectionState } from './useHeadquartersSectionState';
import { HeadquartersTable } from './HeadquartersTable';
import { HeadquarterEditorModal } from './HeadquarterEditorModal';
import { SitesSection } from '@/features/admin/sections/sites/SitesSection';
import { SiteReportListPanel } from '@/features/site-reports/components/SiteReportListPanel';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';

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

function buildHeadquarterSummaryCards(headquarter: SafetyHeadquarter) {
  return [
    {
      label: '사업장명',
      value: headquarter.name || '-',
      meta: `사업자등록번호 ${headquarter.business_registration_no || '-'}`,
    },
    {
      label: '담당자',
      value: headquarter.contact_name || '-',
      meta: headquarter.contact_phone || '연락처 미입력',
    },
    {
      label: '주소',
      value: headquarter.address || '-',
      meta: `법인등록번호 ${headquarter.corporate_registration_no || '-'}`,
    },
    {
      label: '메모',
      value: headquarter.memo || '-',
      meta: `면허번호 ${headquarter.license_no || '-'}`,
    },
  ];
}

function buildSiteSummaryCards(site: SafetySite) {
  return [
    {
      label: '현장명',
      value: site.site_name || '-',
      meta: site.site_code || '현장 코드 미입력',
    },
    {
      label: '책임자',
      value: site.manager_name || '-',
      meta: site.manager_phone || '연락처 미입력',
    },
    {
      label: '공사기간',
      value: `${site.project_start_date || '-'} ~ ${site.project_end_date || '-'}`,
      meta: site.status || '-',
    },
    {
      label: '현장 주소',
      value: site.site_address || '-',
      meta: site.management_number || '관리번호 미입력',
    },
  ];
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
      `'${item.name}' 사업장을 삭제하시겠습니까?\n연결된 현장과 현장 배정도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`,
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
      ) : (
        <>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  {selectedSite ? '사업장 / 현장 / 보고서' : '사업장 / 현장'}
                </h2>
              </div>
              <div className={styles.sectionHeaderActions}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={onClearHeadquarterSelection}
                >
                  사업장 목록
                </button>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => state.openEdit(selectedHeadquarter)}
                  disabled={busy}
                >
                  사업장 수정
                </button>
                {selectedSite ? (
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={onClearSiteSelection}
                  >
                    현장 목록
                  </button>
                ) : null}
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.breadcrumbs}>
                <button
                  type="button"
                  className={styles.breadcrumbButton}
                  onClick={onClearHeadquarterSelection}
                >
                  사업장 목록
                </button>
                <span className={styles.breadcrumbSep}>/</span>
                <button
                  type="button"
                  className={styles.breadcrumbButton}
                  onClick={() => onSelectHeadquarter(selectedHeadquarter.id)}
                >
                  {selectedHeadquarter.name}
                </button>
                {selectedSite ? (
                  <>
                    <span className={styles.breadcrumbSep}>/</span>
                    <span className={styles.breadcrumbCurrent}>{selectedSite.site_name}</span>
                  </>
                ) : null}
              </div>

              <div className={styles.summaryBar}>
                {buildHeadquarterSummaryCards(selectedHeadquarter).map((card) => (
                  <article key={card.label} className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>{card.label}</span>
                    <strong className={styles.summaryCardValue}>{card.value}</strong>
                    <span className={styles.summaryCardMeta}>{card.meta}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {selectedSite ? (
            <>
              <section className={styles.sectionCard}>
                <div className={styles.sectionBody}>
                  <div className={styles.summaryBar}>
                    {buildSiteSummaryCards(selectedSite).map((card) => (
                      <article key={card.label} className={styles.summaryCard}>
                        <span className={styles.summaryCardLabel}>{card.label}</span>
                        <strong className={styles.summaryCardValue}>{card.value}</strong>
                        <span className={styles.summaryCardMeta}>{card.meta}</span>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              {reportListState.currentSite ? (
                <SiteReportListPanel
                  assignedUserDisplay={reportListState.assignedUserDisplay}
                  canArchiveReports={reportListState.canArchiveReports}
                  canCreateReport={reportListState.canCreateReport}
                  createReport={reportListState.createReport}
                  currentSite={reportListState.currentSite}
                  deleteSession={reportListState.deleteSession}
                  filteredReportItems={reportListState.filteredReportItems}
                  reportIndexError={reportListState.reportIndexError}
                  reportIndexStatus={reportListState.reportIndexStatus}
                  reportItems={reportListState.reportItems}
                  reportQuery={reportListState.reportQuery}
                  reportSortMode={reportListState.reportSortMode}
                  setReportQuery={reportListState.setReportQuery}
                  setReportSortMode={reportListState.setReportSortMode}
                  showSummaryBar={false}
                />
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
              title={`${selectedHeadquarter.name} 현장 목록`}
              users={users}
            />
          )}
        </>
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
