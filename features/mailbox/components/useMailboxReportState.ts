'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAdminReports } from '@/lib/admin/apiClient';
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import type { ControllerReportRow } from '@/types/admin';
import type { InspectionSite } from '@/types/inspectionSession/session';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailboxReportOption, SelectedReportContext } from './mailboxPanelTypes';
import {
  doesReportOptionMatchSiteFilter,
  mapAdminReportRowToMailboxReportOption,
  mapSafetyReportListItemToMailboxReportOption,
  mergeMailboxReportOptions,
} from './mailboxReportPickerHelpers';

const ADMIN_REPORT_PAGE_SIZE = 200;
const ADMIN_REPORT_OPTION_MAX = 1000;

interface UseMailboxReportStateParams {
  adminReports: SafetyReportListItem[];
  adminSites: SafetySite[];
  headquarterId: string;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isReady: boolean;
  mode: 'admin' | 'worker';
  reportKey: string;
  reportPickerOpen: boolean;
  siteId: string;
  workerSites: InspectionSite[];
}

export function useMailboxReportState({
  adminReports,
  adminSites,
  headquarterId,
  isAuthenticated,
  isDemoMode,
  isReady,
  mode,
  reportKey,
  reportPickerOpen,
  siteId,
  workerSites,
}: UseMailboxReportStateParams) {
  const [reportPickerLoading, setReportPickerLoading] = useState(false);
  const [reportSearch, setReportSearch] = useState('');
  const [reportSiteFilter, setReportSiteFilter] = useState('');
  const [adminModalReports, setAdminModalReports] = useState<MailboxReportOption[]>([]);
  const [workerModalReports, setWorkerModalReports] = useState<MailboxReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState<SelectedReportContext | null>(null);

  useEffect(() => {
    setSelectedReport(
      reportKey || siteId || headquarterId
        ? {
            headquarterId,
            headquarterName: '',
            recipientEmail: '',
            documentKind: null,
            meta: {},
            originalPdfAvailable: reportKey.startsWith('legacy:'),
            originalPdfDownloadPath: reportKey
              ? `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`
              : '',
            reportKey,
            reportType: null,
            reportTitle: reportKey || '보고서',
            siteId,
            siteName: '',
            updatedAt: null,
            visitDate: null,
          }
        : null,
    );
    setReportSiteFilter(siteId || '');
  }, [headquarterId, reportKey, siteId]);

  const adminSiteById = useMemo(
    () => new Map(adminSites.map((item) => [item.id, item])),
    [adminSites],
  );
  const adminReportOptions = useMemo(
    () =>
      adminReports.map((item) => mapSafetyReportListItemToMailboxReportOption(item, adminSiteById)),
    [adminReports, adminSiteById],
  );
  const reportOptions = useMemo(
    () =>
      mode === 'admin'
        ? adminModalReports.length > 0
          ? adminModalReports
          : adminReportOptions
        : workerModalReports,
    [adminModalReports, adminReportOptions, mode, workerModalReports],
  );

  useEffect(() => {
    if (isDemoMode || mode !== 'admin' || !reportPickerOpen || !isAuthenticated || !isReady) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setReportPickerLoading(true);
        const selectedSite = reportSiteFilter ? adminSiteById.get(reportSiteFilter) ?? null : null;
        const fetchRows = async (input: { query?: string; siteId?: string }) => {
          const rows: ControllerReportRow[] = [];
          for (let offset = 0; offset < ADMIN_REPORT_OPTION_MAX; offset += ADMIN_REPORT_PAGE_SIZE) {
            const response = await fetchAdminReports({
              limit: ADMIN_REPORT_PAGE_SIZE,
              offset,
              query: input.query,
              siteId: input.siteId,
              sortBy: 'updatedAt',
              sortDir: 'desc',
            });
            rows.push(...response.rows);
            if (rows.length >= response.total || response.rows.length < response.limit) {
              break;
            }
          }
          return rows;
        };
        const rows = await fetchRows({ siteId: reportSiteFilter || undefined });
        const fallbackRows =
          selectedSite?.site_name && reportSiteFilter
            ? await fetchRows({ query: selectedSite.site_name })
            : [];
        if (cancelled) return;
        setAdminModalReports(
          mergeMailboxReportOptions(
            [...rows, ...fallbackRows]
              .slice(0, ADMIN_REPORT_OPTION_MAX * (fallbackRows.length > 0 ? 2 : 1))
              .map((row) => mapAdminReportRowToMailboxReportOption(row, adminSiteById, selectedSite))
              .filter((option) =>
                doesReportOptionMatchSiteFilter(option, reportSiteFilter, selectedSite),
              ),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load admin mailbox report options', error);
        }
      } finally {
        if (!cancelled) {
          setReportPickerLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    adminSiteById,
    isAuthenticated,
    isDemoMode,
    isReady,
    mode,
    reportPickerOpen,
    reportSiteFilter,
  ]);

  useEffect(() => {
    if (isDemoMode || mode !== 'worker' || !reportPickerOpen || !isAuthenticated || !isReady) {
      return;
    }
    const token = readSafetyAuthToken();
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        setReportPickerLoading(true);
        const nextRows = await Promise.all(
          workerSites.map(async (workerSite) => {
            const reports = await fetchSafetyReportList(token, {
              activeOnly: true,
              limit: 200,
              siteId: workerSite.id,
            });
            return reports.map((item) => ({
              headquarterId: item.headquarter_id || workerSite.headquarterId || '',
              headquarterName: workerSite.customerName || '',
              recipientEmail: workerSite.adminSiteSnapshot.siteContactEmail || '',
              documentKind: item.document_kind ?? null,
              meta: item.meta,
              originalPdfAvailable: Boolean(item.originalPdfAvailable),
              originalPdfDownloadPath: item.originalPdfDownloadPath || '',
              reportKey: item.report_key,
              reportType: item.report_type ?? null,
              reportTitle: item.report_title,
              siteId: item.site_id,
              siteName: workerSite.siteName,
              updatedAt: item.updated_at,
              visitDate: item.visit_date,
            }));
          }),
        );
        if (!cancelled) {
          setWorkerModalReports(nextRows.flat());
        }
      } finally {
        if (!cancelled) {
          setReportPickerLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemoMode, isReady, mode, reportPickerOpen, workerSites]);

  useEffect(() => {
    if (!selectedReport) return;
    const matchedReport = reportOptions.find((item) =>
      selectedReport.reportKey
        ? item.reportKey === selectedReport.reportKey
        : item.siteId === selectedReport.siteId,
    );
    if (!matchedReport) return;
    setSelectedReport((current) => {
      if (!current) return current;
      if (
        current.reportTitle === matchedReport.reportTitle &&
        current.siteName === matchedReport.siteName &&
        current.headquarterName === matchedReport.headquarterName &&
        current.originalPdfAvailable === matchedReport.originalPdfAvailable &&
        current.originalPdfDownloadPath === matchedReport.originalPdfDownloadPath
      ) {
        return current;
      }
      return matchedReport;
    });
  }, [reportOptions, selectedReport]);

  const filteredReportOptions = useMemo(() => {
    const normalizedQuery = reportSearch.trim().toLowerCase();
    const selectedSite = reportSiteFilter ? adminSiteById.get(reportSiteFilter) ?? null : null;
    return reportOptions
      .filter((item) =>
        mode === 'admin'
          ? doesReportOptionMatchSiteFilter(item, reportSiteFilter, selectedSite)
          : true,
      )
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [
          item.reportTitle,
          item.reportKey,
          item.siteName,
          item.headquarterName,
          item.visitDate || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''));
  }, [adminSiteById, mode, reportOptions, reportSearch, reportSiteFilter]);

  return {
    filteredReportOptions,
    filteredReportOptionsByKey: new Map(
      filteredReportOptions.map((option) => [option.reportKey, option] as const),
    ),
    reportOptions,
    reportPickerLoading,
    reportSearch,
    reportSiteFilter,
    selectedReport,
    setReportSearch,
    setReportSiteFilter,
    setSelectedReport,
  };
}
