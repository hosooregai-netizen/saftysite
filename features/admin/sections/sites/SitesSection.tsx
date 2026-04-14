'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { SiteAssignmentModal } from './SiteAssignmentModal';
import { SiteEditorModal } from './SiteEditorModal';
import { SitesFilterMenu } from './SitesFilterMenu';
import { SitesTable } from './SitesTable';
import { useSitesSectionState } from './useSitesSectionState';
import type { SitesSectionProps } from './siteSectionHelpers';

export function SitesSection(props: SitesSectionProps) {
  const state = useSitesSectionState(props);

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        {props.showHeader !== false ? (
          <div className={styles.sectionHeaderTitleBlock}>
            <h2 className={styles.sectionTitle}>{props.title ?? '현장 목록'}</h2>
            <div className={styles.sectionHeaderMeta}>총 {state.sortedSites.length}건</div>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
            placeholder="현장명, 코드, 사업장명, 현장소장, 계약유형, 발주자명으로 검색"
            value={state.query}
            onChange={(event) => state.setQuery(event.target.value)}
          />
          <SitesFilterMenu
            activeCount={state.activeFilterCount}
            assignmentFilter={state.assignmentFilter}
            onAssignmentFilterChange={state.setAssignmentFilter}
            onReset={state.resetHeaderFilters}
            onStatusFilterChange={state.setStatusFilter}
            statusFilter={state.statusFilter}
          />
          <button type="button" className="app-button app-button-secondary" onClick={state.exportSites} disabled={props.busy}>
            엑셀 내보내기
          </button>
          <button type="button" className="app-button app-button-primary" onClick={state.openCreate} disabled={props.busy}>
            현장 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {state.sortedSites.length === 0 ? (
            <div className={styles.tableEmpty}>{props.emptyMessage ?? '등록된 현장이 없습니다.'}</div>
          ) : (
            <SitesTable
              activeAssignmentsBySiteId={state.activeAssignmentsBySiteId}
              busy={props.busy}
              canDelete={props.canDelete}
              hasCustomEntry={Boolean(props.onSelectSiteEntry)}
              onDeleteSite={(site) => void state.deleteSite(site)}
              onDownloadBasicMaterial={(site) => void state.downloadBasicMaterial(site)}
              onOpenAssignmentModal={state.openAssignmentModal}
              onOpenEdit={state.openEdit}
              onOpenSiteEntry={state.openSiteEntry}
              onSortChange={state.setSort}
              onUpdateStatus={(site, status) => void state.updateStatus(site, status)}
              showHeadquarterColumn={props.showHeadquarterColumn !== false}
              sites={state.sortedSites}
              sort={state.sort}
              usersById={state.usersById}
            />
          )}
        </div>
      </div>

      <SiteEditorModal
        busy={props.busy}
        editingId={state.editingId}
        form={state.form}
        headquarters={state.headquarters}
        isCreateReady={state.isCreateReady}
        lockedHeadquarterId={state.lockedHeadquarterId}
        onClose={state.closeModal}
        onSubmit={() => void state.submit()}
        setForm={state.setForm}
      />

      <SiteAssignmentModal
        open={Boolean(state.assignmentSite)}
        busy={props.busy}
        site={state.assignmentSite}
        users={props.users}
        currentAssignments={state.currentAssignments}
        onClose={() => state.setAssignmentSiteId(null)}
        onAssign={async (siteId, userId) => {
          await props.onAssignFieldAgent(siteId, userId);
        }}
        onClear={async (siteId, userId) => {
          await props.onUnassignFieldAgent(siteId, userId);
        }}
      />
    </section>
  );
}
