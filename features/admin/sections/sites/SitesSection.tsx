'use client';

import Link from 'next/link';
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
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{props.title ?? '현장 목록'}</h2>
              {props.titleActionHref && props.titleActionLabel ? (
                <Link href={props.titleActionHref} className={styles.sectionTitleInlineAction}>
                  {props.titleActionLabel}
                </Link>
              ) : null}
            </div>
            <div className={styles.sectionHeaderMeta}>총 {state.total}건</div>
          </div>
        ) : (
          <div className={styles.sectionHeaderSpacer} />
        )}
        <div className={`${styles.sectionHeaderActions} ${styles.sectionHeaderToolbarActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.sectionHeaderToolbarSearch}`}
            placeholder="현장명, 사업장 관리번호, 공사 종류, 주소로 검색"
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
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void state.exportSites()}
            disabled={props.busy}
          >
            엑셀 내보내기
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={state.openCreate}
            disabled={props.busy}
          >
            현장 추가
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.tableShell}>
          {state.isLoading && state.total === 0 ? (
            <div className={styles.contentTableSkeleton} aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`sites-skeleton-${index + 1}`} className={styles.contentTableSkeletonRow}>
                  <span className={styles.contentTableSkeletonLine} />
                  <span
                    className={`${styles.contentTableSkeletonLine} ${styles.contentTableSkeletonLineMedium}`}
                  />
                </div>
              ))}
            </div>
          ) : state.total === 0 ? (
            <div className={styles.tableEmpty}>
              {props.emptyMessage ?? '등록된 현장이 없습니다.'}
            </div>
          ) : (
            <SitesTable
              busy={props.busy || state.isLoading}
              canDelete={props.canDelete}
              hasCustomEntry={Boolean(props.onSelectSiteEntry)}
              onDeleteSite={(site) => void state.deleteSite(site)}
              onDownloadBasicMaterial={(site) => void state.downloadBasicMaterial(site)}
              onOpenAssignmentModal={state.openAssignmentModal}
              onOpenEdit={state.openEdit}
              onOpenSiteEntry={state.openSiteEntry}
              onPageChange={state.setPage}
              onSortChange={state.setSort}
              onUpdateStatus={(site, status) => void state.updateStatus(site, status)}
              page={state.page}
              showHeadquarterColumn={props.showHeadquarterColumn !== false}
              sites={state.pagedSites}
              sort={state.sort}
              totalCount={state.total}
              totalPages={state.totalPages}
              usersById={new Map()}
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
        users={state.users}
        currentAssignedUserIds={state.currentAssignedUserIds}
        onClose={() => state.setAssignmentSiteId(null)}
        onAssign={async (siteId, userId) => {
          await state.onAssignUser(siteId, userId);
        }}
        onClear={async (siteId, userId) => {
          await state.onUnassignUser(siteId, userId);
        }}
      />
    </section>
  );
}
