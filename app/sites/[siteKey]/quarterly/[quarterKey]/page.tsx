'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import { PageBackControl } from '@/components/navigation/PageBackControl';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import { ChartCard } from '@/components/session/workspace/widgets';
import {
  createFutureProcessRiskPlan,
  getSessionGuidanceDate,
} from '@/constants/inspectionSession';
import { FUTURE_PROCESS_LIBRARY } from '@/constants/inspectionSession/catalog';
import { createTimestamp, generateId } from '@/constants/inspectionSession/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import {
  fetchQuarterlyHwpxDocument,
  fetchQuarterlyPdfDocumentWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { isAdminUserRole } from '@/lib/admin';
import {
  applyQuarterlySummarySeed,
  buildInitialQuarterlySummaryReport,
  createQuarterlySummaryDraft,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import {
  buildQuarterlyTitleForPeriod,
  createQuarterKey,
  formatPeriodRangeLabel,
  getQuarterFromDate,
  getQuarterRange,
  parseDateValue,
} from '@/lib/erpReports/shared';
import {
  fetchQuarterlySummarySeed,
  fetchSafetyContentItems,
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import {
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
import { buildSiteQuarterlyListHref } from '@/features/home/lib/siteEntry';
import shellStyles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import type {
  SafetyContentItem,
  SafetyQuarterlySummarySeed,
  SafetyQuarterlySummarySeedSourceReport,
} from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface QuarterlyReportPageProps {
  params: Promise<{
    siteKey: string;
    quarterKey: string;
  }>;
}

interface QuarterlyReportEditorProps {
  currentSite: InspectionSite;
  initialDraft: QuarterlySummaryReport;
  isExistingReport: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
}

interface OpsAssetOption {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  fileUrl: string;
  fileName: string;
  type: SafetyContentItem['content_type'];
  sortOrder: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
}

export default function QuarterlyReportPage({ params }: QuarterlyReportPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { siteKey, quarterKey } = use(params);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedReportId = decodeURIComponent(quarterKey);
  const {
    sites,
    isReady,
    isAuthenticated,
    currentUser,
    authError,
    login,
    logout,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const { isSaving, error, saveQuarterlyReport } =
    useSiteOperationalReports(currentSite, false);
  const [existingReport, setExistingReport] = useState<QuarterlySummaryReport | null>(null);
  const [existingReportLoading, setExistingReportLoading] = useState(false);
  const [existingReportError, setExistingReportError] = useState<string | null>(null);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite ? buildSiteQuarterlyListHref(currentSite.id) : '/';
  const backLabel = '분기 종합 보고서 목록';
  useEffect(() => {
    if (!isReady || !isAuthenticated || !currentSite) {
      queueMicrotask(() => {
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError(null);
      });
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      queueMicrotask(() => {
        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setExistingReportLoading(true);
      setExistingReportError(null);
    });

    void fetchSafetyReportByKey(token, decodedReportId)
      .then((report) => {
        if (cancelled) {
          return;
        }

        const mappedReport = mapSafetyReportToQuarterlySummaryReport(report);
        setExistingReport(
          mappedReport && mappedReport.siteId === currentSite.id ? mappedReport : null,
        );
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        if (nextError instanceof SafetyApiError && nextError.status === 404) {
          setExistingReport(null);
          setExistingReportError(null);
          return;
        }

        setExistingReport(null);
        setExistingReportError(getQuarterlyPageErrorMessage(nextError));
      })
      .finally(() => {
        if (!cancelled) {
          setExistingReportLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSite, decodedReportId, isAuthenticated, isReady]);

  const initialDraft = useMemo(() => {
    if (!currentSite || existingReportLoading || existingReportError) return null;

    if (existingReport) {
      return buildInitialQuarterlySummaryReport(
        currentSite,
        [],
        currentUser?.name || currentSite.assigneeName,
        existingReport,
      );
    }

    return {
      ...createQuarterlySummaryDraft(
        currentSite,
        currentUser?.name || currentSite.assigneeName,
      ),
      id: decodedReportId,
    };
  }, [
    currentSite,
    currentUser?.name,
    decodedReportId,
    existingReport,
    existingReportError,
    existingReportLoading,
  ]);
  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            분기 보고서 초안을 불러오는 중입니다.
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="분기 보고서 로그인"
        description="분기 보고서를 작성하려면 다시 로그인해 주세요."
      />
    );
  }

  if (existingReportLoading) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>분기 보고서를 불러오는 중입니다.</section>
        </div>
      </main>
    );
  }

  if (existingReportError) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>{existingReportError}</section>
        </div>
      </main>
    );
  }

  if (!currentSite || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>
              현장 또는 보고서 정보를 확인하지 못했습니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${shellStyles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? '/admin' : '/'}
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel activeSection="headquarters" currentSiteKey={currentSite.id} />
              ) : (
                <WorkerMenuPanel currentSiteKey={currentSite.id} />
              )}
            </WorkerMenuSidebar>

            <div className={shellStyles.contentColumn}>
              <header className={shellStyles.hero}>
                <div className={shellStyles.heroBody}>
                  <PageBackControl href={backHref} label={backLabel} ariaLabel="이전 페이지로" />
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{initialDraft.title}</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <QuarterlyReportEditor
                  key={`${initialDraft.id}:${initialDraft.updatedAt}`}
                  currentSite={currentSite}
                  initialDraft={initialDraft}
                  isExistingReport={Boolean(existingReport)}
                  isSaving={isSaving}
                  error={error}
                  onSave={saveQuarterlyReport}
                />
              </div>
            </div>
          </WorkerShellBody>
        </section>
      </div>

      {isAdminView ? (
        <AdminMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSection="headquarters"
          currentSiteKey={currentSite.id}
        />
      ) : (
        <WorkerMenuDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          currentSiteKey={currentSite.id}
        />
      )}
    </main>
  );
}

function sortSourceReportsByDateDesc(
  reports: SafetyQuarterlySummarySeedSourceReport[],
) {
  return [...reports].sort((left, right) => {
    const leftTime = new Date(left.guidance_date || '').getTime();
    const rightTime = new Date(right.guidance_date || '').getTime();
    return rightTime - leftTime;
  });
}

function getQuarterlySourceReportTitle(
  report: SafetyQuarterlySummarySeedSourceReport,
) {
  return report.report_title || report.guidance_date || report.report_key;
}

function getQuarterlySessionReportTitle(session: InspectionSession) {
  if (session.meta.reportTitle?.trim()) {
    return session.meta.reportTitle.trim();
  }

  const guidanceDate = getSessionGuidanceDate(session);
  if (guidanceDate && Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `${guidanceDate} 보고서 ${session.reportNumber}`;
  }

  if (guidanceDate) {
    return guidanceDate;
  }

  if (Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `보고서 ${session.reportNumber}`;
  }

  return session.id;
}

