'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchSafetyReportList, readSafetyAuthToken } from '@/lib/safetyApi';
import type { InspectionSite } from '@/types/inspectionSession/session';
import type { SafetyReportListItem, SafetySite } from '@/types/backend';
import type { MailboxReportOption, SelectedReportContext } from './mailboxPanelTypes';

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
      adminReports.map((item) => {
        const matchedSite = adminSiteById.get(item.site_id);
        return {
          headquarterId: item.headquarter_id || '',
          headquarterName:
            matchedSite?.headquarter_detail?.name || matchedSite?.headquarter?.name || '',
          recipientEmail: matchedSite?.site_contact_email || '',
          documentKind: item.document_kind ?? null,
          meta: item.meta,
          reportKey: item.report_key,
          reportType: item.report_type ?? null,
          reportTitle: item.report_title,
          siteId: item.site_id,
          siteName: matchedSite?.site_name || item.site_id,
          updatedAt: item.updated_at,
          visitDate: item.visit_date,
        };
      }),
    [adminReports, adminSiteById],
  );
  const reportOptions = useMemo(
    () => (mode === 'admin' ? adminReportOptions : workerModalReports),
    [adminReportOptions, mode, workerModalReports],
  );

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
        current.headquarterName === matchedReport.headquarterName
      ) {
        return current;
      }
      return matchedReport;
    });
  }, [reportOptions, selectedReport]);

  const filteredReportOptions = useMemo(() => {
    const normalizedQuery = reportSearch.trim().toLowerCase();
    return reportOptions
      .filter((item) => (mode === 'admin' && reportSiteFilter ? item.siteId === reportSiteFilter : true))
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
  }, [mode, reportOptions, reportSearch, reportSiteFilter]);

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
