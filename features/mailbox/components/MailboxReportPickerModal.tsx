'use client';

import AppModal from '@/components/ui/AppModal';
import localStyles from './MailboxPanel.module.css';

const REPORT_PICKER_PAGE_SIZE = 20;

interface MailboxReportPickerModalOption {
  attachmentReady: boolean;
  attachmentUnavailableReason: string;
  headquarterName: string;
  originalPdfAvailable: boolean;
  reportKey: string;
  reportTitle: string;
  siteName: string;
  visitDate: string | null;
  visitRound?: number | null;
}

interface MailboxReportPickerSiteOption {
  id: string;
  site_name: string;
}

interface MailboxReportPickerModalProps {
  filteredReportOptions: MailboxReportPickerModalOption[];
  mode: 'admin' | 'worker';
  open: boolean;
  reportPickerLoading: boolean;
  reportPickerPage: number;
  reportPickerPageCount: number;
  reportPickerTotal: number;
  reportSearch: string;
  reportSiteFilter: string;
  selectedReportKeys: string[];
  siteOptions: MailboxReportPickerSiteOption[];
  onChangeReportSearch: (value: string) => void;
  onChangeSiteFilter: (value: string) => void;
  onClose: () => void;
  onMoveReportPickerPage: (page: number) => void;
  onSelectReport: (reportKey: string) => void;
}

export function MailboxReportPickerModal({
  filteredReportOptions,
  mode,
  open,
  reportPickerLoading,
  reportPickerPage,
  reportPickerPageCount,
  reportPickerTotal,
  reportSearch,
  reportSiteFilter,
  selectedReportKeys,
  siteOptions,
  onChangeReportSearch,
  onChangeSiteFilter,
  onClose,
  onMoveReportPickerPage,
  onSelectReport,
}: MailboxReportPickerModalProps) {
  const canShowPagination = mode === 'admin' && reportPickerTotal > 0;
  const rangeStart = canShowPagination
    ? (reportPickerPage - 1) * REPORT_PICKER_PAGE_SIZE + 1
    : 0;
  const rangeEnd = canShowPagination
    ? Math.min(reportPickerPage * REPORT_PICKER_PAGE_SIZE, reportPickerTotal)
    : 0;
  const selectedKeySet = new Set(selectedReportKeys);

  return (
    <AppModal
      open={open}
      title={mode === 'admin' ? '보고서 선택' : '배정 현장 보고서 선택'}
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onClose}
        >
          선택 완료{selectedReportKeys.length > 0 ? ` (${selectedReportKeys.length})` : ''}
        </button>
      }
    >
      <div className={localStyles.reportPickerToolbar}>
        <input
          className={`app-input ${localStyles.reportPickerSearch}`}
          value={reportSearch}
          onChange={(event) => onChangeReportSearch(event.target.value)}
          placeholder="보고서명, 현장명 검색"
        />
        {mode === 'admin' ? (
          <select
            className={`app-select ${localStyles.reportPickerFilter}`}
            value={reportSiteFilter}
            onChange={(event) => onChangeSiteFilter(event.target.value)}
          >
            <option value="">전체 현장</option>
            {siteOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.site_name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className={localStyles.reportPickerList}>
        {reportPickerLoading ? (
          <div className={localStyles.emptyState}>보고서 목록을 불러오는 중입니다.</div>
        ) : filteredReportOptions.length === 0 ? (
          <div className={localStyles.emptyState}>선택할 수 있는 보고서가 없습니다.</div>
        ) : (
          filteredReportOptions.map((option) => {
            const isSelected = selectedKeySet.has(option.reportKey);
            return (
              <article key={option.reportKey} className={localStyles.reportPickerItem}>
                <div className={localStyles.reportPickerMain}>
                  <strong className={localStyles.reportSelectionTitle}>
                    {option.reportTitle || option.reportKey}
                  </strong>
                  <span className={localStyles.accountMeta}>
                    {option.siteName}
                    {option.headquarterName ? ` / ${option.headquarterName}` : ''}
                    {option.visitDate ? ` / ${option.visitDate}` : ''}
                    {option.visitRound ? ` / ${option.visitRound}회차` : ''}
                  </span>
                  <span className={localStyles.accountMeta}>{option.reportKey}</span>
                  {option.originalPdfAvailable ? (
                    <span className={localStyles.accountMeta}>원본 PDF 첨부 가능</span>
                  ) : null}
                  {!option.attachmentReady && option.attachmentUnavailableReason ? (
                    <span className={localStyles.accountMeta}>{option.attachmentUnavailableReason}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`app-button ${
                    isSelected ? 'app-button-secondary' : 'app-button-primary'
                  } ${localStyles.inlineActionButton}`}
                  disabled={!option.attachmentReady}
                  aria-pressed={isSelected}
                  onClick={() => onSelectReport(option.reportKey)}
                >
                  {option.attachmentReady ? (isSelected ? '선택 해제' : '선택') : '선택 불가'}
                </button>
              </article>
            );
          })
        )}
      </div>
      {canShowPagination ? (
        <div className={localStyles.reportPickerPagination}>
          <span className={localStyles.paginationMeta}>
            {rangeStart}-{rangeEnd} / {reportPickerTotal}건 / {reportPickerPage} /{' '}
            {reportPickerPageCount}
          </span>
          <button
            type="button"
            className={`app-button app-button-secondary ${localStyles.paginationButton}`}
            disabled={reportPickerLoading || reportPickerPage <= 1}
            onClick={() => onMoveReportPickerPage(reportPickerPage - 1)}
          >
            이전
          </button>
          <button
            type="button"
            className={`app-button app-button-secondary ${localStyles.paginationButton}`}
            disabled={reportPickerLoading || reportPickerPage >= reportPickerPageCount}
            onClick={() => onMoveReportPickerPage(reportPickerPage + 1)}
          >
            다음
          </button>
        </div>
      ) : null}
    </AppModal>
  );
}