function mapSessionToQuarterlySourceReport(
  session: InspectionSession,
): SafetyQuarterlySummarySeedSourceReport {
  return {
    report_key: session.id,
    report_title: getQuarterlySessionReportTitle(session),
    guidance_date: getSessionGuidanceDate(session),
    drafter: session.meta.drafter || '',
    progress_rate: session.document2Overview.progressRate || '',
    finding_count: session.document7Findings.length,
    improved_count: session.document4FollowUps.filter((item) => item.result === 'completed').length,
  };
}

function shouldUseLocalQuarterlySeedFallback(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

function buildLocalQuarterlySummarySeed(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  siteSessions: InspectionSession[],
  options?: {
    selectedReportKeys?: string[];
    explicitSelection?: boolean;
  },
): SafetyQuarterlySummarySeed {
  const normalizedSelectedKeys = Array.from(
    new Set((options?.selectedReportKeys ?? []).map((value) => value.trim()).filter(Boolean)),
  );
  const sourceSessions = [...siteSessions]
    .filter(
      (session) =>
        getSessionGuidanceDate(session) &&
        session.reportKind !== 'quarterly_summary' &&
        session.reportKind !== 'bad_workplace',
    )
    .filter((session) => {
      const guidanceDate = getSessionGuidanceDate(session);
      return guidanceDate >= report.periodStartDate && guidanceDate <= report.periodEndDate;
    })
    .sort((left, right) => {
      const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
      const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
      return rightTime - leftTime;
    });
  const selectedReportKeys =
    options?.explicitSelection || normalizedSelectedKeys.length > 0
      ? normalizedSelectedKeys
      : sourceSessions.map((session) => session.id);
  const derivedReport = syncQuarterlySummaryReportSources(
    report,
    site,
    siteSessions,
    selectedReportKeys,
    sourceSessions,
  );

  return {
    period_start_date: derivedReport.periodStartDate,
    period_end_date: derivedReport.periodEndDate,
    selected_report_keys: [...derivedReport.generatedFromSessionIds],
    source_reports: sourceSessions.map(mapSessionToQuarterlySourceReport),
    last_calculated_at: derivedReport.lastCalculatedAt,
    implementation_rows: derivedReport.implementationRows.map((row) => ({
      session_id: row.sessionId,
      report_title: row.reportTitle,
      report_date: row.reportDate,
      report_number: row.reportNumber,
      drafter: row.drafter,
      progress_rate: row.progressRate,
      finding_count: row.findingCount,
      improved_count: row.improvedCount,
      note: row.note,
    })),
    accident_stats: derivedReport.accidentStats.map((item) => ({ ...item })),
    causative_stats: derivedReport.causativeStats.map((item) => ({ ...item })),
    future_plans: derivedReport.futurePlans.map((item) => ({
      id: item.id,
      process_name: item.processName,
      hazard: item.hazard,
      countermeasure: item.countermeasure,
      note: item.note,
      source: item.source,
    })),
    major_measures: [...derivedReport.majorMeasures],
  };
}

function getQuarterlyPageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return '분기 원본 보고서를 불러오는 중 오류가 발생했습니다.';
  }

  return getSeedLoadErrorMessage(error);
}

function getSeedLoadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '분기 원본 보고서를 불러오는 중 오류가 발생했습니다.';
}

function normalizeIds(value: string[]) {
  return [...value].sort().join('|');
}

function formatDateTimeLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ko-KR', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQuarterSelectionTarget(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  if (report.year > 0 && report.quarter >= 1 && report.quarter <= 4) {
    return {
      year: report.year,
      quarter: report.quarter,
    };
  }

  const startDate = parseDateValue(report.periodStartDate);
  if (startDate) {
    return {
      year: startDate.getFullYear(),
      quarter: getQuarterFromDate(startDate),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: getQuarterFromDate(today),
  };
}

function normalizeOpsDateValue(value: string | null | undefined): string {
  if (!value) return '';
  const normalized = value.trim();
  if (!normalized) return '';

  const directMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function getQuarterlyDraftFingerprint(report: QuarterlySummaryReport) {
  return JSON.stringify({
    ...report,
    updatedAt: '',
  });
}

function createEmptyImplementationRow() {
  return {
    sessionId: generateId('quarterly-row'),
    reportTitle: '',
    reportDate: '',
    reportNumber: 0,
    drafter: '',
    progressRate: '',
    findingCount: 0,
    improvedCount: 0,
    note: '',
  };
}

function mapContentItemToOpsAsset(item: SafetyContentItem): OpsAssetOption {
  return {
    id: item.id,
    title: item.title,
    description: contentBodyToText(item.body),
    previewUrl: contentBodyToImageUrl(item.body) || contentBodyToAssetUrl(item.body),
    fileUrl: contentBodyToAssetUrl(item.body),
    fileName: contentBodyToAssetName(item.body),
    type: item.content_type,
    sortOrder: item.sort_order,
    effectiveFrom: item.effective_from,
    effectiveTo: item.effective_to,
    isActive: item.is_active,
  };
}

function isOpsAssetEffectiveForDate(asset: OpsAssetOption, reportDate: string): boolean {
  if (!asset.isActive) {
    return false;
  }

  const target = normalizeOpsDateValue(reportDate);
  if (!target) {
    return true;
  }

  const start = normalizeOpsDateValue(asset.effectiveFrom);
  const end = normalizeOpsDateValue(asset.effectiveTo);

  if (start && target < start) {
    return false;
  }
  if (end && target > end) {
    return false;
  }

  return true;
}

function getQuarterlyOpsMatchDate(report: QuarterlySummaryReport): string {
  return report.periodEndDate || report.periodStartDate || report.updatedAt || '';
}

function getAutoMatchedOpsAsset(
  items: OpsAssetOption[],
  report: QuarterlySummaryReport,
): OpsAssetOption | null {
  const reportDate = getQuarterlyOpsMatchDate(report);

  return (
    [...items]
      .filter((item) => isOpsAssetEffectiveForDate(item, reportDate))
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'ko'),
      )[0] ?? null
  );
}

function clearQuarterlyOpsAsset(report: QuarterlySummaryReport): QuarterlySummaryReport {
  return {
    ...report,
    opsAssetId: '',
    opsAssetTitle: '',
    opsAssetDescription: '',
    opsAssetPreviewUrl: '',
    opsAssetFileUrl: '',
    opsAssetFileName: '',
    opsAssetType: '',
    opsAssignedBy: '',
    opsAssignedAt: '',
  };
}

function applyQuarterlyOpsAsset(
  report: QuarterlySummaryReport,
  asset: OpsAssetOption | null,
): QuarterlySummaryReport {
  if (!asset) {
    return clearQuarterlyOpsAsset(report);
  }

  return {
    ...report,
    opsAssetId: asset.id,
    opsAssetTitle: asset.title,
    opsAssetDescription: asset.description,
    opsAssetPreviewUrl: asset.previewUrl,
    opsAssetFileUrl: asset.fileUrl,
    opsAssetFileName: asset.fileName,
    opsAssetType: asset.type,
    opsAssignedBy: '',
    opsAssignedAt: '',
  };
}

