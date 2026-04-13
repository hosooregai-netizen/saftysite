'use client';

import { useCallback } from 'react';
import {
  exportAdminServerWorkbook,
  exportAdminWorkbook,
} from '@/lib/admin/exportClient';
import { getControllerReportTypeLabel } from '@/lib/admin/controllerReports';
import {
  convertHwpxBlobToPdfWithFallback,
  fetchBadWorkplaceHwpxDocumentByReportKey,
  fetchBadWorkplacePdfDocumentByReportKeyWithFallback,
  fetchInspectionHwpxDocumentByReportKey,
  fetchInspectionPdfDocumentByReportKeyWithFallback,
  fetchQuarterlyHwpxDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { formatDateOnly, formatDateTime } from './reportsSectionFilters';
import type { ControllerReportRow, TableSortState } from '@/types/admin';
import type { SafetyUser } from '@/types/backend';
import type { InspectionSession } from '@/types/inspectionSession';

interface UseReportDocumentActionsInput {
  assigneeFilter: string;
  dateFrom: string;
  dateTo: string;
  ensureSessionLoaded: (reportKey: string) => Promise<void>;
  getSessionById: (sessionId: string) => InspectionSession | null;
  headquarterFilter: string;
  qualityFilter: string;
  query: string;
  reportType: 'all' | ControllerReportRow['reportType'];
  rows: ControllerReportRow[];
  sessions: InspectionSession[];
  setError: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  siteFilter: string;
  sort: TableSortState;
  users: SafetyUser[];
}

export function useReportDocumentActions({
  assigneeFilter,
  dateFrom,
  dateTo,
  ensureSessionLoaded,
  getSessionById,
  headquarterFilter,
  qualityFilter,
  query,
  reportType,
  rows,
  sessions,
  setError,
  setNotice,
  siteFilter,
  sort,
  users,
}: UseReportDocumentActionsInput) {
  const exportReport = useCallback(
    async (row: ControllerReportRow, format: 'hwpx' | 'pdf') => {
      try {
        setError(null);
        const authToken = readSafetyAuthToken();
        if (authToken == null || authToken.trim().length === 0) {
          throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        }

        if (row.reportType === 'technical_guidance') {
          await ensureSessionLoaded(row.reportKey);
          const browserSession = getSessionById(row.reportKey);

          if (browserSession) {
            const siteSessions = sessions.filter((item) => item.siteKey === browserSession.siteKey);

            try {
              const document = await generateInspectionHwpxBlob(browserSession, siteSessions);

              if (format === 'hwpx') {
                saveBlobAsFile(document.blob, document.filename);
                setNotice('지도보고서를 내보냈습니다.');
              } else {
                const exported = await convertHwpxBlobToPdfWithFallback(
                  document.blob,
                  document.filename,
                );
                saveBlobAsFile(exported.blob, exported.filename);
                setNotice(
                  exported.fallbackToHwpx
                    ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.'
                    : '지도보고서를 내보냈습니다.',
                );
              }
              return;
            } catch (browserError) {
              console.warn('Inspection report browser export failed; falling back to server generation.', {
                error: browserError instanceof Error ? browserError.message : String(browserError),
                reportKey: row.reportKey,
              });
            }
          }

          try {
            if (format === 'hwpx') {
              const exported = await fetchInspectionHwpxDocumentByReportKey(row.reportKey, authToken);
              saveBlobAsFile(exported.blob, exported.filename);
              setNotice('지도보고서를 내보냈습니다.');
            } else {
              const exported = await fetchInspectionPdfDocumentByReportKeyWithFallback(
                row.reportKey,
                authToken,
              );
              saveBlobAsFile(exported.blob, exported.filename);
              setNotice(
                exported.fallbackToHwpx
                  ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.'
                  : '지도보고서를 내보냈습니다.',
              );
            }
            return;
          } catch (serverError) {
            console.warn('Inspection report server export failed; falling back to browser generation.', {
              error: serverError instanceof Error ? serverError.message : String(serverError),
              reportKey: row.reportKey,
            });
          }

          await ensureSessionLoaded(row.reportKey);
          const session = getSessionById(row.reportKey);
          if (!session) {
            throw new Error('지도보고서를 불러오지 못했습니다.');
          }

          const siteSessions = sessions.filter((item) => item.siteKey === session.siteKey);
          const document = await generateInspectionHwpxBlob(session, siteSessions);
          saveBlobAsFile(document.blob, document.filename);
          setNotice(
            format === 'pdf' ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.' : '지도보고서를 내보냈습니다.',
          );
          return;
        }

        if (row.reportType === 'quarterly_report') {
          if (format === 'hwpx') {
            const exported = await fetchQuarterlyHwpxDocumentByReportKey(row.reportKey, authToken);
            saveBlobAsFile(exported.blob, exported.filename);
            setNotice('분기 보고서를 내보냈습니다.');
          } else {
            const exported = await fetchQuarterlyPdfDocumentByReportKeyWithFallback(
              row.reportKey,
              authToken,
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

        if (row.reportType === 'bad_workplace') {
          if (format === 'hwpx') {
            const exported = await fetchBadWorkplaceHwpxDocumentByReportKey(row.reportKey, authToken);
            saveBlobAsFile(exported.blob, exported.filename);
            setNotice('불량사업장 신고서를 내보냈습니다.');
          } else {
            const exported = await fetchBadWorkplacePdfDocumentByReportKeyWithFallback(
              row.reportKey,
              authToken,
            );
            saveBlobAsFile(exported.blob, exported.filename);
            setNotice(
              exported.fallbackToHwpx
                ? 'PDF 변환에 실패해 HWPX로 내보냈습니다.'
                : '불량사업장 신고서를 내보냈습니다.',
            );
          }
          return;
        }

        throw new Error('지원되지 않는 보고서 유형입니다.');
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '보고서 내보내기에 실패했습니다.');
      }
    },
    [ensureSessionLoaded, getSessionById, sessions, setError, setNotice],
  );

  const exportList = useCallback(
    () =>
      exportAdminServerWorkbook('reports', {
        assignee_user_id: assigneeFilter === 'all' ? '' : assigneeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        headquarter_id: headquarterFilter === 'all' ? '' : headquarterFilter,
        quality_status: qualityFilter === 'all' ? '' : qualityFilter,
        query,
        report_type: reportType === 'all' ? '' : reportType,
        site_id: siteFilter === 'all' ? '' : siteFilter,
        sort_by: sort.key,
        sort_dir: sort.direction,
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
              { key: 'visitDate', label: '기준일' },
              { key: 'updatedAt', label: '수정일' },
              { key: 'deadlineDate', label: '마감일' },
              { key: 'qualityStatus', label: '품질체크' },
              { key: 'checkerUserId', label: '체크 담당자' },
            ],
            rows: rows.map((row) => ({
              assigneeName: row.assigneeName,
              checkerUserId: users.find((user) => user.id === row.checkerUserId)?.name || '',
              deadlineDate: row.deadlineDate,
              headquarterName: row.headquarterName,
              qualityStatus: row.qualityStatus,
              reportTitle: row.reportTitle || row.periodLabel || row.reportKey,
              reportType: getControllerReportTypeLabel(row.reportType),
              siteName: row.siteName,
              updatedAt: formatDateTime(row.updatedAt),
              visitDate: formatDateOnly(row.visitDate),
            })),
          },
        ]),
      ),
    [
      assigneeFilter,
      dateFrom,
      dateTo,
      headquarterFilter,
      qualityFilter,
      query,
      reportType,
      rows,
      siteFilter,
      sort.direction,
      sort.key,
      users,
    ],
  );

  return { exportList, exportReport };
}
