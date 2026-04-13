'use client';

import AppModal from '@/components/ui/AppModal';
import localStyles from './MailboxPanel.module.css';

interface MailboxReportPickerModalOption {
  headquarterName: string;
  reportKey: string;
  reportTitle: string;
  siteName: string;
  visitDate: string | null;
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
  reportSearch: string;
  reportSiteFilter: string;
  siteOptions: MailboxReportPickerSiteOption[];
  onChangeReportSearch: (value: string) => void;
  onChangeSiteFilter: (value: string) => void;
  onClose: () => void;
  onSelectReport: (reportKey: string) => void;
}

export function MailboxReportPickerModal({
  filteredReportOptions,
  mode,
  open,
  reportPickerLoading,
  reportSearch,
  reportSiteFilter,
  siteOptions,
  onChangeReportSearch,
  onChangeSiteFilter,
  onClose,
  onSelectReport,
}: MailboxReportPickerModalProps) {
  return (
    <AppModal
      open={open}
      title={mode === 'admin' ? '보고서 선택' : '배정 현장 보고서 선택'}
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onClose}
        >
          닫기
        </button>
      }
    >
      <div className={localStyles.reportPickerToolbar}>
        <input
          className={`app-input ${localStyles.reportPickerSearch}`}
          value={reportSearch}
          onChange={(event) => onChangeReportSearch(event.target.value)}
          placeholder="보고서명, 현장명, 키 검색"
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
          filteredReportOptions.map((option) => (
            <article key={option.reportKey} className={localStyles.reportPickerItem}>
              <div className={localStyles.reportPickerMain}>
                <strong className={localStyles.reportSelectionTitle}>
                  {option.reportTitle || option.reportKey}
                </strong>
                <span className={localStyles.accountMeta}>
                  {option.siteName}
                  {option.headquarterName ? ` · ${option.headquarterName}` : ''}
                  {option.visitDate ? ` · ${option.visitDate}` : ''}
                </span>
                <span className={localStyles.accountMeta}>{option.reportKey}</span>
              </div>
              <button
                type="button"
                className={`app-button app-button-primary ${localStyles.inlineActionButton}`}
                onClick={() => onSelectReport(option.reportKey)}
              >
                선택
              </button>
            </article>
          ))
        )}
      </div>
    </AppModal>
  );
}