function hasSameQuarterlyOpsAsset(
  report: QuarterlySummaryReport,
  asset: OpsAssetOption | null,
): boolean {
  if (!asset) {
    return !(
      report.opsAssetId ||
      report.opsAssetTitle ||
      report.opsAssetDescription ||
      report.opsAssetPreviewUrl ||
      report.opsAssetFileUrl ||
      report.opsAssetFileName ||
      report.opsAssetType ||
      report.opsAssignedBy ||
      report.opsAssignedAt
    );
  }

  return (
    report.opsAssetId === asset.id &&
    report.opsAssetTitle === asset.title &&
    report.opsAssetDescription === asset.description &&
    report.opsAssetPreviewUrl === asset.previewUrl &&
    report.opsAssetFileUrl === asset.fileUrl &&
    report.opsAssetFileName === asset.fileName &&
    report.opsAssetType === asset.type &&
    report.opsAssignedBy === '' &&
    report.opsAssignedAt === ''
  );
}

function QuarterlyReportEditor({
  currentSite,
  initialDraft,
  isExistingReport,
  isSaving,
  error,
  onSave,
}: QuarterlyReportEditorProps) {
  const { getSessionsBySiteId, ensureSiteReportsLoaded } = useInspectionSessions();
  const [draft, setDraft] = useState(initialDraft);
  const [sourceReports, setSourceReports] = useState<
    SafetyQuarterlySummarySeedSourceReport[]
  >([]);
  const [sourceReportsLoading, setSourceReportsLoading] = useState(false);
  const [sourceReportsError, setSourceReportsError] = useState<string | null>(null);
  const [selectedSourceReportKeys, setSelectedSourceReportKeys] = useState(() =>
    initialDraft.generatedFromSessionIds,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [titleEditorOpen, setTitleEditorOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialDraft.title);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [opsAssets, setOpsAssets] = useState<OpsAssetOption[]>([]);
  const [opsLoaded, setOpsLoaded] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const lastPersistedDraftFingerprintRef = useRef(getQuarterlyDraftFingerprint(initialDraft));
  const draftRef = useRef(initialDraft);
  const sourceReportsRef = useRef<SafetyQuarterlySummarySeedSourceReport[]>([]);
  const selectedSourceReportKeysRef = useRef(initialDraft.generatedFromSessionIds);
  const draftFingerprint = useMemo(() => getQuarterlyDraftFingerprint(draft), [draft]);
  const isGeneratingDocument = isGeneratingHwpx || isGeneratingPdf;
  const availableSourceReports = useMemo(
    () => sortSourceReportsByDateDesc(sourceReports),
    [sourceReports],
  );

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    sourceReportsRef.current = sourceReports;
  }, [sourceReports]);

  useEffect(() => {
    selectedSourceReportKeysRef.current = selectedSourceReportKeys;
  }, [selectedSourceReportKeys]);

  const syncSourceReports = useCallback(
    async (
      nextDraft: QuarterlySummaryReport,
      options?: {
        explicitSelection?: boolean;
        optimistic?: boolean;
        selectedReportKeys?: string[];
        successNotice?: string | null;
      },
    ) => {
      if (
        !nextDraft.periodStartDate ||
        !nextDraft.periodEndDate ||
        nextDraft.periodStartDate > nextDraft.periodEndDate
      ) {
        if (options?.optimistic) {
          setDraft(nextDraft);
        }
        setSourceReports([]);
        setSelectedSourceReportKeys([]);
        setSourceReportsError(null);
        setSourceReportsLoading(false);
        if (options?.successNotice !== undefined) {
          setNotice(options.successNotice);
        }
        return false;
      }

      const token = readSafetyAuthToken();
      if (!token) {
        setSourceReportsError('濡쒓렇?몄씠 留뚮즺?섏뿀?듬땲?? ?ㅼ떆 濡쒓렇?명빐 二쇱꽭??');
        return false;
      }

      const previousDraft = draftRef.current;
      const previousSourceReports = sourceReportsRef.current;
      const previousSelectedSourceReportKeys = selectedSourceReportKeysRef.current;

      if (options?.optimistic) {
        setDraft(nextDraft);
        setSourceReports([]);
        setSelectedSourceReportKeys(options.selectedReportKeys ?? []);
      }

      setSourceReportsLoading(true);
      setSourceReportsError(null);

      try {
        let seed: SafetyQuarterlySummarySeed;
        try {
          seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
            periodStartDate: nextDraft.periodStartDate,
            periodEndDate: nextDraft.periodEndDate,
            selectedReportKeys: options?.selectedReportKeys,
            explicitSelection: options?.explicitSelection,
          });
        } catch (seedError) {
          if (!shouldUseLocalQuarterlySeedFallback(seedError)) {
            throw seedError;
          }

          await ensureSiteReportsLoaded(currentSite.id);
          seed = buildLocalQuarterlySummarySeed(
            nextDraft,
            currentSite,
            getSessionsBySiteId(currentSite.id),
            {
              selectedReportKeys: options?.selectedReportKeys,
              explicitSelection: options?.explicitSelection,
            },
          );
        }

        setSourceReports(seed.source_reports);
        setSelectedSourceReportKeys(seed.selected_report_keys);
        setDraft((current) =>
          applyQuarterlySummarySeed(
            {
              ...current,
              title: nextDraft.title,
              periodStartDate: nextDraft.periodStartDate,
              periodEndDate: nextDraft.periodEndDate,
              quarterKey: nextDraft.quarterKey,
              year: nextDraft.year,
              quarter: nextDraft.quarter,
            },
            seed,
          ),
        );
        if (options?.successNotice !== undefined) {
          setNotice(options.successNotice);
        }
        return true;
      } catch (nextError) {
        if (options?.optimistic) {
          setDraft(previousDraft);
          setSourceReports(previousSourceReports);
          setSelectedSourceReportKeys(previousSelectedSourceReportKeys);
        }
        setSourceReportsError(getQuarterlyPageErrorMessage(nextError));
        return false;
      } finally {
        setSourceReportsLoading(false);
      }
    },
    [currentSite, ensureSiteReportsLoaded, getSessionsBySiteId],
  );

  useEffect(() => {
    setDraft(initialDraft);
    setTitleDraft(initialDraft.title);
    setSourceReports([]);
    setSourceReportsError(null);
    setSelectedSourceReportKeys(initialDraft.generatedFromSessionIds);
    lastPersistedDraftFingerprintRef.current = getQuarterlyDraftFingerprint(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    if (!initialDraft.periodStartDate || !initialDraft.periodEndDate) {
      setSourceReports([]);
      setSourceReportsError(null);
      setSelectedSourceReportKeys([]);
      return;
    }

    void syncSourceReports(initialDraft, {
      explicitSelection: isExistingReport,
      selectedReportKeys: initialDraft.generatedFromSessionIds,
    });
  }, [initialDraft, isExistingReport, syncSourceReports]);

  useEffect(() => {
    let cancelled = false;

    const loadOpsAssets = async () => {
      setOpsLoading(true);
      setOpsError(null);
      try {
        const token = readSafetyAuthToken();
        if (!token) throw new Error('肄섑뀗痢좊? 遺덈윭?ㅻ젮硫??ㅼ떆 濡쒓렇?명빐 二쇱꽭??');
        const contentItems = await fetchSafetyContentItems(token);
        if (cancelled) return;
        setOpsAssets(
          contentItems
            .filter((item) => item.content_type === 'campaign_template')
            .sort(
              (left, right) =>
                left.sort_order - right.sort_order || left.title.localeCompare(right.title, 'ko'),
            )
            .map(mapContentItemToOpsAsset),
        );
      } catch (nextError) {
        if (cancelled) return;
        setOpsError(
          nextError instanceof Error
            ? nextError.message
            : 'OPS 자료를 불러오는 중 오류가 발생했습니다.',
        );
      } finally {
        if (!cancelled) {
          setOpsLoading(false);
          setOpsLoaded(true);
        }
      }
    };

    void loadOpsAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSourceSet = useMemo(
    () => new Set(selectedSourceReportKeys),
    [selectedSourceReportKeys],
  );
  const hasPendingSelectionChanges =
    normalizeIds(selectedSourceReportKeys) !== normalizeIds(draft.generatedFromSessionIds);
  const autoMatchedOpsAsset = useMemo(() => {
    if (!opsLoaded || opsError) {
      return null;
    }
    return getAutoMatchedOpsAsset(opsAssets, draft);
  }, [draft, opsAssets, opsError, opsLoaded]);

  useEffect(() => {
    if (!opsLoaded || opsError) {
      return;
    }

    setDraft((current) => {
      if (hasSameQuarterlyOpsAsset(current, autoMatchedOpsAsset)) {
        return current;
      }

      return applyQuarterlyOpsAsset(current, autoMatchedOpsAsset);
    });
  }, [autoMatchedOpsAsset, opsError, opsLoaded]);

  useEffect(() => {
    if (
      draftFingerprint === lastPersistedDraftFingerprintRef.current ||
      isSaving ||
      sourceReportsLoading ||
      !draft.periodStartDate ||
      !draft.periodEndDate ||
      draft.periodStartDate > draft.periodEndDate
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextDraft = { ...draft, updatedAt: createTimestamp() };
      void onSave(nextDraft)
        .then(() => {
          lastPersistedDraftFingerprintRef.current = draftFingerprint;
        })
        .catch(() => {
          // Error state is surfaced by the shared operational report hook.
        });
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, draftFingerprint, isSaving, onSave, sourceReportsLoading]);

  const handleDownloadWord = async () => {
    try {
      setDocumentError(null);
      setIsGeneratingHwpx(true);
      const { blob, filename } = await fetchQuarterlyHwpxDocument(draft, currentSite);
      saveBlobAsFile(blob, filename);
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error ? nextError.message : '문서를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDocumentError(null);
      setNotice(null);
      setIsGeneratingPdf(true);
      const { blob, fallbackToHwpx, filename } = await fetchQuarterlyPdfDocumentWithFallback(
        draft,
        currentSite,
      );
      saveBlobAsFile(blob, filename);
      if (fallbackToHwpx) {
        setNotice('PDF 변환에 실패해 HWPX로 다운로드했습니다.');
      }
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error ? nextError.message : 'PDF를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleToggleSourceReport = (reportKey: string, checked: boolean) => {
    setSelectedSourceReportKeys((current) => {
      if (checked) return current.includes(reportKey) ? current : [...current, reportKey];
      return current.filter((item) => item !== reportKey);
    });
  };

  const handleApplySourceSelection = useCallback(async () => {
    return syncSourceReports(draftRef.current, {
      explicitSelection: true,
      selectedReportKeys: selectedSourceReportKeysRef.current,
      successNotice:
        selectedSourceReportKeysRef.current.length > 0
          ? `선택한 지도 보고서 ${selectedSourceReportKeysRef.current.length}건을 반영했습니다.`
          : '선택한 지도 보고서가 없습니다.',
    });
  }, [syncSourceReports]);

  const handlePeriodChange = (
    field: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    const nextDraft = {
      ...draftRef.current,
      [field]: value,
    };
    setNotice(null);

    if (
      !nextDraft.periodStartDate ||
      !nextDraft.periodEndDate ||
      nextDraft.periodStartDate > nextDraft.periodEndDate
    ) {
      setDraft(nextDraft);
      setSourceReports([]);
      setSourceReportsError(null);
      setSelectedSourceReportKeys([]);
      return;
    }

    void syncSourceReports(nextDraft, {
      optimistic: true,
      successNotice: null,
    });
  };

  const handleQuarterChange = (value: string) => {
    const nextQuarter = Number.parseInt(value, 10);
    if (nextQuarter < 1 || nextQuarter > 4) {
      return;
    }

    const currentQuarterTarget = getQuarterSelectionTarget(draftRef.current);
    const nextRange = getQuarterRange(currentQuarterTarget.year, nextQuarter);
    const currentAutoTitle = buildQuarterlyTitleForPeriod(
      draftRef.current.periodStartDate,
      draftRef.current.periodEndDate,
    );
    const shouldSyncTitle =
      !draftRef.current.title.trim() || draftRef.current.title.trim() === currentAutoTitle;
    const nextDraft = {
      ...draftRef.current,
      title: shouldSyncTitle
        ? buildQuarterlyTitleForPeriod(nextRange.startDate, nextRange.endDate)
        : draftRef.current.title,
      periodStartDate: nextRange.startDate,
      periodEndDate: nextRange.endDate,
      quarterKey: createQuarterKey(currentQuarterTarget.year, nextQuarter),
      year: currentQuarterTarget.year,
      quarter: nextQuarter,
    };
    setNotice(null);

    void syncSourceReports(nextDraft, {
      optimistic: true,
      successNotice: null,
    });
  };

  const handleOpenTitleEditor = () => {
    setTitleDraft(draft.title);
    setTitleEditorOpen(true);
  };

  const handleCloseTitleEditor = () => {
    setTitleEditorOpen(false);
    setTitleDraft(draft.title);
  };

  const handleApplyTitle = () => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle || nextTitle === draft.title) {
      setTitleEditorOpen(false);
      setTitleDraft(draft.title);
      return;
    }

    setDraft((current) => ({ ...current, title: nextTitle }));
    setNotice('보고서 제목을 수정했습니다.');
    setTitleEditorOpen(false);
  };

  const updateSiteSnapshotField = (
    field: keyof QuarterlySummaryReport['siteSnapshot'],
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      siteSnapshot: {
        ...current.siteSnapshot,
        [field]: value,
      },
    }));
  };

  const handleImplementationRowChange = (
    index: number,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      implementationRows: current.implementationRows.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === 'reportNumber' ||
                field === 'findingCount' ||
                field === 'improvedCount'
                  ? Number(value || 0)
                  : value,
            }
          : item,
      ),
    }));
  };

  return (
    <section className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}>
      <QuarterlySummaryToolbar
        draft={draft}
        isGeneratingDocument={isGeneratingDocument}
        isGeneratingHwpx={isGeneratingHwpx}
        isGeneratingPdf={isGeneratingPdf}
        onDownloadWord={handleDownloadWord}
        onDownloadPdf={handleDownloadPdf}
        onOpenTitleEditor={handleOpenTitleEditor}
      />
      <QuarterlySummaryCards
        draft={draft}
        error={error}
        documentError={documentError}
        notice={notice}
      />
      <QuarterlySourceSelectionSection
        periodStartDate={draft.periodStartDate}
        periodEndDate={draft.periodEndDate}
        selectedQuarter={String(getQuarterSelectionTarget(draft).quarter)}
        sourceReports={availableSourceReports}
        error={sourceReportsError}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        onChangePeriod={handlePeriodChange}
        onChangeQuarter={handleQuarterChange}
        onOpenSelector={() => setSourceModalOpen(true)}
        onRecalculate={handleApplySourceSelection}
      />
      <QuarterlySourceSelectionModal
        open={sourceModalOpen}
        sourceReports={availableSourceReports}
        error={sourceReportsError}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        selectedSourceReportKeys={selectedSourceReportKeys}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        onClose={() => setSourceModalOpen(false)}
        onToggleSourceReport={handleToggleSourceReport}
        onSelectAll={() =>
          setSelectedSourceReportKeys(availableSourceReports.map((report) => report.report_key))
        }
        onClearSelection={() => setSelectedSourceReportKeys([])}
        onRecalculate={async () => {
          const didApply = await handleApplySourceSelection();
          if (didApply) {
            setSourceModalOpen(false);
          }
        }}
      />
      <QuarterlySiteSnapshotSection
        draft={draft}
        onChange={updateSiteSnapshotField}
      />
      <QuarterlyStatsSection draft={draft} />
      <QuarterlyImplementationSection
        rows={draft.implementationRows}
        onChange={handleImplementationRowChange}
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            implementationRows: [...current.implementationRows, createEmptyImplementationRow()],
          }))
        }
        onRemove={(index) =>
          setDraft((current) => ({
            ...current,
            implementationRows: current.implementationRows.filter((_, itemIndex) => itemIndex !== index),
          }))
        }
      />
      <QuarterlyFuturePlansSection
        plans={draft.futurePlans}
        onAdd={() =>
          setDraft((current) => ({
            ...current,
            futurePlans: [...current.futurePlans, createFutureProcessRiskPlan()],
          }))
        }
        onChange={(nextPlans) => setDraft((current) => ({ ...current, futurePlans: nextPlans }))}
      />
      <QuarterlyOpsSection
        draft={draft}
        loading={opsLoading}
        error={opsError}
      />
      <AppModal
        open={titleEditorOpen}
        title="보고서 제목 수정"
        onClose={handleCloseTitleEditor}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={handleCloseTitleEditor}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={handleApplyTitle}
              disabled={!titleDraft.trim()}
            >
              저장
            </button>
          </>
        }
      >
        <FieldInput
          label="보고서 제목"
          value={titleDraft}
          onChange={setTitleDraft}
          placeholder="예: 2026년 2분기 종합보고서"
        />
      </AppModal>
    </section>
  );
}

