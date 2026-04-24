'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import { getMailAttachmentUnavailableReason, isMailAttachmentReady } from '@/lib/mail/reportAttachmentEligibility';
import type { InspectionSite } from '@/types/inspectionSession/session';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailboxReportOption, SelectedReportContext } from './mailboxPanelTypes';
import {
  doesReportOptionMatchSiteFilter,
  mapSafetyReportListItemToMailboxReportOption,
} from './mailboxReportPickerHelpers';
import {
  fetchCanonicalAdminMailboxReportOptions,
  fetchCanonicalAdminMailboxSelectedReport,
} from './adminMailboxReportData';

const ADMIN_REPORT_PICKER_PAGE_SIZE = 20;

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
  const [adminCanonicalReports, setAdminCanonicalReports] = useState<MailboxReportOption[]>([]);
  const [adminCanonicalReportTotal, setAdminCanonicalReportTotal] = useState(0);
  const [adminCanonicalReportsLoaded, setAdminCanonicalReportsLoaded] = useState(false);
  const [adminCanonicalReportsFailed, setAdminCanonicalReportsFailed] = useState(false);
  const [reportPickerPage, setReportPickerPage] = useState(1);
  const [workerModalReports, setWorkerModalReports] = useState<MailboxReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState<SelectedReportContext | null>(null);

  useEffect(() => {
    setSelectedReport(null);
    setReportSiteFilter(siteId || '');
  }, [siteId, reportKey]);

  const adminSiteById = useMemo(
    () => new Map(adminSites.map((item) => [item.id, item])),
    [adminSites],
  );
  const adminFallbackReportOptions = useMemo(
    () =>
      adminReports.map((item) => mapSafetyReportListItemToMailboxReportOption(item, adminSiteById)),
    [adminReports, adminSiteById],
  );
  const adminReportOptions = useMemo(() => {
    if (isDemoMode || !isAuthenticated || !isReady) {
      return adminFallbackReportOptions;
    }
    if (!adminCanonicalReportsLoaded && !adminCanonicalReportsFailed) {
      return [];
    }
    if (adminCanonicalReports.length > 0 || !adminCanonicalReportsFailed) {
      return adminCanonicalReports;
    }
    return adminFallbackReportOptions;
  }, [
    adminCanonicalReports,
    adminCanonicalReportsFailed,
    adminCanonicalReportsLoaded,
    adminFallbackReportOptions,
    isAuthenticated,
    isDemoMode,
    isReady,
  ]);
  const reportOptions = useMemo(
    () =>
      mode === 'admin'
        ? adminReportOptions
        : workerModalReports,
    [adminReportOptions, mode, workerModalReports],
  );

  useEffect(() => {
    setReportPickerPage(1);
  }, [reportPickerOpen, reportSearch, reportSiteFilter]);

  useEffect(() => {
    if (isDemoMode || mode !== 'admin' || !isAuthenticated || !isReady) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        setReportPickerLoading(true);
        const response = await fetchCanonicalAdminMailboxReportOptions({
          adminSiteById,
          page: reportPickerPage,
          reportPickerOpen,
          reportSearch,
          reportSiteFilter,
        });

        if (cancelled) return;
        setAdminCanonicalReports(response.options);
        setAdminCanonicalReportTotal(response.total);
        setAdminCanonicalReportsFailed(false);
        setAdminCanonicalReportsLoaded(true);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load admin mailbox report options', error);
          setAdminCanonicalReports([]);
          setAdminCanonicalReportTotal(0);
          setAdminCanonicalReportsFailed(true);
          setAdminCanonicalReportsLoaded(true);
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
    reportPickerPage,
    reportSearch,
    reportSiteFilter,
  ]);

  useEffect(() => {
    if (
      isDemoMode ||
      mode !== 'admin' ||
      !reportKey ||
      !isAuthenticated ||
      !isReady
    ) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const nextSelectedReport = await fetchCanonicalAdminMailboxSelectedReport({
          adminSiteById,
          reportKey,
          siteId,
        });
        if (!cancelled) {
          setSelectedReport(nextSelectedReport);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to hydrate canonical admin mailbox report selection', error);
          setSelectedReport(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adminSiteById, isAuthenticated, isDemoMode, isReady, mode, reportKey, siteId]);

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
              attachmentReady: isMailAttachmentReady({
                originalPdfAvailable: Boolean(item.originalPdfAvailable),
                reportKey: item.report_key,
                workflowStatus: item.workflow_status || item.status || null,
              }),
              attachmentUnavailableReason: getMailAttachmentUnavailableReason({
                originalPdfAvailable: Boolean(item.originalPdfAvailable),
                reportKey: item.report_key,
                workflowStatus: item.workflow_status || item.status || null,
              }),
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
              workflowStatus: item.workflow_status || item.status || null,
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
        current.attachmentReady === matchedReport.attachmentReady &&
        current.attachmentUnavailableReason === matchedReport.attachmentUnavailableReason &&
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
      .filter((item) => item.attachmentReady)
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

  const reportPickerTotal =
    mode === 'admin' && reportPickerOpen ? adminCanonicalReportTotal : filteredReportOptions.length;
  const reportPickerPageCount = Math.max(
    1,
    Math.ceil(reportPickerTotal / ADMIN_REPORT_PICKER_PAGE_SIZE),
  );

  return {
    filteredReportOptions,
    filteredReportOptionsByKey: new Map(
      filteredReportOptions.map((option) => [option.reportKey, option] as const),
    ),
    reportOptions,
    reportPickerPage,
    reportPickerPageCount,
    reportPickerLoading,
    reportSearch,
    reportSiteFilter,
    reportPickerTotal,
    selectedReport,
    setReportPickerPage,
    setReportSearch,
    setReportSiteFilter,
    setSelectedReport,
  };
}
