'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { ReportsDispatchDialog } from './ReportsDispatchDialog';
import { ReportsFilterMenu } from './ReportsFilterMenu';
import { ReportsOriginalPdfDialog } from './ReportsOriginalPdfDialog';
import { ReportsReviewDialog } from './ReportsReviewDialog';
import { ReportsTable } from './ReportsTable';
import { useReportsSectionState } from './useReportsSectionState';
import type { ReportsSectionProps } from './reportsSectionTypes';

export function ReportsSection(props: ReportsSectionProps) {
  const state = useReportsSectionState(props);

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard} ${styles.reportsSectionCard}`}>
      <div className={`${styles.sectionHeader} ${styles.reportsSectionHeader}`}>
        <div className={styles.reportsSectionHeaderTitle}>
          <h2 className={styles.sectionTitle}>전체 보고서</h2>
        </div>
        <div className={`${styles.sectionHeaderActions} ${styles.reportsSectionHeaderActions}`}>
          <input
            className={`app-input ${styles.sectionHeaderSearch} ${styles.reportsSectionSearch}`}
            placeholder="보고서명, 현장명, 사업장명, 담당자로 검색"
            value={state.query}
            onChange={(event) => state.setQuery(event.target.value)}
          />
          <ReportsFilterMenu
            activeCount={state.activeFilterCount}
            assigneeFilter={state.assigneeFilter}
            assigneeOptions={state.assigneeOptions}
            dateFrom={state.dateFrom}
            dateTo={state.dateTo}
            headquarterFilter={state.headquarterFilter}
            headquarterOptions={state.headquarterOptions}
            onAssigneeFilterChange={state.setAssigneeFilter}
            onDateFromChange={state.setDateFrom}
            onDateToChange={state.setDateTo}
            onHeadquarterFilterChange={state.setHeadquarterFilter}
            onQualityFilterChange={state.setQualityFilter}
            onReportTypeChange={state.setReportType}
            onReset={state.resetHeaderFilters}
            onSiteFilterChange={state.setSiteFilter}
            qualityFilter={state.qualityFilter}
            reportType={state.reportType}
            siteFilter={state.siteFilter}
            siteOptions={state.siteOptions}
          />
          <button type="button" className="app-button app-button-secondary" onClick={() => void state.exportList()}>
            엑셀 내보내기
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {state.error ? <div className={styles.bannerError}>{state.error}</div> : null}
        {state.notice ? <div className={styles.bannerNotice}>{state.notice}</div> : null}
        <ReportsTable
          isLoading={props.isLoading}
          loading={state.loading}
          offset={state.offset}
          onBulkDispatchSent={() => void state.bulkDispatchSent()}
          onBulkOwnerAssign={() => void state.bulkOwnerAssign()}
          onBulkQuality={(value) => void state.bulkQuality(value)}
          onExportReport={(row, format) => void state.exportReport(row, format)}
          onOffsetChange={state.setOffset}
          onOpenDispatchModal={state.openDispatchModal}
          onOpenOriginalPdf={state.openOriginalPdfDialog}
          onOpenReportRow={state.openReportRow}
          onOpenReviewModal={state.openReviewModal}
          onSelectionChange={state.setSelectedKeys}
          onSortChange={state.setSort}
          onToggleDispatchStatus={(row, nextCompleted) =>
            void state.toggleDispatchStatus(row, nextCompleted)
          }
          rows={state.rows}
          selectedKeys={state.selectedKeys}
          selectedRows={state.selectedRows}
          sort={state.sort}
          total={state.total}
        />
      </div>

      <ReportsReviewDialog
        onClose={() => state.setReviewRow(null)}
        onSave={() => void state.saveReview()}
        reviewForm={state.reviewForm}
        reviewRow={state.reviewRow}
        setReviewForm={state.setReviewForm}
        users={state.users}
      />
      <ReportsDispatchDialog
        buildManualDispatchPayload={state.buildManualDispatchPayload}
        dispatchRow={state.dispatchRow}
        dispatchSite={state.dispatchSite}
        dispatchSmsMessage={state.dispatchSmsMessage}
        dispatchSmsPhone={state.dispatchSmsPhone}
        dispatchSmsSending={state.dispatchSmsSending}
        onClose={() => state.setDispatchRow(null)}
        onSaveManual={(row, nextDispatch) => void state.saveDispatch(row, nextDispatch)}
        onSendSms={() => void state.sendDispatchSms()}
        setDispatchSmsMessage={state.setDispatchSmsMessage}
        setDispatchSmsPhone={state.setDispatchSmsPhone}
        smsProviderStatuses={state.smsProviderStatuses}
        users={state.users}
      />
      <ReportsOriginalPdfDialog
        dialog={state.originalPdfDialog}
        onClose={state.closeOriginalPdfDialog}
        onRetry={(row) => void state.openOriginalPdfDialog(row, state.originalPdfDialog.reason)}
      />
    </section>
  );
}