function SectionHeader(props: { title: string; chips?: string[]; description?: string }) {
  return (
    <>
      <div className={operationalStyles.reportCardHeader}>
        <strong className={operationalStyles.reportCardTitle}>{props.title}</strong>
        {props.chips && props.chips.length > 0 ? (
          <div className={operationalStyles.statusRow}>
            {props.chips.map((chip) => (
              <span key={chip} className="app-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {props.description ? (
        <p className={operationalStyles.reportCardDescription}>{props.description}</p>
      ) : null}
    </>
  );
}

function QuarterlySummaryToolbar(props: {
  draft: QuarterlySummaryReport;
  isGeneratingDocument: boolean;
  isGeneratingHwpx: boolean;
  isGeneratingPdf: boolean;
  onDownloadWord: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onOpenTitleEditor: () => void;
}) {
  const {
    draft,
    isGeneratingDocument,
    isGeneratingHwpx,
    isGeneratingPdf,
    onDownloadWord,
    onDownloadPdf,
    onOpenTitleEditor,
  } = props;

  return (
    <div className={operationalStyles.toolbar}>
      <div className={operationalStyles.toolbarHeading}>
        <div>
          <h1 className={operationalStyles.sectionTitle}>{draft.title}</h1>
        </div>
        <button
          type="button"
          className={operationalStyles.toolbarIconButton}
          onClick={onOpenTitleEditor}
          aria-label="보고서 제목 수정"
          title="보고서 제목 수정"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={operationalStyles.toolbarIcon}
          >
            <path
              d="M13.8 3.2a2 2 0 0 1 2.9 2.7l-.1.1-8 8a1 1 0 0 1-.5.3l-3 .7a.8.8 0 0 1-1-.9l.7-3a1 1 0 0 1 .2-.4l.1-.1 8-8Zm-7.7 8.6-.4 1.7 1.7-.4 7.7-7.7-1.3-1.3-7.7 7.7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => void onDownloadWord()}
          disabled={isGeneratingDocument}
        >
          {isGeneratingHwpx ? 'HWPX 생성 중...' : '문서 다운로드 (.hwpx)'}
        </button>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => void onDownloadPdf()}
          disabled={isGeneratingDocument}
        >
          {isGeneratingPdf ? 'PDF 생성 중...' : '문서 다운로드 (.pdf)'}
        </button>
      </div>
    </div>
  );
}

function QuarterlySummaryCards(props: {
  draft: QuarterlySummaryReport;
  error: string | null;
  documentError: string | null;
  notice: string | null;
}) {
  const { draft, error, documentError, notice } = props;

  return (
    <>
      <section className={operationalStyles.summaryListPanel} aria-label="분기 종합 보고서 요약">
        <dl className={operationalStyles.summaryList}>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>현장</dt>
            <dd className={operationalStyles.summaryListValue}>
              {draft.siteSnapshot.siteName || '-'}
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>선택 보고서</dt>
            <dd className={operationalStyles.summaryListValue}>
              {draft.generatedFromSessionIds.length}건
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>수정일</dt>
            <dd className={operationalStyles.summaryListValue}>
              {formatDateTimeLabel(draft.updatedAt || draft.lastCalculatedAt)}
            </dd>
          </div>
          <div className={operationalStyles.summaryListItem}>
            <dt className={operationalStyles.summaryListTerm}>기간</dt>
            <dd className={operationalStyles.summaryListValue}>
              {formatPeriodRangeLabel(draft.periodStartDate, draft.periodEndDate)}
            </dd>
          </div>
        </dl>
      </section>
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}
    </>
  );
}

function QuarterlySourceSelectionSection(props: {
  periodStartDate: string;
  periodEndDate: string;
  selectedQuarter: string;
  sourceReports: SafetyQuarterlySummarySeedSourceReport[];
  error: string | null;
  loading: boolean;
  selectedSourceSet: Set<string>;
  hasPendingSelectionChanges: boolean;
  onChangePeriod: (field: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onChangeQuarter: (value: string) => void;
  onOpenSelector: () => void;
  onRecalculate: () => Promise<boolean>;
}) {
  const {
    periodStartDate,
    periodEndDate,
    selectedQuarter,
    sourceReports,
    error,
    loading,
    selectedSourceSet,
    hasPendingSelectionChanges,
    onChangePeriod,
    onChangeQuarter,
    onOpenSelector,
    onRecalculate,
  } = props;
  const selectedReports = sourceReports.filter((report) =>
    selectedSourceSet.has(report.report_key),
  );
  const previewReports = selectedReports.slice(0, 3);

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="1. 원본 보고서 선택" />
      <div className={operationalStyles.periodFieldGrid}>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>분기</span>
          <select
            className={`app-select ${operationalStyles.periodQuarterSelect}`}
            value={selectedQuarter}
            onChange={(event) => onChangeQuarter(event.target.value)}
            aria-label="분기"
            disabled={loading}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>시작일</span>
          <input
            className="app-input"
            type="date"
            value={periodStartDate}
            onChange={(event) => onChangePeriod('periodStartDate', event.target.value)}
            disabled={loading}
          />
        </label>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>종료일</span>
          <input
            className="app-input"
            type="date"
            value={periodEndDate}
            onChange={(event) => onChangePeriod('periodEndDate', event.target.value)}
            disabled={loading}
          />
        </label>
      </div>

      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}

      {sourceReports.length > 0 ? (
        <div className={operationalStyles.inlineEditorRow}>
          {previewReports.length > 0 ? (
            <div className={operationalStyles.tagList}>
              {previewReports.map((report) => (
                <span key={report.report_key} className={operationalStyles.tag}>
                  {getQuarterlySourceReportTitle(report)}
                </span>
              ))}
              {selectedReports.length > previewReports.length ? (
                <span className={operationalStyles.tag}>
                  +{selectedReports.length - previewReports.length}건
                </span>
              ) : null}
            </div>
          ) : (
            <div className={operationalStyles.muted}>선택된 원본 보고서가 없습니다.</div>
          )}
          <div className={operationalStyles.inlineEditorActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onOpenSelector}
              disabled={loading}
            >
              보고서 선택
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void onRecalculate()}
              disabled={!hasPendingSelectionChanges || loading}
            >
              다시 계산
            </button>
          </div>
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading
            ? '해당 현장 원본 보고서를 불러오는 중입니다.'
            : '선택 가능한 원본 보고서가 없습니다.'}
        </div>
      )}
    </article>
  );
}

