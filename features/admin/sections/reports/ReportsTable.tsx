'use client';

import ActionMenu from '@/components/ui/ActionMenu';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { getAdminSectionHref } from '@/lib/admin';
import {
  buildControllerReportHref,
  getControllerReportTypeLabel,
} from '@/lib/admin/controllerReports';
import { getQualityStatusLabel } from '@/lib/admin/reportMeta';
import { isReportDispatchCompleted } from '@/lib/reportDispatch';
import {
  REPORT_PAGE_SIZE,
  formatDateOnly,
  formatDateTime,
} from './reportsSectionFilters';
import type {
  ControllerQualityStatus,
  ControllerReportRow,
  TableSortState,
} from '@/types/admin';

interface ReportsTableProps {
  isLoading: boolean;
  loading: boolean;
  offset: number;
  onBulkDispatchSent: () => void;
  onBulkOwnerAssign: () => void;
  onBulkQuality: (qualityStatus: ControllerQualityStatus) => void;
  onExportReport: (row: ControllerReportRow, format: 'hwpx' | 'pdf') => void;
  onOffsetChange: (value: number | ((current: number) => number)) => void;
  onOpenDispatchModal: (row: ControllerReportRow) => void;
  onOpenReportRow: (row: ControllerReportRow) => void;
  onOpenReviewModal: (row: ControllerReportRow) => void;
  onSelectionChange: (value: string[] | ((current: string[]) => string[])) => void;
  onSortChange: (next: TableSortState) => void;
  onToggleDispatchStatus: (row: ControllerReportRow, nextCompleted: boolean) => void;
  rows: ControllerReportRow[];
  selectedKeys: string[];
  selectedRows: ControllerReportRow[];
  sort: TableSortState;
  total: number;
}

