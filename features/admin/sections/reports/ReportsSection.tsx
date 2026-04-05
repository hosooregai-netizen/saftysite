'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ActionMenu from '@/components/ui/ActionMenu';
import AppModal from '@/components/ui/AppModal';
import { SortableHeaderCell } from '@/features/admin/components/SortableHeaderCell';
import { TableToolbar } from '@/features/admin/components/TableToolbar';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { K2bImportModal } from '@/features/admin/sections/k2b/K2bImportModal';
import {
  appendAdminDispatchEvent,
  fetchAdminReports,
  updateAdminReportDispatch,
  updateAdminReportReview,
} from '@/lib/admin/apiClient';
import {
  buildControllerReportHref,
  getControllerReportDispatchLabel,
  getControllerReportTypeLabel,
} from '@/lib/admin/controllerReports';
import {
  exportAdminServerWorkbook,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import {
  getDispatchStatusLabel,
  getQualityStatusLabel,
} from '@/lib/admin/reportMeta';
import { getAdminSectionHref } from '@/lib/admin';
import {
  buildAdminK2bUploadCloseHref,
  buildAdminK2bUploadHref,
  isK2bUploadOpen,
} from '@/lib/admin/k2bUpload';
import {
  convertHwpxBlobToPdfWithFallback,
  fetchQuarterlyHwpxDocument,
  fetchQuarterlyPdfDocumentWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import { fetchSmsProviderStatuses, sendSms } from '@/lib/messages/apiClient';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import type {
  ControllerQualityStatus,
  ControllerReportRow,
  ReportDispatchMeta,
  TableSortState,
} from '@/types/admin';
import type { SafetySite, SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';
import type { SmsProviderStatus } from '@/types/messages';

interface ReportsSectionProps {
  currentUser: SafetyUser;
  ensureSessionLoaded: (reportKey: string) => Promise<void>;
  getSessionById: (sessionId: string) => InspectionSession | null;
  isLoading: boolean;
  onReloadData: (options?: {
    force?: boolean;
    includeContent?: boolean;
    includeReports?: boolean;
  }) => Promise<void>;
  sessions: InspectionSession[];
  sites: SafetySite[];
  users: SafetyUser[];
}

const REPORT_PAGE_SIZE = 100;
const EMPTY_REVIEW_FORM = {
  note: '',
  ownerUserId: '',
  qualityStatus: 'unchecked' as ControllerQualityStatus,
};

function formatDateTime(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(value: string) {
  if (!value) return '-';
  return value.slice(0, 10);
}

function addDays(value: string, days: number) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function buildDispatchMeta(row: ControllerReportRow): ReportDispatchMeta {
  return row.dispatch ?? {
    deadlineDate: row.deadlineDate || addDays(row.visitDate || row.updatedAt.slice(0, 10), 7),
    dispatchStatus: row.dispatchStatus || '',
    mailboxAccountId: '',
    mailThreadId: '',
    messageId: '',
    readAt: '',
    recipient: '',
    replyAt: '',
    replySummary: '',
    sentCompletedAt: '',
    sentHistory: [],
  };
}

export function ReportsSection({
  currentUser,
  ensureSessionLoaded,
  getSessionById,
  isLoading,
  onReloadData,
  sessions,
  sites,
  users,
}: ReportsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [sort, setSort] = useState<TableSortState>({ direction: 'desc', key: 'updatedAt' });
  const [reportType, setReportType] = useState<'all' | ControllerReportRow['reportType']>(() => {
    const value = searchParams.get('reportType');
    return value === 'technical_guidance' ||
      value === 'quarterly_report' ||
      value === 'bad_workplace'
      ? value
      : 'all';
  });
  const [statusFilter, setStatusFilter] = useState<'all' | string>(() => searchParams.get('status') || 'all');
  const [headquarterFilter, setHeadquarterFilter] = useState(() => searchParams.get('headquarterId') || 'all');
  const [siteFilter, setSiteFilter] = useState(() => searchParams.get('siteId') || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState(() => searchParams.get('assigneeUserId') || 'all');
  const [dispatchFilter, setDispatchFilter] = useState<'all' | string>(() => searchParams.get('dispatchStatus') || 'all');
  const [qualityFilter, setQualityFilter] = useState<'all' | string>(() => searchParams.get('qualityStatus') || 'all');
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(() => searchParams.get('dateTo') || '');
  const [rows, setRows] = useState<ControllerReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [reviewRow, setReviewRow] = useState<ControllerReportRow | null>(null);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM);
  const [dispatchRow, setDispatchRow] = useState<ControllerReportRow | null>(null);
  const [dispatchSmsPhone, setDispatchSmsPhone] = useState('');
  const [dispatchSmsMessage, setDispatchSmsMessage] = useState('');
  const [dispatchSmsSending, setDispatchSmsSending] = useState(false);
  const [smsProviderStatuses, setSmsProviderStatuses] = useState<SmsProviderStatus[]>([]);
  const deferredQuery = useDeferredValue(query);
  const k2bOpen = isK2bUploadOpen(searchParams);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminReports({
        assigneeUserId: assigneeFilter === 'all' ? '' : assigneeFilter,
        dateFrom,
        dateTo,
        dispatchStatus: dispatchFilter === 'all' ? '' : dispatchFilter,
        headquarterId: headquarterFilter === 'all' ? '' : headquarterFilter,
        limit: REPORT_PAGE_SIZE,
        offset,
        qualityStatus: qualityFilter === 'all' ? '' : qualityFilter,
        query: deferredQuery,
        reportType: reportType === 'all' ? '' : reportType,
        siteId: siteFilter === 'all' ? '' : siteFilter,
        sortBy: sort.key,
        sortDir: sort.direction,
        status: statusFilter === 'all' ? '' : statusFilter,
      });
      setRows(response.rows);
      setTotal(response.total);
      setSelectedKeys([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [
    assigneeFilter,
    dateFrom,
    dateTo,
    deferredQuery,
    dispatchFilter,
    headquarterFilter,
    offset,
    qualityFilter,
    reportType,
    siteFilter,
    sort.direction,
    sort.key,
    statusFilter,
  ]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!dispatchRow || smsProviderStatuses.length > 0) return;
    void (async () => {
      try {
        setSmsProviderStatuses(await fetchSmsProviderStatuses());
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '문자 공급자 상태를 불러오지 못했습니다.');
      }
    })();
  }, [dispatchRow, smsProviderStatuses.length]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedKeys.includes(row.reportKey)),
    [rows, selectedKeys],
  );
  const headquarterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          sites
            .filter((site) => site.headquarter_id)
            .map((site) => [
              site.headquarter_id,
              site.headquarter_detail?.name || site.headquarter?.name || '사업장 미상',
            ]),
        ).entries(),
      ),
    [sites],
  );
  const siteOptions = useMemo(
    () => sites.map((site) => [site.id, site.site_name] as const),
    [sites],
  );
  const assigneeOptions = useMemo(
    () => users.map((user) => [user.id, user.name] as const),
    [users],
  );

  const handleSortChange = (next: TableSortState) => {
    setOffset(0);
    setSort(next);
  };

  const openReviewModal = (row: ControllerReportRow) => {
    setReviewRow(row);
    setReviewForm({
      note: row.controllerReview?.note || '',
      ownerUserId: row.controllerReview?.ownerUserId || row.assigneeUserId || '',
      qualityStatus: row.controllerReview?.qualityStatus || 'unchecked',
    });
  };

  const openDispatchModal = (row: ControllerReportRow) => {
    const site = sites.find((item) => item.id === row.siteId);
    setDispatchRow(row);
    setDispatchSmsPhone(site?.manager_phone || '');
    setDispatchSmsMessage(
      [
        `[분기보고서] ${row.siteName}`,
        `${row.periodLabel || row.reportTitle || row.reportKey} 발송 관련 안내입니다.`,
        '메일함에서 첨부 보고서를 함께 확인해 주세요.',
      ].join('\n'),
    );
  };

  const handleSaveReview = async () => {
    if (!reviewRow) return;

    try {
      await updateAdminReportReview(reviewRow.reportKey, {
        checkedAt: new Date().toISOString(),
        checkerUserId: currentUser.id,
        note: reviewForm.note.trim(),
        ownerUserId: reviewForm.ownerUserId,
        qualityStatus: reviewForm.qualityStatus,
      });
      setNotice('보고서 품질 체크를 저장했습니다.');
      setReviewRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 품질 체크 저장에 실패했습니다.');
    }
  };

  const handleSaveDispatch = async (row: ControllerReportRow, nextDispatch: ReportDispatchMeta) => {
    try {
      await updateAdminReportDispatch(row.reportKey, nextDispatch);
      setNotice('분기 보고서 발송 정보를 저장했습니다.');
      setDispatchRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '발송 정보 저장에 실패했습니다.');
    }
  };

  const handleSendSms = async () => {
    if (!dispatchRow) return;
    try {
      setDispatchSmsSending(true);
      setError(null);
      const result = await sendSms({
        content: dispatchSmsMessage,
        headquarterId: dispatchRow.headquarterId,
        phoneNumber: dispatchSmsPhone,
        reportKey: dispatchRow.reportKey,
        siteId: dispatchRow.siteId,
        subject: dispatchRow.reportTitle || dispatchRow.periodLabel || dispatchRow.reportKey,
      });
      setNotice(result.message || '문자를 발송했습니다.');
      setDispatchRow(null);
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '문자 발송에 실패했습니다.');
    } finally {
      setDispatchSmsSending(false);
    }
  };

  const handleBulkQuality = async (qualityStatus: ControllerQualityStatus) => {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((row) =>
          updateAdminReportReview(row.reportKey, {
            checkedAt: new Date().toISOString(),
            checkerUserId: currentUser.id,
            note: row.controllerReview?.note || '',
            ownerUserId: row.controllerReview?.ownerUserId || row.assigneeUserId || currentUser.id,
            qualityStatus,
          }),
        ),
      );
      setNotice('선택한 보고서의 품질 상태를 저장했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일괄 품질 처리에 실패했습니다.');
    }
  };

  const handleBulkOwnerAssign = async () => {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(
        selectedRows.map((row) =>
          updateAdminReportReview(row.reportKey, {
            checkedAt: row.controllerReview?.checkedAt || '',
            checkerUserId: row.controllerReview?.checkerUserId || currentUser.id,
            note: row.controllerReview?.note || '',
            ownerUserId: currentUser.id,
            qualityStatus: row.controllerReview?.qualityStatus || 'unchecked',
          }),
        ),
      );
      setNotice('선택한 보고서의 체크 담당자를 지정했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '담당자 지정에 실패했습니다.');
    }
  };

  const handleBulkDispatchSent = async () => {
    const quarterlyRows = selectedRows.filter((row) => row.reportType === 'quarterly_report');
    if (quarterlyRows.length === 0) return;

    try {
      await Promise.all(
        quarterlyRows.map(async (row) => {
          const nextDispatch = {
            ...buildDispatchMeta(row),
            dispatchStatus: 'sent' as const,
            sentCompletedAt: buildDispatchMeta(row).sentCompletedAt || new Date().toISOString(),
          };
          await updateAdminReportDispatch(row.reportKey, nextDispatch);
          await appendAdminDispatchEvent(row.reportKey, {
            id: new Date().toISOString(),
            memo: '관제 일괄 발송완료 처리',
            sentAt: new Date().toISOString(),
            sentByUserId: currentUser.id,
          });
        }),
      );
      setNotice('선택한 분기 보고서를 발송완료 처리했습니다.');
      await fetchRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '일괄 발송 처리에 실패했습니다.');
    }
  };

  const handleExportReport = async (row: ControllerReportRow, format: 'hwpx' | 'pdf') => {
    try {
      setError(null);

      if (row.reportType === 'technical_guidance') {
        await ensureSessionLoaded(row.reportKey);
        const session = getSessionById(row.reportKey);
        if (!session) {
          throw new Error('지도보고서를 불러오지 못했습니다.');
        }

        const siteSessions = sessions.filter((item) => item.siteKey === session.siteKey);
        const document = await generateInspectionHwpxBlob(session, siteSessions);

        if (format === 'hwpx') {
          saveBlobAsFile(document.blob, document.filename);
          setNotice('지도보고서를 내보냈습니다.');
        } else {
          const pdf = await convertHwpxBlobToPdfWithFallback(document.blob, document.filename);
          saveBlobAsFile(pdf.blob, pdf.filename);
          setNotice(
            pdf.fallbackToHwpx
              ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.'
              : '지도보고서를 내보냈습니다.',
          );
        }
        return;
      }

      if (row.reportType === 'quarterly_report') {
        const token = readSafetyAuthToken();
        if (!token) {
          throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
        }

        const rawReport = await fetchSafetyReportByKey(token, row.reportKey);
        const quarterlyReport = mapSafetyReportToQuarterlySummaryReport(rawReport);
        const site = sites.find((item) => item.id === row.siteId);
        if (!quarterlyReport || !site) {
          throw new Error('분기 보고서 원본 데이터를 찾지 못했습니다.');
        }

        const mappedSite = mapSafetySiteToInspectionSite(site);
        if (format === 'hwpx') {
          const exported = await fetchQuarterlyHwpxDocument(quarterlyReport, mappedSite);
          saveBlobAsFile(exported.blob, exported.filename);
          setNotice('분기 보고서를 내보냈습니다.');
        } else {
          const exported = await fetchQuarterlyPdfDocumentWithFallback(
            quarterlyReport,
            mappedSite,
          );
          saveBlobAsFile(exported.blob, exported.filename);
          setNotice(
            exported.fallbackToHwpx
              ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.'
              : '분기 보고서를 내보냈습니다.',
          );
        }
        return;
      }

      throw new Error('불량사업장 보고서 export는 아직 연결되지 않았습니다.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '보고서 내보내기에 실패했습니다.');
    }
  };

  const handleExportList = () =>
    exportAdminServerWorkbook('reports', {
      assignee_user_id: assigneeFilter === 'all' ? '' : assigneeFilter,
      date_from: dateFrom,
      date_to: dateTo,
      dispatch_status: dispatchFilter === 'all' ? '' : dispatchFilter,
      headquarter_id: headquarterFilter === 'all' ? '' : headquarterFilter,
      quality_status: qualityFilter === 'all' ? '' : qualityFilter,
      query,
      report_type: reportType === 'all' ? '' : reportType,
      site_id: siteFilter === 'all' ? '' : siteFilter,
      sort_by: sort.key,
      sort_dir: sort.direction,
      status: statusFilter === 'all' ? '' : statusFilter,
    }).catch(() =>
      exportAdminWorkbook('reports', [
        {
          name: '전체 보고서',
          columns: [
            { key: 'reportType', label: '유형' },
            { key: 'reportTitle', label: '보고서명' },
            { key: 'siteName', label: '현장' },
            { key: 'headquarterName', label: '사업장' },
            { key: 'assigneeName', label: '담당자' },
            { key: 'status', label: '상태' },
            { key: 'visitDate', label: '기준일' },
            { key: 'updatedAt', label: '수정일' },
            { key: 'dispatchStatus', label: '발송상태' },
            { key: 'deadlineDate', label: '마감일' },
            { key: 'qualityStatus', label: '품질체크' },
            { key: 'checkerUserId', label: '체크 담당자' },
          ],
          rows: rows.map((row) => ({
            assigneeName: row.assigneeName,
            checkerUserId: users.find((user) => user.id === row.checkerUserId)?.name || '',
            deadlineDate: row.deadlineDate,
            dispatchStatus: getControllerReportDispatchLabel(row),
            headquarterName: row.headquarterName,
            qualityStatus: getQualityStatusLabel(row.qualityStatus),
            reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
            reportType: getControllerReportTypeLabel(row.reportType),
            siteName: row.siteName,
            status: row.status,
            updatedAt: formatDateTime(row.updatedAt),
            visitDate: formatDateOnly(row.visitDate),
          })),
        },
      ]),
    );

  const openExcelUpload = () => {
    router.replace(
      buildAdminK2bUploadHref(searchParams, {
        headquarterId: headquarterFilter === 'all' ? null : headquarterFilter,
        section: 'reports',
        siteId: siteFilter === 'all' ? null : siteFilter,
      }),
    );
  };

  const closeExcelUpload = () => {
    router.replace(
      buildAdminK2bUploadCloseHref(searchParams, {
        headquarterId: headquarterFilter === 'all' ? null : headquarterFilter,
        section: 'reports',
        siteId: siteFilter === 'all' ? null : siteFilter,
      }),
    );
  };

  const handleReloadAfterK2b = async () => {
    await onReloadData({ force: true, includeReports: true });
    await fetchRows();
  };

  return (
    <section className={`${styles.sectionCard} ${styles.listSectionCard}`}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>전체 보고서</h2>
        </div>
        <div className={styles.sectionHeaderActions}>
          <span className="app-chip">전체 {total}건</span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={openExcelUpload}
          >
            엑셀 업로드
          </button>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {error ? <div className={styles.bannerError}>{error}</div> : null}
        {notice ? <div className={styles.bannerNotice}>{notice}</div> : null}

        <TableToolbar
          countLabel={`표시 ${rows.length} / 전체 ${total}건`}
          filters={
            <>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={reportType}
                onChange={(event) => {
                  setOffset(0);
                  setReportType(event.target.value as 'all' | ControllerReportRow['reportType']);
                }}
              >
                <option value="all">전체 유형</option>
                <option value="technical_guidance">지도보고서</option>
                <option value="quarterly_report">분기 보고서</option>
                <option value="bad_workplace">불량사업장</option>
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={statusFilter}
                onChange={(event) => {
                  setOffset(0);
                  setStatusFilter(event.target.value);
                }}
              >
                <option value="all">전체 상태</option>
                <option value="draft">작성중</option>
                <option value="submitted">제출</option>
                <option value="published">발행</option>
                <option value="archived">보관</option>
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={headquarterFilter}
                onChange={(event) => {
                  setOffset(0);
                  setHeadquarterFilter(event.target.value);
                }}
              >
                <option value="all">전체 사업장</option>
                {headquarterOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={siteFilter}
                onChange={(event) => {
                  setOffset(0);
                  setSiteFilter(event.target.value);
                }}
              >
                <option value="all">전체 현장</option>
                {siteOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={assigneeFilter}
                onChange={(event) => {
                  setOffset(0);
                  setAssigneeFilter(event.target.value);
                }}
              >
                <option value="all">전체 담당자</option>
                {assigneeOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={dispatchFilter}
                onChange={(event) => {
                  setOffset(0);
                  setDispatchFilter(event.target.value);
                }}
              >
                <option value="all">전체 발송상태</option>
                <option value="normal">정상</option>
                <option value="warning">경고</option>
                <option value="overdue">지연</option>
                <option value="sent">발송완료</option>
              </select>
              <select
                className={`app-select ${styles.toolbarSelect}`}
                value={qualityFilter}
                onChange={(event) => {
                  setOffset(0);
                  setQualityFilter(event.target.value);
                }}
              >
                <option value="all">전체 품질체크</option>
                <option value="unchecked">미확인</option>
                <option value="ok">확인완료</option>
                <option value="issue">이슈</option>
              </select>
              <input
                className={`app-input ${styles.toolbarSelect}`}
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setOffset(0);
                  setDateFrom(event.target.value);
                }}
              />
              <input
                className={`app-input ${styles.toolbarSelect}`}
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setOffset(0);
                  setDateTo(event.target.value);
                }}
              />
            </>
          }
          onExport={() => void handleExportList()}
          onQueryChange={(value) => {
            setOffset(0);
            setQuery(value);
          }}
          query={query}
          queryPlaceholder="보고서명, 현장명, 사업장명, 담당자로 검색"
        />

        {selectedRows.length > 0 ? (
          <div className={styles.bulkActionBar}>
            <span className="app-chip">선택 {selectedRows.length}건</span>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleBulkQuality('ok')}
            >
              품질 확인완료
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleBulkQuality('issue')}
            >
              품질 이슈
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleBulkOwnerAssign()}
            >
              체크 담당자 지정
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleBulkDispatchSent()}
            >
              분기 발송완료
            </button>
          </div>
        ) : null}

        <div className={styles.tableShell}>
          {rows.length === 0 ? (
            <div className={styles.tableEmpty}>
              {loading || isLoading ? '보고서를 불러오는 중입니다.' : '조건에 맞는 보고서가 없습니다.'}
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
                          setSelectedKeys(event.target.checked ? rows.map((row) => row.reportKey) : [])
                        }
                      />
                    </th>
                    <SortableHeaderCell
                      column={{ key: 'reportType' }}
                      current={sort}
                      label="유형"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'reportTitle' }}
                      current={sort}
                      label="보고서"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'siteName' }}
                      current={sort}
                      label="현장"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'assigneeName' }}
                      current={sort}
                      label="담당자"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'status' }}
                      current={sort}
                      label="상태"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'dispatchStatus' }}
                      current={sort}
                      defaultDirection="desc"
                      label="발송"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'qualityStatus' }}
                      current={sort}
                      defaultDirection="desc"
                      label="품질체크"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'visitDate' }}
                      current={sort}
                      defaultDirection="desc"
                      label="기준일"
                      onChange={handleSortChange}
                    />
                    <SortableHeaderCell
                      column={{ key: 'updatedAt' }}
                      current={sort}
                      defaultDirection="desc"
                      label="수정일"
                      onChange={handleSortChange}
                    />
                    <th>메뉴</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.reportKey}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(row.reportKey)}
                          onChange={(event) =>
                            setSelectedKeys((current) =>
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
                        <div className={styles.tableSecondary}>
                          {row.periodLabel || row.reportMonth || row.reportKey}
                        </div>
                      </td>
                      <td>
                        <div className={styles.tablePrimary}>{row.siteName}</div>
                        <div className={styles.tableSecondary}>{row.headquarterName || '-'}</div>
                      </td>
                      <td>{row.assigneeName || '-'}</td>
                      <td>{row.status}</td>
                      <td>
                        <div className={styles.tablePrimary}>{getControllerReportDispatchLabel(row)}</div>
                        <div className={styles.tableSecondary}>
                          {buildDispatchMeta(row).replyAt
                            ? `회신 ${formatDateTime(buildDispatchMeta(row).replyAt)}`
                            : buildDispatchMeta(row).readAt
                              ? `열람 ${formatDateTime(buildDispatchMeta(row).readAt)}`
                              : `마감 ${row.deadlineDate || '-'}`}
                        </div>
                      </td>
                      <td>
                        <div className={styles.tablePrimary}>{getQualityStatusLabel(row.qualityStatus)}</div>
                        <div className={styles.tableSecondary}>
                          {users.find((user) => user.id === row.checkerUserId)?.name || '-'}
                        </div>
                      </td>
                      <td>{formatDateOnly(row.visitDate)}</td>
                      <td>{formatDateTime(row.updatedAt)}</td>
                      <td>
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
                                    row.reportType === 'technical_guidance' ? row.reportKey : null,
                                  reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
                                  returnLabel: '보고서로 돌아가기',
                                  returnTo: buildControllerReportHref(row),
                                  siteId: row.siteId,
                                }),
                              },
                              ...(row.reportType !== 'bad_workplace'
                                ? [
                                    {
                                      label: 'HWPX export',
                                      onSelect: () => {
                                        void handleExportReport(row, 'hwpx');
                                      },
                                    },
                                    {
                                      label: 'PDF export',
                                      onSelect: () => {
                                        void handleExportReport(row, 'pdf');
                                      },
                                    },
                                  ]
                                : []),
                              {
                                label: '품질 체크',
                                onSelect: () => openReviewModal(row),
                              },
                              {
                                label: '체크 담당자 지정',
                                onSelect: () => openReviewModal(row),
                              },
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
                                      onSelect: () => openDispatchModal(row),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.paginationRow}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => setOffset((current) => Math.max(0, current - REPORT_PAGE_SIZE))}
            disabled={offset === 0}
          >
            이전
          </button>
          <span className={styles.paginationLabel}>
            {total === 0 ? '0건' : `${offset + 1}-${Math.min(offset + rows.length, total)} / ${total}건`}
          </span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => setOffset((current) => current + REPORT_PAGE_SIZE)}
            disabled={offset + REPORT_PAGE_SIZE >= total}
          >
            다음
          </button>
        </div>
      </div>

      <AppModal
        open={Boolean(reviewRow)}
        title="보고서 품질 체크"
        onClose={() => setReviewRow(null)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setReviewRow(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void handleSaveReview()}
            >
              저장
            </button>
          </>
        }
      >
        <div className={styles.modalGrid}>
          <label className={styles.modalField}>
            <span className={styles.label}>품질 상태</span>
            <select
              className="app-select"
              value={reviewForm.qualityStatus}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  qualityStatus: event.target.value as ControllerQualityStatus,
                }))
              }
            >
              <option value="unchecked">미확인</option>
              <option value="ok">확인완료</option>
              <option value="issue">이슈</option>
            </select>
          </label>
          <label className={styles.modalField}>
            <span className={styles.label}>담당자</span>
            <select
              className="app-select"
              value={reviewForm.ownerUserId}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  ownerUserId: event.target.value,
                }))
              }
            >
              <option value="">선택</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.modalFieldWide}>
            <span className={styles.label}>메모</span>
            <textarea
              className="app-textarea"
              rows={4}
              value={reviewForm.note}
              onChange={(event) =>
                setReviewForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(dispatchRow)}
        title="분기 보고서 발송 이력"
        onClose={() => setDispatchRow(null)}
        actions={
          dispatchRow ? (
            <>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setDispatchRow(null)}
              >
                닫기
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() =>
                  void handleSaveDispatch(dispatchRow, {
                    ...buildDispatchMeta(dispatchRow),
                    dispatchStatus: 'sent',
                    sentCompletedAt:
                      buildDispatchMeta(dispatchRow).sentCompletedAt || new Date().toISOString(),
                    sentHistory: [
                      ...buildDispatchMeta(dispatchRow).sentHistory,
                      {
                        id: new Date().toISOString(),
                        memo: '관제에서 발송완료 처리',
                        sentAt: new Date().toISOString(),
                        sentByUserId: currentUser.id,
                      },
                    ],
                  })
                }
              >
                발송완료 처리
              </button>
            </>
          ) : undefined
        }
      >
        {dispatchRow ? (
          <div className={styles.sectionBody}>
            <p className={styles.tableSecondary}>
              현재 상태: {getDispatchStatusLabel(buildDispatchMeta(dispatchRow).dispatchStatus)} / 마감일{' '}
              {buildDispatchMeta(dispatchRow).deadlineDate || '-'}
            </p>
            <div className={styles.modalGrid}>
              <label className={styles.modalFieldWide}>
                <span className={styles.label}>문자 발송 상태</span>
                <div className={styles.tableSecondary}>
                  {smsProviderStatuses.length === 0
                    ? '문자 공급자 상태를 불러오는 중입니다.'
                    : smsProviderStatuses.map((provider) => provider.message).join(' / ')}
                </div>
              </label>
              <label className={styles.modalField}>
                <span className={styles.label}>수신 번호</span>
                <input
                  className="app-input"
                  type="tel"
                  value={dispatchSmsPhone}
                  onChange={(event) => setDispatchSmsPhone(event.target.value)}
                  placeholder="01012345678"
                />
              </label>
              <label className={styles.modalFieldWide}>
                <span className={styles.label}>문자 내용</span>
                <textarea
                  className="app-textarea"
                  rows={5}
                  value={dispatchSmsMessage}
                  onChange={(event) => setDispatchSmsMessage(event.target.value)}
                />
              </label>
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => void handleSendSms()}
                  disabled={
                    dispatchSmsSending ||
                    !dispatchSmsPhone.trim() ||
                    !dispatchSmsMessage.trim() ||
                    smsProviderStatuses.some((provider) => !provider.sendEnabled)
                  }
                >
                  {dispatchSmsSending ? '문자 발송 중...' : '문자 발송'}
                </button>
              </div>
            </div>
            {buildDispatchMeta(dispatchRow).sentHistory.length === 0 ? (
              <div className={styles.tableEmpty}>기록된 발송 이력이 없습니다.</div>
            ) : (
              <div className={styles.tableShell}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>발송 시각</th>
                        <th>발송자</th>
                        <th>메모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildDispatchMeta(dispatchRow).sentHistory.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.sentAt)}</td>
                          <td>
                            {users.find((user) => user.id === item.sentByUserId)?.name || item.sentByUserId || '-'}
                          </td>
                          <td>{item.memo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </AppModal>

      <K2bImportModal
        contextHeadquarterId={headquarterFilter === 'all' ? null : headquarterFilter}
        contextSiteId={siteFilter === 'all' ? null : siteFilter}
        onClose={closeExcelUpload}
        onReload={handleReloadAfterK2b}
        open={k2bOpen}
        originSection="reports"
      />
    </section>
  );
}
