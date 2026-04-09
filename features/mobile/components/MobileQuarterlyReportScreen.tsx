'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import { ChartCard } from '@/components/session/workspace/widgets';
import AppModal from '@/components/ui/AppModal';
import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import {
  buildMobileSiteQuarterlyHref,
  buildMobileSiteQuarterlyListHref,
  buildSiteQuarterlyHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import {
  fetchQuarterlyHwpxDocumentByReportKey,
  fetchQuarterlyPdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import {
  applyQuarterlySummarySeed,
  buildInitialQuarterlySummaryReport,
  buildLocalQuarterlySummarySeed,
} from '@/lib/erpReports/quarterly';
import {
  buildQuarterlyTitleForPeriod,
  createQuarterKey,
  getQuarterFromDate,
  getQuarterRange,
  normalizeQuarterlyReportPeriod,
  parseDateValue,
  parseQuarterKey,
} from '@/lib/erpReports/shared';
import {
  fetchQuarterlySummarySeed,
  fetchSafetyContentItems,
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import {
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
import type { SafetyQuarterlySummarySeedSourceReport } from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import styles from './MobileShell.module.css';
import tabStyles from './MobileStepTabs.module.css';

interface MobileQuarterlyReportScreenProps {
  quarterKey: string;
  siteKey: string;
}

type StepId = 'overview' | 'snapshot' | 'analysis' | 'implementation' | 'countermeasures';

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'overview', label: '기본' },
  { id: 'snapshot', label: '사업장' },
  { id: 'analysis', label: '분석' },
  { id: 'implementation', label: '이행' },
  { id: 'countermeasures', label: '대책' },
];

const SNAPSHOT_FIELDS: Array<{ key: keyof QuarterlySummaryReport['siteSnapshot']; label: string }> = [
  { key: 'siteName', label: '현장명' },
  { key: 'customerName', label: '발주처' },
  { key: 'assigneeName', label: '담당자' },
  { key: 'constructionPeriod', label: '공사기간' },
  { key: 'constructionAmount', label: '공사금액' },
  { key: 'siteManagerName', label: '현장소장' },
  { key: 'siteManagerPhone', label: '현장 연락처' },
  { key: 'siteAddress', label: '현장 주소' },
];

const SNAPSHOT_WIDE_FIELDS = new Set<keyof QuarterlySummaryReport['siteSnapshot']>([
  'constructionPeriod',
  'siteAddress',
]);

function createEmptyImplementationRow(): QuarterlySummaryReport['implementationRows'][number] {
  return {
    sessionId: `manual-${Date.now()}`,
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

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getMobileQuarterLabel(
  report: Pick<
    QuarterlySummaryReport,
    'periodStartDate' | 'periodEndDate' | 'quarterKey' | 'year' | 'quarter'
  >,
) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  if (normalized.year > 0 && normalized.quarter >= 1 && normalized.quarter <= 4) {
    return `${String(normalized.year).slice(-2)}년 ${normalized.quarter}분기`;
  }

  return '기간 미설정';
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

  const endDate = parseDateValue(report.periodEndDate);
  if (endDate) {
    return {
      year: endDate.getFullYear(),
      quarter: getQuarterFromDate(endDate),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    quarter: getQuarterFromDate(today),
  };
}

function shouldUseLocalSeed(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

function applyOpsAsset(
  report: QuarterlySummaryReport,
  asset: { id: string; title: string; body: unknown } | null,
): QuarterlySummaryReport {
  if (!asset) {
    return {
      ...report,
      opsAssetDescription: '',
      opsAssetFileName: '',
      opsAssetFileUrl: '',
      opsAssetId: '',
      opsAssetPreviewUrl: '',
      opsAssetTitle: '',
      opsAssetType: '',
      opsAssignedAt: '',
      opsAssignedBy: '',
    };
  }

  return {
    ...report,
    opsAssetDescription: contentBodyToText(asset.body),
    opsAssetFileName: asset.title,
    opsAssetFileUrl: contentBodyToAssetUrl(asset.body),
    opsAssetId: asset.id,
    opsAssetPreviewUrl: contentBodyToImageUrl(asset.body),
    opsAssetTitle: asset.title,
    opsAssetType: 'campaign_template' as const,
    opsAssignedAt: new Date().toISOString(),
  };
}

function finalizeDraft(report: QuarterlySummaryReport) {
  const normalized = normalizeQuarterlyReportPeriod(report);
  return {
    ...report,
    ...normalized,
    title:
      report.title.trim() ||
      (normalized.periodStartDate && normalized.periodEndDate
        ? buildQuarterlyTitleForPeriod(normalized.periodStartDate, normalized.periodEndDate)
        : '분기 종합보고서'),
    updatedAt: new Date().toISOString(),
  };
}

export function MobileQuarterlyReportScreen({ quarterKey, siteKey }: MobileQuarterlyReportScreenProps) {
  const router = useRouter();
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedQuarterKey = decodeURIComponent(quarterKey);
  const [activeStep, setActiveStep] = useState<StepId>('overview');
  const [draft, setDraft] = useState<QuarterlySummaryReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [sourceReports, setSourceReports] = useState<SafetyQuarterlySummarySeedSourceReport[]>([]);
  const [opsAssets, setOpsAssets] = useState<Array<{ id: string; title: string; body: unknown }>>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDraftRoute, setIsDraftRoute] = useState(false);
  const sourceSyncRequestRef = useRef(0);
  const { authError, currentUser, ensureSiteReportsLoaded, getSessionsBySiteId, isAuthenticated, isReady, login, logout, sites } = useInspectionSessions();
  const currentSite = useMemo(() => sites.find((site) => site.id === decodedSiteKey) ?? null, [decodedSiteKey, sites]);
  const siteSessions = useMemo(() => (currentSite ? getSessionsBySiteId(currentSite.id) : []), [currentSite, getSessionsBySiteId]);
  const { error: mutationError, isSaving, saveQuarterlyReport } = useSiteOperationalReportMutations(currentSite);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    void ensureSiteReportsLoaded(currentSite.id).catch(() => undefined);
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      const token = readSafetyAuthToken();
      if (!token) {
        setLoadError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        const drafter = currentUser?.name?.trim() || currentSite.assigneeName || '담당자';
        const target = parseQuarterKey(decodedQuarterKey);
        let nextDraft: QuarterlySummaryReport;
        let createdFromQuarter = false;

        try {
          const report = await fetchSafetyReportByKey(token, decodedQuarterKey);
          const mapped = mapSafetyReportToQuarterlySummaryReport(report);
          if (!mapped) throw new Error('분기 보고서를 찾을 수 없습니다.');
          nextDraft = buildInitialQuarterlySummaryReport(currentSite, siteSessions, drafter, mapped);
        } catch (error) {
          if (target && error instanceof SafetyApiError && error.status === 404) {
            nextDraft = buildInitialQuarterlySummaryReport(currentSite, siteSessions, target, drafter, null);
            createdFromQuarter = true;
          } else {
            throw error;
          }
        }

        if (nextDraft.periodStartDate && nextDraft.periodEndDate) {
          const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
            explicitSelection: nextDraft.generatedFromSessionIds.length > 0,
            periodEndDate: nextDraft.periodEndDate,
            periodStartDate: nextDraft.periodStartDate,
            selectedReportKeys: nextDraft.generatedFromSessionIds,
          }).catch((error) => {
            if (shouldUseLocalSeed(error)) {
              return buildLocalQuarterlySummarySeed(nextDraft, currentSite, siteSessions, {
                explicitSelection: nextDraft.generatedFromSessionIds.length > 0,
                selectedReportKeys: nextDraft.generatedFromSessionIds,
              });
            }
            throw error;
          });
          nextDraft = applyQuarterlySummarySeed(nextDraft, seed);
          if (!cancelled) setSourceReports(seed.source_reports);
        }

        if (!cancelled) {
          setDraft(nextDraft);
          setSelectedSourceKeys(nextDraft.generatedFromSessionIds);
          setIsDraftRoute(createdFromQuarter);
          setSaveNotice(createdFromQuarter ? '새 초안을 만들었습니다.' : null);
        }
      } catch (error) {
        if (!cancelled) setLoadError(getMessage(error, '분기 보고서를 불러오지 못했습니다.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentSite, currentUser?.name, decodedQuarterKey, isAuthenticated, isReady, siteSessions]);

  useEffect(() => {
    if (!isAuthenticated || !isReady) return;
    const token = readSafetyAuthToken();
    if (!token) return;
    void fetchSafetyContentItems(token)
      .then((items) => setOpsAssets(items.filter((item) => item.content_type === 'campaign_template').map((item) => ({ id: item.id, title: item.title, body: item.body }))))
      .catch(() => undefined);
  }, [isAuthenticated, isReady]);

  useEffect(() => {
    if (!draft || draft.opsAssetId || opsAssets.length === 0) return;
    setDraft((current) => (current && !current.opsAssetId ? applyOpsAsset(current, opsAssets[0]) : current));
  }, [draft, opsAssets]);

  const updateDraft = (updater: (current: QuarterlySummaryReport) => QuarterlySummaryReport) => {
    setSaveNotice(null);
    setDocumentNotice(null);
    setDraft((current) => (current ? updater(current) : current));
  };

  const updateImplementationRow = (
    sessionId: string,
    field: keyof QuarterlySummaryReport['implementationRows'][number],
    value: string,
  ) => {
    updateDraft((current) => ({
      ...current,
      implementationRows: current.implementationRows.map((item) => {
        if (item.sessionId !== sessionId) return item;

        if (field === 'reportNumber' || field === 'findingCount' || field === 'improvedCount') {
          const parsed = Number.parseInt(value, 10);
          return {
            ...item,
            [field]: Number.isNaN(parsed) ? 0 : parsed,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    }));
  };

  const handleAddImplementationRow = () => {
    updateDraft((current) => ({
      ...current,
      implementationRows: [...current.implementationRows, createEmptyImplementationRow()],
    }));
  };

  const handleRemoveImplementationRow = (sessionId: string) => {
    updateDraft((current) => ({
      ...current,
      implementationRows: current.implementationRows.filter((item) => item.sessionId !== sessionId),
    }));
  };

  const updateFuturePlan = (
    planId: string,
    patch: Partial<QuarterlySummaryReport['futurePlans'][number]>,
  ) => {
    updateDraft((current) => ({
      ...current,
      futurePlans: current.futurePlans.map((item) =>
        item.id === planId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const handleAddFuturePlan = () => {
    updateDraft((current) => ({
      ...current,
      futurePlans: [...current.futurePlans, createFutureProcessRiskPlan()],
    }));
  };

  const handleRemoveFuturePlan = (planId: string) => {
    updateDraft((current) => ({
      ...current,
      futurePlans: current.futurePlans.filter((item) => item.id !== planId),
    }));
  };

  const syncSourceReportsForDraft = async (
    nextDraft: QuarterlySummaryReport,
    options?: {
      explicitSelection?: boolean;
      selectedReportKeys?: string[];
      sourceNotice?: string | null;
    },
  ) => {
    if (!currentSite) {
      setDraft(nextDraft);
      return;
    }

    if (
      !nextDraft.periodStartDate ||
      !nextDraft.periodEndDate ||
      nextDraft.periodStartDate > nextDraft.periodEndDate
    ) {
      setDraft(nextDraft);
      setSourceReports([]);
      setSelectedSourceKeys([]);
      return;
    }

    const token = readSafetyAuthToken();
    if (!token) {
      setDraft(nextDraft);
      setSourceError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    const requestId = sourceSyncRequestRef.current + 1;
    sourceSyncRequestRef.current = requestId;
    setIsSourceLoading(true);
    setSourceError(null);

    try {
      const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
        explicitSelection: options?.explicitSelection,
        periodEndDate: nextDraft.periodEndDate,
        periodStartDate: nextDraft.periodStartDate,
        selectedReportKeys: options?.selectedReportKeys,
      }).catch((error) => {
        if (shouldUseLocalSeed(error)) {
          return buildLocalQuarterlySummarySeed(nextDraft, currentSite, siteSessions, {
            explicitSelection: options?.explicitSelection,
            selectedReportKeys: options?.selectedReportKeys,
          });
        }
        throw error;
      });

      if (sourceSyncRequestRef.current !== requestId) return;

      const draftWithSelection =
        options?.explicitSelection && options.selectedReportKeys
          ? { ...nextDraft, generatedFromSessionIds: options.selectedReportKeys }
          : nextDraft;
      const updatedDraft = applyQuarterlySummarySeed(draftWithSelection, seed);

      setDraft(updatedDraft);
      setSourceReports(seed.source_reports);
      setSelectedSourceKeys(updatedDraft.generatedFromSessionIds);
      setSourceNotice(options?.sourceNotice ?? null);
    } catch (error) {
      if (sourceSyncRequestRef.current !== requestId) return;
      setDraft(nextDraft);
      setSourceError(getMessage(error, '원본 보고서를 반영하지 못했습니다.'));
    } finally {
      if (sourceSyncRequestRef.current === requestId) {
        setIsSourceLoading(false);
      }
    }
  };

  const handlePeriodFieldChange = (
    key: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    if (!draft) return;
    setSaveNotice(null);
    setDocumentNotice(null);
    setSourceNotice(null);
    const next = {
      ...draft,
      [key]: value,
    };
    const nextDraft = {
      ...next,
      ...normalizeQuarterlyReportPeriod(next),
    };
    void syncSourceReportsForDraft(nextDraft);
  };

  const handleQuarterChange = (value: string) => {
    const nextQuarter = Number.parseInt(value, 10);
    if (nextQuarter < 1 || nextQuarter > 4 || !draft) return;

    const currentQuarterTarget = getQuarterSelectionTarget(draft);
    const nextRange = getQuarterRange(currentQuarterTarget.year, nextQuarter);
    const currentAutoTitle = buildQuarterlyTitleForPeriod(
      draft.periodStartDate,
      draft.periodEndDate,
    );
    const shouldSyncTitle = !draft.title.trim() || draft.title.trim() === currentAutoTitle;

    setSaveNotice(null);
    setDocumentNotice(null);
    setSourceNotice(null);
    const nextDraft = {
      ...draft,
      title: shouldSyncTitle
        ? buildQuarterlyTitleForPeriod(nextRange.startDate, nextRange.endDate)
        : draft.title,
      periodStartDate: nextRange.startDate,
      periodEndDate: nextRange.endDate,
      quarterKey: createQuarterKey(currentQuarterTarget.year, nextQuarter),
      year: currentQuarterTarget.year,
      quarter: nextQuarter,
    };
    void syncSourceReportsForDraft(nextDraft);
  };

  const handleApplySourceSelection = async () => {
    if (!draft) return;
    await syncSourceReportsForDraft(draft, {
      explicitSelection: true,
      selectedReportKeys: selectedSourceKeys,
      sourceNotice: '원본 보고서 선택을 반영했습니다.',
    });
    setSourceModalOpen(false);
  };

  const handleSave = async () => {
    if (!draft || !currentSite) return null;
    const nextDraft = finalizeDraft(draft);
    await saveQuarterlyReport(nextDraft);
    setDraft(nextDraft);
    setSaveNotice('저장되었습니다.');
    if (isDraftRoute) {
      setIsDraftRoute(false);
      router.replace(buildMobileSiteQuarterlyHref(currentSite.id, nextDraft.id));
    }
    return nextDraft;
  };

  const handleDownloadHwpx = async () => {
    const saved = await handleSave().catch((error) => setLoadError(getMessage(error, '저장하지 못했습니다.')));
    if (!saved) return;
    setIsGeneratingHwpx(true);
    try {
      const result = await fetchQuarterlyHwpxDocumentByReportKey(saved.id, readSafetyAuthToken());
      saveBlobAsFile(result.blob, result.filename);
      setDocumentNotice('HWPX 문서를 다운로드했습니다.');
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  const handleDownloadPdf = async () => {
    const saved = await handleSave().catch((error) => setLoadError(getMessage(error, '저장하지 못했습니다.')));
    if (!saved) return;
    setIsGeneratingPdf(true);
    try {
      const result = await fetchQuarterlyPdfDocumentByReportKeyWithFallback(saved.id, readSafetyAuthToken());
      saveBlobAsFile(result.blob, result.filename);
      setDocumentNotice(result.fallbackToHwpx ? `PDF 대신 ${result.filename}을(를) 내려받았습니다.` : 'PDF 문서를 다운로드했습니다.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isReady) return <main className="app-page"><div className={styles.pageShell}><div className={styles.content}><section className={styles.stateCard}><h1 className={styles.sectionTitle}>분기 보고서를 준비하고 있습니다.</h1></section></div></div></main>;
  if (!isAuthenticated) return <LoginPanel error={authError} onSubmit={login} title="모바일 분기 보고 로그인" description="모바일에서 분기 종합보고서를 작성할 수 있습니다." />;
  if (!currentSite) return <main className="app-page"><div className={styles.pageShell}><div className={styles.content}><section className={styles.stateCard}><h1 className={styles.sectionTitle}>현장을 찾을 수 없습니다.</h1><Link href="/mobile" className="app-button app-button-secondary">현장 목록</Link></section></div></div></main>;
  if (isLoading && !draft) return <main className="app-page"><div className={styles.pageShell}><div className={styles.content}><section className={styles.stateCard}><h1 className={styles.sectionTitle}>분기 보고서를 불러오는 중입니다.</h1></section></div></div></main>;
  if (!draft) return <main className="app-page"><div className={styles.pageShell}><div className={styles.content}><section className={styles.stateCard}><h1 className={styles.sectionTitle}>분기 보고서를 열 수 없습니다.</h1><p className={styles.inlineNotice}>{loadError || '보고서를 찾지 못했습니다.'}</p></section></div></div></main>;

  const selectedSourceSet = new Set(selectedSourceKeys);
  const selectedQuarter = String(getQuarterSelectionTarget(draft).quarter);

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteQuarterlyListHref(currentSite.id)}
        backLabel="분기 목록"
        currentUserName={currentUser?.name}
        fullHeight
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={draft.title || currentSite.siteName}
        webHref={buildSiteQuarterlyHref(currentSite.id, draft.id)}
      >
        <section
          className={styles.sectionCard}
          style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none', flexShrink: 0 }}
        >
          <div className={`${styles.statGrid} ${styles.mobileSummaryGrid}`}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>분기</span>
              <strong className={styles.statValue}>{getMobileQuarterLabel(draft)}</strong>
            </article>
            <div className={styles.mobileSummaryActionStack}>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ width: '100%', height: '100%', minHeight: '80px', padding: '0 8px' }}
                onClick={() => setDocumentInfoOpen(true)}
              >
                문서정보
              </button>
              <div className={styles.mobileSummaryExportStack}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  style={{ width: '100%', minHeight: '36px', padding: '0 8px' }}
                  disabled={isGeneratingHwpx || isGeneratingPdf}
                  onClick={() => void handleDownloadHwpx()}
                >
                  {isGeneratingHwpx ? '한글...' : '한글'}
                </button>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  style={{ width: '100%', minHeight: '36px', padding: '0 8px' }}
                  disabled={isGeneratingHwpx || isGeneratingPdf}
                  onClick={() => void handleDownloadPdf()}
                >
                  {isGeneratingPdf ? 'PDF...' : 'PDF'}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="app-button app-button-secondary"
              style={{ width: '100%', height: '100%', minHeight: '80px', padding: '0 8px' }}
              disabled={isSaving || isGeneratingHwpx || isGeneratingPdf}
              onClick={() =>
                void handleSave().catch((error) =>
                  setLoadError(getMessage(error, '저장하지 못했습니다.')),
                )
              }
            >
              {isSaving ? '저장 중' : '저장'}
            </button>
          </div>
        </section>

        <div className={tabStyles.layoutWrapper}>
          <div className={tabStyles.tabContainer}>
            {STEPS.map((step) => (
              <button key={step.id} type="button" className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`} onClick={() => setActiveStep(step.id)}>
                {step.label}
              </button>
            ))}
          </div>
          <div className={tabStyles.stepContent}>
            <div style={{ display: 'grid', gap: '14px', padding: '14px' }}>
              {loadError ? <div className={styles.errorNotice}>{loadError}</div> : null}
              {mutationError ? <div className={styles.errorNotice}>{mutationError}</div> : null}
              {sourceError ? <div className={styles.errorNotice}>{sourceError}</div> : null}
              {saveNotice ? <div className={styles.inlineNotice}>{saveNotice}</div> : null}
              {documentNotice ? <div className={styles.inlineNotice}>{documentNotice}</div> : null}

              {activeStep === 'overview' ? <section className={styles.mobileEditorCard}><input className="app-input" value={draft.title} onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))} /><div className={styles.mobileOverviewPeriodRow}><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>분기</span><select className="app-select" value={selectedQuarter} onChange={(event) => handleQuarterChange(event.target.value)}><option value="1">1분기</option><option value="2">2분기</option><option value="3">3분기</option><option value="4">4분기</option></select></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>시작일</span><input type="date" className="app-input" value={draft.periodStartDate} onChange={(event) => handlePeriodFieldChange('periodStartDate', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>종료일</span><input type="date" className="app-input" value={draft.periodEndDate} onChange={(event) => handlePeriodFieldChange('periodEndDate', event.target.value)} /></label></div><div className={styles.mobileInlineActions}><button type="button" className={`app-button app-button-primary ${styles.mobileInlineAction}`} onClick={() => setSourceModalOpen(true)}>원본 보고서 선택</button><button type="button" className={`app-button app-button-secondary ${styles.mobileInlineAction}`} onClick={() => void handleApplySourceSelection()} disabled={isSourceLoading}>{isSourceLoading ? '반영 중...' : '선택 반영 / 재계산'}</button></div>{sourceNotice ? <div className={styles.inlineNotice}>{sourceNotice}</div> : null}<div style={{ display: 'grid', gap: '10px' }}>{sourceReports.filter((report) => selectedSourceSet.has(report.report_key)).map((report) => <article key={report.report_key} className={styles.reportCard} style={{ padding: '12px' }}><strong>{report.report_title || report.guidance_date || report.report_key}</strong><div style={{ color: '#475569', display: 'flex', flexWrap: 'wrap', fontSize: '13px', gap: '10px' }}><span>{report.guidance_date || '-'}</span><span>지적 {report.finding_count}건</span><span>개선 {report.improved_count}건</span></div></article>)}</div></section> : null}

              {activeStep === 'snapshot' ? <section className={styles.mobileEditorCard}><div className={styles.mobileCompactFieldGrid}>{SNAPSHOT_FIELDS.map((field) => <label key={field.key} className={`${styles.mobileEditorFieldGroup} ${SNAPSHOT_WIDE_FIELDS.has(field.key) ? styles.mobileCompactFieldWide : ''}`}><span className={styles.mobileEditorFieldLabel}>{field.label}</span><input className="app-input" value={draft.siteSnapshot[field.key] || ''} onChange={(event) => updateDraft((current) => ({ ...current, siteSnapshot: { ...current.siteSnapshot, [field.key]: event.target.value } }))} /></label>)}</div></section> : null}

              {activeStep === 'analysis' ? <section className={styles.mobileEditorCard}><ChartCard title="재해유형" entries={draft.accidentStats} variant="erp" /><ChartCard title="기인물" entries={draft.causativeStats} variant="erp" /></section> : null}

              {activeStep === 'implementation' ? <section className={styles.mobileEditorCard}><div className={styles.mobileImplementationListHeader}><div className={styles.mobileImplementationListTitle}>기술지도 이행현황</div><button type="button" className={`app-button app-button-secondary ${styles.mobileImplementationAddButton}`} onClick={handleAddImplementationRow}>행 추가</button></div>{draft.implementationRows.length > 0 ? <div className={styles.mobileImplementationList}>{draft.implementationRows.map((row, index) => <article key={row.sessionId} className={styles.mobileImplementationItem}><div className={styles.mobileImplementationItemTop}><span className={styles.mobileImplementationItemBadge}>{row.reportNumber || index + 1}차</span><button type="button" className={`app-button app-button-secondary ${styles.mobileImplementationDeleteButton}`} onClick={() => handleRemoveImplementationRow(row.sessionId)}>삭제</button></div><label className={`${styles.mobileEditorFieldGroup} ${styles.mobileImplementationFieldWide}`}><span className={styles.mobileEditorFieldLabel}>보고서명</span><input className="app-input" value={row.reportTitle} placeholder="보고서명" onChange={(event) => updateImplementationRow(row.sessionId, 'reportTitle', event.target.value)} /></label><div className={styles.mobileImplementationFieldGrid}><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>차수</span><input type="number" min={0} className="app-input" value={row.reportNumber} onChange={(event) => updateImplementationRow(row.sessionId, 'reportNumber', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>담당자</span><input className="app-input" value={row.drafter} placeholder="담당자" onChange={(event) => updateImplementationRow(row.sessionId, 'drafter', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>지도일</span><input className="app-input" value={row.reportDate} placeholder="YYYY-MM-DD" onChange={(event) => updateImplementationRow(row.sessionId, 'reportDate', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>공정률</span><input className="app-input" value={row.progressRate} placeholder="공정률" onChange={(event) => updateImplementationRow(row.sessionId, 'progressRate', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>지적 건수</span><input type="number" min={0} className="app-input" value={row.findingCount} onChange={(event) => updateImplementationRow(row.sessionId, 'findingCount', event.target.value)} /></label><label className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>개선 건수</span><input type="number" min={0} className="app-input" value={row.improvedCount} onChange={(event) => updateImplementationRow(row.sessionId, 'improvedCount', event.target.value)} /></label><label className={`${styles.mobileEditorFieldGroup} ${styles.mobileImplementationFieldWide}`}><span className={styles.mobileEditorFieldLabel}>비고</span><input className="app-input" value={row.note} placeholder="비고" onChange={(event) => updateImplementationRow(row.sessionId, 'note', event.target.value)} /></label></div></article>)}</div> : <div className={styles.mobileImplementationEmpty}>선택된 기술지도 보고서가 없습니다.</div>}</section> : null}

              {activeStep === 'countermeasures' ? (
                <section className={styles.mobileEditorCard}>
                  <div className={styles.mobileImplementationListHeader}>
                    <div className={styles.mobileImplementationListTitle}>
                      4. 향후 공정 유해위험작업 안전대책
                    </div>
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${styles.mobileImplementationAddButton}`}
                      onClick={handleAddFuturePlan}
                    >
                      행 추가
                    </button>
                  </div>
                  {draft.futurePlans.length > 0 ? (
                    <div className={styles.mobileFuturePlanCardList}>
                      {draft.futurePlans.map((plan, index) => (
                        <article key={plan.id} className={styles.mobileFuturePlanCard}>
                          <div className={styles.mobileImplementationItemTop}>
                            <span className={styles.mobileImplementationItemBadge}>{`행 ${index + 1}`}</span>
                            <button
                              type="button"
                              className={`app-button app-button-secondary ${styles.mobileFuturePlanDeleteButton}`}
                              onClick={() => handleRemoveFuturePlan(plan.id)}
                            >
                              삭제
                            </button>
                          </div>
                          <div className={styles.mobileEditorFieldStack}>
                            <label className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>위험요인</span>
                              <textarea
                                className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                                rows={4}
                                value={plan.hazard || plan.processName}
                                placeholder="위험요인을 입력해 주세요."
                                onChange={(event) =>
                                  updateFuturePlan(plan.id, {
                                    hazard: event.target.value,
                                    processName: '',
                                    source: 'manual',
                                  })
                                }
                              />
                            </label>
                            <label className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>안전대책</span>
                              <textarea
                                className={`app-textarea ${styles.mobileFuturePlanTextarea}`}
                                rows={4}
                                value={plan.countermeasure}
                                placeholder="안전대책을 입력해 주세요."
                                onChange={(event) =>
                                  updateFuturePlan(plan.id, {
                                    countermeasure: event.target.value,
                                    note: '',
                                    source: 'manual',
                                  })
                                }
                              />
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.mobileFuturePlanEmpty}>
                      등록된 위험요인 및 안전대책이 없습니다.
                    </div>
                  )}

                  <label className={styles.mobileEditorFieldGroup}>
                    <span className={styles.mobileEditorFieldLabel}>OPS 자료</span>
                    <select
                      className="app-select"
                      value={draft.opsAssetId}
                      onChange={(event) =>
                        updateDraft((current) =>
                          applyOpsAsset(
                            current,
                            opsAssets.find((item) => item.id === event.target.value) ?? null,
                          ),
                        )
                      }
                    >
                      <option value="">OPS 자료 없음</option>
                      {opsAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  {draft.opsAssetFileUrl ? (
                    <a href={draft.opsAssetFileUrl} target="_blank" rel="noreferrer">
                      OPS 자료 열기
                    </a>
                  ) : null}
                </section>
              ) : null}

            </div>
          </div>
        </div>
      </MobileShell>

      <AppModal open={sourceModalOpen} title="원본 보고서 선택" size="large" onClose={() => setSourceModalOpen(false)} actions={<><button type="button" className="app-button app-button-secondary" onClick={() => setSourceModalOpen(false)}>닫기</button><button type="button" className="app-button app-button-primary" onClick={() => void handleApplySourceSelection()} disabled={isSourceLoading}>{isSourceLoading ? '반영 중...' : '선택 반영'}</button></>}>
        <div style={{ display: 'grid', gap: '10px' }}>
          {sourceReports.length > 0 ? sourceReports.map((report) => <label key={report.report_key} style={{ border: '1px solid rgba(215, 224, 235, 0.96)', borderRadius: '14px', display: 'grid', gap: '8px', padding: '14px' }}><div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', gap: '12px' }}><div style={{ display: 'grid', gap: '4px' }}><strong>{report.report_title || report.guidance_date || report.report_key}</strong><span style={{ color: '#64748b', fontSize: '13px' }}>{report.guidance_date || '-'} · {report.drafter || '작성자 미상'}</span></div><input type="checkbox" checked={selectedSourceSet.has(report.report_key)} onChange={(event) => setSelectedSourceKeys((current) => event.target.checked ? [...new Set([...current, report.report_key])] : current.filter((item) => item !== report.report_key))} /></div></label>) : <div className={styles.inlineNotice}>선택 가능한 원본 보고서가 없습니다.</div>}
        </div>
      </AppModal>

      <AppModal
        open={documentInfoOpen}
        title="문서정보 확인"
        onClose={() => setDocumentInfoOpen(false)}
        actions={
          <>
            <button type="button" className="app-button app-button-secondary" onClick={() => setDocumentInfoOpen(false)}>
              닫기
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>작성자</span>
            <input
              className="app-input"
              value={draft.drafter}
              placeholder="작성자"
              onChange={(event) => updateDraft((current) => ({ ...current, drafter: event.target.value }))}
            />
          </label>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>검토자</span>
            <input
              className="app-input"
              value={draft.reviewer}
              placeholder="검토자"
              onChange={(event) => updateDraft((current) => ({ ...current, reviewer: event.target.value }))}
            />
          </label>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>승인자</span>
            <input
              className="app-input"
              value={draft.approver}
              placeholder="승인자"
              onChange={(event) => updateDraft((current) => ({ ...current, approver: event.target.value }))}
            />
          </label>
        </div>
      </AppModal>
    </>
  );
}