export function ReportsTable({
  isLoading,
  loading,
  offset,
  onBulkDispatchSent,
  onBulkOwnerAssign,
  onBulkQuality,
  onExportReport,
  onOffsetChange,
  onOpenDispatchModal,
  onOpenReportRow,
  onOpenReviewModal,
  onSelectionChange,
  onSortChange,
  onToggleDispatchStatus,
  rows,
  selectedKeys,
  selectedRows,
  sort,
  total,
}: ReportsTableProps) {
  return (
    <>
      {selectedRows.length > 0 ? (
        <div className={styles.bulkActionBar}>
          <span className={styles.reportsSectionHeaderCount}>선택 {selectedRows.length}건</span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => onBulkQuality('ok')}
          >
            검토 확인완료
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => onBulkQuality('issue')}
          >
            검토 이슈
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onBulkOwnerAssign}
          >
            체크 담당자 지정
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onBulkDispatchSent}
          >
            분기 발송완료
          </button>
        </div>
      ) : null}

      <div className={styles.tableShell}>
        {rows.length === 0 ? (
          <div className={styles.tableEmpty}>
            {loading || isLoading
              ? '보고서를 불러오는 중입니다.'
              : '조건에 맞는 보고서가 없습니다.'}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selectedKeys.length === rows.length}
                      onChange={(event) =>
                        onSelectionChange(
                          event.target.checked ? rows.map((row) => row.reportKey) : [],
                        )
                      }
                    />
                  </th>
                  <th>유형</th>
                  <SortableHeaderCell
                    column={{ key: 'reportTitle' }}
                    current={sort}
                    label="보고서"
                    onChange={onSortChange}
                  />
                  <th>현장</th>
                  <th>담당자</th>
                  <th>검토체크</th>
                  <SortableHeaderCell
                    column={{ key: 'visitDate' }}
                    current={sort}
                    defaultDirection="desc"
                    label="기준일"
                    onChange={onSortChange}
                  />
                  <SortableHeaderCell
                    column={{ key: 'updatedAt' }}
                    current={sort}
                    defaultDirection="desc"
                    label="수정일"
                    onChange={onSortChange}
                  />
                  <th>메뉴</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const canToggleDispatch =
                    row.reportType === 'technical_guidance' ||
                    row.reportType === 'quarterly_report';
                  const dispatchCompleted = isReportDispatchCompleted(row.dispatch);

                  return (
                    <tr
                      key={row.reportKey}
                      className={styles.tableClickableRow}
                      tabIndex={0}
                      onClick={() => onOpenReportRow(row)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        onOpenReportRow(row);
                      }}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(row.reportKey)}
                          onChange={(event) =>
                            onSelectionChange((current) =>
                              event.target.checked
                                ? [...current, row.reportKey]
                                : current.filter((value) => value !== row.reportKey),
                            )
                          }
                        />
                      </td>
                      <td>{getControllerReportTypeLabel(row.reportType)}</td>
                      <td>
                        <div className={styles.tablePrimary}>
                          {row.reportTitle || row.periodLabel || row.reportKey}
                        </div>
                      </td>
                      <td>{row.siteName}</td>
                      <td>{row.assigneeName || '-'}</td>
                      <td>{getQualityStatusLabel(row.qualityStatus)}</td>
                      <td>{formatDateOnly(row.visitDate)}</td>
                      <td>{formatDateTime(row.updatedAt)}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className={styles.tableActionMenuWrap}>
                          <ActionMenu
                            label={`${row.reportTitle || row.reportKey} 메뉴 열기`}
                            items={[
                              {
                                label: '열기',
                                href: buildControllerReportHref(row),
                              },
                              {
                                label: '원본 현장으로 이동',
                                href: getAdminSectionHref('headquarters', {
                                  headquarterId: row.headquarterId || null,
                                  siteId: row.siteId,
                                }),
                              },
                              {
                                label: '사진첩 열기',
                                href: getAdminSectionHref('photos', {
                                  headquarterId: row.headquarterId || null,
                                  reportKey:
                                    row.reportType === 'technical_guidance'
                                      ? row.reportKey
                                      : null,
                                  reportTitle:
                                    row.reportTitle || row.periodLabel || row.reportKey,
                                  returnLabel: '보고서로 돌아가기',
                                  returnTo: buildControllerReportHref(row),
                                  siteId: row.siteId,
                                }),
                              },
                              ...(row.reportType !== 'bad_workplace'
                                ? [
                                    {
                                      label: 'HWPX export',
                                      onSelect: () => onExportReport(row, 'hwpx'),
                                    },
                                    {
                                      label: 'PDF export',
                                      onSelect: () => onExportReport(row, 'pdf'),
                                    },
                                  ]
                                : []),
                              ...(row.originalPdfAvailable &&
                              row.originalPdfDownloadPath
                                ? [
                                    {
                                      label: '원본 PDF 다운로드',
                                      href: row.originalPdfDownloadPath,
                                    },
                                  ]
                                : []),
                              {
                                label: '검토 체크',
                                onSelect: () => onOpenReviewModal(row),
                              },
                              {
                                label: '체크 담당자 지정',
                                onSelect: () => onOpenReviewModal(row),
                              },
                              ...(canToggleDispatch
                                ? [
                                    {
                                      label: dispatchCompleted
                                        ? '미발송으로 변경'
                                        : '발송으로 변경',
                                      onSelect: () =>
                                        onToggleDispatchStatus(row, !dispatchCompleted),
                                    },
                                  ]
                                : []),
                              ...(row.reportType === 'quarterly_report'
                                ? [
                                    {
                                      label: '메일 스레드 보기',
                                      href: getAdminSectionHref('mailbox', {
                                        box: row.dispatch?.mailThreadId ? 'inbox' : 'reports',
                                        headquarterId: row.headquarterId || null,
                                        reportKey: row.reportKey,
                                        siteId: row.siteId,
                                        threadId: row.dispatch?.mailThreadId || null,
                                      }),
                                    },
                                    {
                                      label: '발송이력 보기',
                                      onSelect: () => onOpenDispatchModal(row),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.paginationRow}>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => onOffsetChange((current) => Math.max(0, current - REPORT_PAGE_SIZE))}
          disabled={offset === 0}
        >
          이전
        </button>
        <span className={styles.paginationLabel}>
          {total === 0
            ? '0건'
            : `${offset + 1}-${Math.min(offset + rows.length, total)} / ${total}건`}
        </span>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => onOffsetChange((current) => current + REPORT_PAGE_SIZE)}
          disabled={offset + REPORT_PAGE_SIZE >= total}
        >
          다음
        </button>
      </div>
    </>
  );
}