function QuarterlySourceSelectionModal(props: {
  open: boolean;
  sourceReports: SafetyQuarterlySummarySeedSourceReport[];
  error: string | null;
  loading: boolean;
  selectedSourceSet: Set<string>;
  selectedSourceReportKeys: string[];
  hasPendingSelectionChanges: boolean;
  onClose: () => void;
  onToggleSourceReport: (reportKey: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRecalculate: () => Promise<void>;
}) {
  const {
    open,
    sourceReports,
    error,
    loading,
    selectedSourceSet,
    selectedSourceReportKeys,
    hasPendingSelectionChanges,
    onClose,
    onToggleSourceReport,
    onSelectAll,
    onClearSelection,
    onRecalculate,
  } = props;

  return (
    <AppModal
      open={open}
      title="원본 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onSelectAll}
            disabled={loading}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClearSelection}
            disabled={loading}
          >
            선택 해제
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void onRecalculate()}
            disabled={!hasPendingSelectionChanges || loading}
          >
            다시 계산
          </button>
        </>
      }
    >
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {selectedSourceReportKeys.length === 0 ? (
        <div className={operationalStyles.bannerInfo}>선택된 원본 보고서가 없습니다.</div>
      ) : null}
      {sourceReports.length > 0 ? (
        <div className={operationalStyles.sourceModalList}>
          {sourceReports.map((report) => {
            const isSelected = selectedSourceSet.has(report.report_key);

            return (
              <article
                key={report.report_key}
                className={`${operationalStyles.sourceModalRow} ${
                  isSelected ? operationalStyles.sourceModalRowActive : ''
                }`}
              >
                <label className={operationalStyles.sourceModalRowMain}>
                  <input
                    type="checkbox"
                    className={`app-checkbox ${operationalStyles.sourceCheckbox}`}
                    checked={isSelected}
                    disabled={loading}
                    onChange={(event) =>
                      onToggleSourceReport(report.report_key, event.target.checked)
                    }
                  />
                  <div className={operationalStyles.sourceCardBody}>
                    <strong className={operationalStyles.sourceCardTitle}>
                      {getQuarterlySourceReportTitle(report)}
                    </strong>
                    <span className={operationalStyles.sourceCardMeta}>
                      지도일 {report.guidance_date || '-'} / 작성자 {report.drafter || '-'} /
                      진행률 {report.progress_rate || '-'} / 지적사항 {report.finding_count}건 /
                      개선 {report.improved_count}건
                    </span>
                  </div>
                </label>
                <div className={operationalStyles.sourceModalRowActions}>
                  <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  <Link
                    href={`/sessions/${encodeURIComponent(report.report_key)}`}
                    className={`${operationalStyles.linkButton} ${operationalStyles.linkButtonSecondary}`}
                  >
                    원본 보기
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading
            ? '해당 현장 원본 보고서를 불러오는 중입니다.'
            : '선택 가능한 원본 보고서가 없습니다.'}
        </div>
      )}
    </AppModal>
  );
}

function QuarterlySiteSnapshotSection(props: {
  draft: QuarterlySummaryReport;
  onChange: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}) {
  const { draft, onChange } = props;
  const handleSiteManagementNumberChange = (value: string) => {
    onChange('siteManagementNumber', value);
    onChange('businessStartNumber', value);
  };
  const handleCorporationNumberChange = (value: string) => {
    onChange('corporationRegistrationNumber', value);
    onChange('businessRegistrationNumber', value);
  };

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="1. 기술지도 사업장 개요" />
      <div className={operationalStyles.snapshotSectionGrid}>
        <section className={operationalStyles.snapshotPanel}>
          <h3 className={operationalStyles.snapshotPanelTitle}>현장</h3>
          <div className={operationalStyles.snapshotTableWrap}>
            <table className={operationalStyles.snapshotTable}>
              <colgroup>
                <col className={operationalStyles.snapshotLabelCol} />
                <col className={operationalStyles.snapshotValueCol} />
                <col className={operationalStyles.snapshotLabelCol} />
                <col className={operationalStyles.snapshotValueCol} />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    현장명
                  </th>
                  <SnapshotInputCell
                    label="현장명"
                    value={draft.siteSnapshot.siteName}
                    onChange={(value) => onChange('siteName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    사업장관리번호
                  </th>
                  <SnapshotInputCell
                    label="사업장관리번호"
                    value={draft.siteSnapshot.siteManagementNumber || draft.siteSnapshot.businessStartNumber}
                    onChange={handleSiteManagementNumberChange}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    공사기간
                  </th>
                  <SnapshotInputCell
                    label="공사기간"
                    value={draft.siteSnapshot.constructionPeriod}
                    onChange={(value) => onChange('constructionPeriod', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    공사금액
                  </th>
                  <SnapshotInputCell
                    label="공사금액"
                    value={draft.siteSnapshot.constructionAmount}
                    onChange={(value) => onChange('constructionAmount', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    책임자
                  </th>
                  <SnapshotInputCell
                    label="책임자"
                    value={draft.siteSnapshot.siteManagerName}
                    onChange={(value) => onChange('siteManagerName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    연락처(이메일)
                  </th>
                  <SnapshotInputCell
                    label="연락처(이메일)"
                    value={draft.siteSnapshot.siteContactEmail}
                    onChange={(value) => onChange('siteContactEmail', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    현장 주소
                  </th>
                  <SnapshotInputCell
                    label="현장 주소"
                    value={draft.siteSnapshot.siteAddress}
                    onChange={(value) => onChange('siteAddress', value)}
                    colSpan={3}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    고객명
                  </th>
                  <SnapshotInputCell
                    label="고객명"
                    value={draft.siteSnapshot.customerName}
                    onChange={(value) => onChange('customerName', value)}
                    colSpan={3}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section className={operationalStyles.snapshotPanel}>
          <h3 className={operationalStyles.snapshotPanelTitle}>본사</h3>
          <div className={operationalStyles.snapshotTableWrap}>
            <table className={operationalStyles.snapshotTable}>
              <colgroup>
                <col className={operationalStyles.snapshotLabelCol} />
                <col className={operationalStyles.snapshotValueCol} />
                <col className={operationalStyles.snapshotLabelCol} />
                <col className={operationalStyles.snapshotValueCol} />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    회사명
                  </th>
                  <SnapshotInputCell
                    label="회사명"
                    value={draft.siteSnapshot.companyName}
                    onChange={(value) => onChange('companyName', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    법인등록번호
                  </th>
                  <SnapshotInputCell
                    label="법인등록번호"
                    value={draft.siteSnapshot.corporationRegistrationNumber || draft.siteSnapshot.businessRegistrationNumber}
                    onChange={handleCorporationNumberChange}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    면허번호
                  </th>
                  <SnapshotInputCell
                    label="면허번호"
                    value={draft.siteSnapshot.licenseNumber}
                    onChange={(value) => onChange('licenseNumber', value)}
                  />
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    연락처
                  </th>
                  <SnapshotInputCell
                    label="본사 연락처"
                    value={draft.siteSnapshot.headquartersContact}
                    onChange={(value) => onChange('headquartersContact', value)}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    본사 주소
                  </th>
                  <SnapshotInputCell
                    label="본사 주소"
                    value={draft.siteSnapshot.headquartersAddress}
                    onChange={(value) => onChange('headquartersAddress', value)}
                    colSpan={3}
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  );
}

function QuarterlyStatsSection(props: { draft: QuarterlySummaryReport }) {
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="2. 재해유형 분석" />
      <div className={operationalStyles.cardGrid}>
        <ChartCard title="재해유형별 종합" entries={props.draft.accidentStats} />
        <ChartCard title="기인물별 종합" entries={props.draft.causativeStats} />
      </div>
    </article>
  );
}

function QuarterlyImplementationSection(props: {
  rows: QuarterlySummaryReport['implementationRows'];
  onChange: (
    index: number,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { rows, onChange, onAdd, onRemove } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="3. 기술지도 이행현황" />
      <div className={operationalStyles.implementationTableWrap}>
        <table className={operationalStyles.implementationTable}>
          <colgroup>
            <col className={operationalStyles.implementationColTitle} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColPerson} />
            <col className={operationalStyles.implementationColDate} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColCompact} />
            <col className={operationalStyles.implementationColNote} />
            <col className={operationalStyles.implementationColAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={operationalStyles.implementationHeaderCell}>보고서명</th>
              <th className={operationalStyles.implementationHeaderCell}>차수</th>
              <th className={operationalStyles.implementationHeaderCell}>담당자</th>
              <th className={operationalStyles.implementationHeaderCell}>지도일</th>
              <th className={operationalStyles.implementationHeaderCell}>공정률</th>
              <th className={operationalStyles.implementationHeaderCell}>지적 건수</th>
              <th className={operationalStyles.implementationHeaderCell}>개선 건수</th>
              <th className={operationalStyles.implementationHeaderCell}>비고</th>
              <th className={`${operationalStyles.implementationHeaderCell} ${operationalStyles.implementationHeaderActionCell}`}>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${operationalStyles.implementationAddButton}`}
                  onClick={onAdd}
                >
                  행 추가
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item, index) => (
                <tr key={item.sessionId || index}>
                  <ImplementationInputCell value={item.reportTitle} onChange={(value) => onChange(index, 'reportTitle', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.reportNumber} onChange={(value) => onChange(index, 'reportNumber', value)} />
                  <ImplementationInputCell value={item.drafter} onChange={(value) => onChange(index, 'drafter', value)} />
                  <ImplementationInputCell value={item.reportDate} onChange={(value) => onChange(index, 'reportDate', value)} />
                  <ImplementationInputCell value={item.progressRate} onChange={(value) => onChange(index, 'progressRate', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.findingCount} onChange={(value) => onChange(index, 'findingCount', value)} />
                  <ImplementationInputCell type="number" min={0} value={item.improvedCount} onChange={(value) => onChange(index, 'improvedCount', value)} />
                  <ImplementationInputCell value={item.note} onChange={(value) => onChange(index, 'note', value)} />
                  <td className={operationalStyles.implementationActionCell}>
                    <button type="button" className={`app-button app-button-secondary ${operationalStyles.implementationActionButton}`} onClick={() => onRemove(index)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className={operationalStyles.implementationEmptyCell}>선택된 기술지도 보고서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function QuarterlyFuturePlansSection(props: {
  plans: QuarterlySummaryReport['futurePlans'];
  onAdd: () => void;
  onChange: (plans: QuarterlySummaryReport['futurePlans']) => void;
}) {
  const { plans, onAdd, onChange } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="4. 향후 공정 유해위험작업 안전대책" />
      <div className={operationalStyles.implementationTableWrap}>
        <table className={operationalStyles.implementationTable}>
          <colgroup>
            <col className={operationalStyles.futurePlanColProcess} />
            <col className={operationalStyles.futurePlanColHazard} />
            <col className={operationalStyles.futurePlanColMeasure} />
            <col className={operationalStyles.futurePlanColAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={operationalStyles.implementationHeaderCell}>작업공정</th>
              <th className={operationalStyles.implementationHeaderCell}>유해위험요인</th>
              <th className={operationalStyles.implementationHeaderCell}>안전대책</th>
              <th
                className={`${operationalStyles.implementationHeaderCell} ${operationalStyles.implementationHeaderActionCell}`}
              >
                <button
                  type="button"
                  className={`app-button app-button-secondary ${operationalStyles.implementationAddButton}`}
                  onClick={onAdd}
                >
                  행 추가
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length > 0 ? (
              plans.map((item) => (
                <tr key={item.id}>
                  <FuturePlanProcessCell
                    item={item}
                    onApplyRecommendation={(recommended) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? {
                                ...plan,
                                countermeasure: recommended.countermeasure,
                                hazard: recommended.hazard,
                                processName: recommended.processName,
                                source: 'api',
                              }
                            : plan,
                        ),
                      )
                    }
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, processName: value, source: 'manual' }
                            : plan,
                        ),
                      )
                    }
                  />
                  <FuturePlanInputCell
                    value={item.hazard}
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, hazard: value, source: 'manual' }
                            : plan,
                        ),
                      )
                    }
                  />
                  <FuturePlanInputCell
                    value={item.countermeasure}
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, note: '', countermeasure: value, source: 'manual' }
                            : plan,
                        ),
                      )
                    }
                  />
                  <td className={operationalStyles.implementationActionCell}>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${operationalStyles.implementationActionButton}`}
                      onClick={() => onChange(plans.filter((plan) => plan.id !== item.id))}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className={operationalStyles.implementationEmptyCell}>
                  등록된 향후 공정 계획이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function QuarterlyOpsSection(props: {
  draft: QuarterlySummaryReport;
  loading: boolean;
  error: string | null;
}) {
  const { draft, loading, error } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="5. 건설현장 12대 사망사고 기인물별 핵심 안전조치" />
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {draft.opsAssetId ? (
        <div className={operationalStyles.opsAssetCard}>
          {draft.opsAssetPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.opsAssetPreviewUrl} alt={draft.opsAssetTitle || 'OPS 자료'} className={operationalStyles.opsAssetPreview} />
          ) : (
            <div className={operationalStyles.emptyState}>미리보기 이미지를 표시할 수 없습니다.</div>
          )}
          <div className={operationalStyles.field}>
            <strong className={operationalStyles.reportCardTitle}>{draft.opsAssetTitle || '미지정 자료'}</strong>
            {draft.opsAssetDescription ? <p className={operationalStyles.reportCardDescription}>{draft.opsAssetDescription}</p> : null}
          </div>
        </div>
      ) : loading ? (
        <div className={operationalStyles.emptyState}>OPS 자료를 불러오는 중입니다.</div>
      ) : (
        <div className={operationalStyles.emptyState}>현재 배정된 OPS 자료가 없습니다. 관리자에서 OPS 자료를 등록하면 이 영역에 함께 표시됩니다.</div>
      )}
    </article>
  );
}

function FieldInput(props: {
  label: string;
  readOnly?: boolean;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={operationalStyles.field}>
      <span className={operationalStyles.fieldLabel}>{props.label}</span>
      <input
        className={`app-input ${props.readOnly ? operationalStyles.readOnlyField : ''}`}
        type={props.type}
        value={props.value}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function SnapshotInputCell(props: {
  label: string;
  readOnly?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  colSpan?: number;
}) {
  return (
    <td className={operationalStyles.snapshotValueCell} colSpan={props.colSpan}>
      <input
        aria-label={props.label}
        className={`app-input ${operationalStyles.snapshotControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

function ImplementationInputCell(props: {
  readOnly?: boolean;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  min?: number;
}) {
  return (
    <td className={operationalStyles.implementationValueCell}>
      <input
        className={`app-input ${operationalStyles.implementationControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        type={props.type}
        min={props.min}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

function FuturePlanInputCell(props: {
  readOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <td className={operationalStyles.implementationValueCell}>
      <textarea
        className={`app-textarea ${operationalStyles.futurePlanControl} ${
          props.readOnly ? operationalStyles.readOnlyField : ''
        }`}
        value={props.value}
        readOnly={props.readOnly}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

function normalizeRecommendationText(value: string) {
  return value.trim().toLowerCase();
}

function getFuturePlanRecommendations(query: string) {
  const normalizedQuery = normalizeRecommendationText(query);
  if (!normalizedQuery) {
    return [];
  }
  const scored = FUTURE_PROCESS_LIBRARY.map((item) => {
    const haystack = `${item.processName} ${item.hazard} ${item.countermeasure}`.toLowerCase();
    let score = 0;

    if (normalizeRecommendationText(item.processName) === normalizedQuery) {
      score = 100;
    } else if (item.processName.toLowerCase().includes(normalizedQuery)) {
      score = 80;
    } else if (haystack.includes(normalizedQuery)) {
      score = 50;
    } else {
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 10 : 0), 0);
    }

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.item.processName.localeCompare(right.item.processName, 'ko'),
    );

  return scored.slice(0, 3).map((entry) => entry.item);
}

function FuturePlanProcessCell(props: {
  item: QuarterlySummaryReport['futurePlans'][number];
  onApplyRecommendation: (item: (typeof FUTURE_PROCESS_LIBRARY)[number]) => void;
  onChange: (value: string) => void;
}) {
  const recommendations = getFuturePlanRecommendations(props.item.processName);

  return (
    <td className={operationalStyles.implementationValueCell}>
      <div className={operationalStyles.futurePlanCellStack}>
        <textarea
          className={`app-textarea ${operationalStyles.futurePlanControl}`}
          value={props.item.processName}
          placeholder="예: 철골 작업, 거푸집 해체 등 공정을 입력하세요"
          onChange={(event) => props.onChange(event.target.value)}
        />
        <div className={operationalStyles.futurePlanRecommendationList}>
          {recommendations.map((recommended) => (
            <button
              key={recommended.processName}
              type="button"
              className={operationalStyles.futurePlanRecommendationButton}
              onClick={() => props.onApplyRecommendation(recommended)}
            >
              {recommended.processName}
            </button>
          ))}
        </div>
      </div>
    </td>
  );
}
