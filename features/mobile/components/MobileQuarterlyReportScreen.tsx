'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
  getQuarterlyReportPeriodLabel,
  normalizeQuarterlyReportPeriod,
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

type StepId = 'overview' | 'sources' | 'snapshot' | 'analysis' | 'implementation' | 'countermeasures' | 'document';

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'overview', label: '기본' },
  { id: 'sources', label: '원본' },
  { id: 'snapshot', label: '사업장' },
  { id: 'analysis', label: '분석' },
  { id: 'implementation', label: '이행' },
  { id: 'countermeasures', label: '대책' },
  { id: 'document', label: '문서' },
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

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function shouldUseLocalSeed(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('ko-KR', { hour12: false });
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
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [sourceReports, setSourceReports] = useState<SafetyQuarterlySummarySeedSourceReport[]>([]);
  const [opsAssets, setOpsAssets] = useState<Array<{ id: string; title: string; body: unknown }>>([]);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSourceLoading, setIsSourceLoading] = useState(false);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDraftRoute, setIsDraftRoute] = useState(false);
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

  const handlePeriodFieldChange = (
    key: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    updateDraft((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      return {
        ...next,
        ...normalizeQuarterlyReportPeriod(next),
      };
    });
  };

  const handleApplySourceSelection = async () => {
    if (!draft || !currentSite || !draft.periodStartDate || !draft.periodEndDate) return;
    const token = readSafetyAuthToken();
    if (!token) {
      setSourceError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return;
    }

    setIsSourceLoading(true);
    setSourceError(null);
    try {
      const seed = await fetchQuarterlySummarySeed(token, currentSite.id, {
        explicitSelection: true,
        periodEndDate: draft.periodEndDate,
        periodStartDate: draft.periodStartDate,
        selectedReportKeys: selectedSourceKeys,
      }).catch((error) => {
        if (shouldUseLocalSeed(error)) {
          return buildLocalQuarterlySummarySeed(draft, currentSite, siteSessions, {
            explicitSelection: true,
            selectedReportKeys: selectedSourceKeys,
          });
        }
        throw error;
      });
      setSourceReports(seed.source_reports);
      setDraft((current) => (current ? applyQuarterlySummarySeed({ ...current, generatedFromSessionIds: selectedSourceKeys }, seed) : current));
      setSourceNotice('원본 보고서 선택을 반영했습니다.');
      setSourceModalOpen(false);
    } catch (error) {
      setSourceError(getMessage(error, '원본 보고서를 반영하지 못했습니다.'));
    } finally {
      setIsSourceLoading(false);
    }
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
  const subtitle = `${getQuarterlyReportPeriodLabel(draft)} · 원본 ${draft.generatedFromSessionIds.length}건`;

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteQuarterlyListHref(currentSite.id)}
        backLabel="분기 목록"
        currentUserName={currentUser?.name}
        fullHeight
        kicker="모바일 분기 보고"
        onLogout={logout}
        subtitle={subtitle}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'quarterly')} />}
        title={draft.title || currentSite.siteName}
        webHref={buildSiteQuarterlyHref(currentSite.id, draft.id)}
      >
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

              {activeStep === 'overview' ? <section className={styles.mobileEditorCard}><input className="app-input" value={draft.title} onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))} /><div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}><input type="date" className="app-input" value={draft.periodStartDate} onChange={(event) => handlePeriodFieldChange('periodStartDate', event.target.value)} /><input type="date" className="app-input" value={draft.periodEndDate} onChange={(event) => handlePeriodFieldChange('periodEndDate', event.target.value)} /></div><div className={styles.statGrid}><article className={styles.statCard}><span className={styles.statLabel}>분기</span><strong className={styles.statValue}>{getQuarterlyReportPeriodLabel(draft)}</strong></article><article className={styles.statCard}><span className={styles.statLabel}>마지막 계산</span><strong className={styles.statValue} style={{ fontSize: '15px' }}>{formatDateTimeLabel(draft.lastCalculatedAt)}</strong></article></div></section> : null}

              {activeStep === 'sources' ? <section className={styles.mobileEditorCard}><button type="button" className="app-button app-button-primary" onClick={() => setSourceModalOpen(true)}>원본 보고서 선택</button><button type="button" className="app-button app-button-secondary" onClick={() => void handleApplySourceSelection()} disabled={isSourceLoading}>{isSourceLoading ? '반영 중...' : '선택 반영 / 재계산'}</button>{sourceNotice ? <div className={styles.inlineNotice}>{sourceNotice}</div> : null}<div style={{ display: 'grid', gap: '10px' }}>{sourceReports.filter((report) => selectedSourceSet.has(report.report_key)).map((report) => <article key={report.report_key} className={styles.reportCard} style={{ padding: '12px' }}><strong>{report.report_title || report.guidance_date || report.report_key}</strong><div style={{ color: '#475569', display: 'flex', flexWrap: 'wrap', fontSize: '13px', gap: '10px' }}><span>{report.guidance_date || '-'}</span><span>지적 {report.finding_count}건</span><span>개선 {report.improved_count}건</span></div></article>)}</div></section> : null}

              {activeStep === 'snapshot' ? <section className={styles.mobileEditorCard}><div style={{ display: 'grid', gap: '10px' }}>{SNAPSHOT_FIELDS.map((field) => <label key={field.key} className={styles.mobileEditorFieldGroup}><span className={styles.mobileEditorFieldLabel}>{field.label}</span><input className="app-input" value={draft.siteSnapshot[field.key] || ''} onChange={(event) => updateDraft((current) => ({ ...current, siteSnapshot: { ...current.siteSnapshot, [field.key]: event.target.value } }))} /></label>)}</div></section> : null}

              {activeStep === 'analysis' ? <section className={styles.mobileEditorCard}><ChartCard title="재해유형" entries={draft.accidentStats} variant="erp" /><ChartCard title="기인물" entries={draft.causativeStats} variant="erp" /></section> : null}

              {activeStep === 'implementation' ? <section className={styles.mobileEditorCard}><button type="button" className="app-button app-button-secondary" onClick={() => updateDraft((current) => ({ ...current, implementationRows: [...current.implementationRows, { sessionId: `manual-${Date.now()}`, reportTitle: '', reportDate: '', reportNumber: 0, drafter: '', progressRate: '', findingCount: 0, improvedCount: 0, note: '' }] }))}>행 추가</button><div style={{ display: 'grid', gap: '10px' }}>{draft.implementationRows.map((row) => <article key={row.sessionId} className={styles.mobileEditorCard}><input className="app-input" value={row.reportTitle} placeholder="보고서 제목" onChange={(event) => updateDraft((current) => ({ ...current, implementationRows: current.implementationRows.map((item) => item.sessionId === row.sessionId ? { ...item, reportTitle: event.target.value } : item) }))} /><textarea className="app-textarea" rows={2} value={row.note} placeholder="비고" onChange={(event) => updateDraft((current) => ({ ...current, implementationRows: current.implementationRows.map((item) => item.sessionId === row.sessionId ? { ...item, note: event.target.value } : item) }))} /></article>)}</div></section> : null}

              {activeStep === 'countermeasures' ? <section className={styles.mobileEditorCard}><button type="button" className="app-button app-button-secondary" onClick={() => updateDraft((current) => ({ ...current, majorMeasures: [...current.majorMeasures, ''] }))}>주요 대책 추가</button><div style={{ display: 'grid', gap: '10px' }}>{draft.majorMeasures.map((measure, index) => <textarea key={`${index}-${measure.slice(0, 8)}`} className="app-textarea" rows={3} value={measure} onChange={(event) => updateDraft((current) => ({ ...current, majorMeasures: current.majorMeasures.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} />)}</div><button type="button" className="app-button app-button-secondary" onClick={() => updateDraft((current) => ({ ...current, futurePlans: [...current.futurePlans, createFutureProcessRiskPlan()] }))}>향후 공정 추가</button><div style={{ display: 'grid', gap: '10px' }}>{draft.futurePlans.map((plan) => <article key={plan.id} className={styles.mobileEditorCard}><input className="app-input" value={plan.processName} placeholder="공정명" onChange={(event) => updateDraft((current) => ({ ...current, futurePlans: current.futurePlans.map((item) => item.id === plan.id ? { ...item, processName: event.target.value } : item) }))} /><textarea className="app-textarea" rows={2} value={plan.countermeasure} placeholder="안전대책" onChange={(event) => updateDraft((current) => ({ ...current, futurePlans: current.futurePlans.map((item) => item.id === plan.id ? { ...item, countermeasure: event.target.value } : item) }))} /></article>)}</div><select className="app-select" value={draft.opsAssetId} onChange={(event) => updateDraft((current) => applyOpsAsset(current, opsAssets.find((item) => item.id === event.target.value) ?? null))}><option value="">OPS 자료 없음</option>{opsAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}</select>{draft.opsAssetFileUrl ? <a href={draft.opsAssetFileUrl} target="_blank" rel="noreferrer">OPS 자료 열기</a> : null}</section> : null}

              {activeStep === 'document' ? <section className={styles.mobileEditorCard}><input className="app-input" value={draft.drafter} placeholder="작성자" onChange={(event) => updateDraft((current) => ({ ...current, drafter: event.target.value }))} /><input className="app-input" value={draft.reviewer} placeholder="검토자" onChange={(event) => updateDraft((current) => ({ ...current, reviewer: event.target.value }))} /><input className="app-input" value={draft.approver} placeholder="승인자" onChange={(event) => updateDraft((current) => ({ ...current, approver: event.target.value }))} /><button type="button" className="app-button app-button-primary" onClick={() => void handleSave().catch((error) => setLoadError(getMessage(error, '저장하지 못했습니다.')))} disabled={isSaving}>변경사항 저장</button><button type="button" className="app-button app-button-secondary" onClick={() => void handleDownloadHwpx()} disabled={isGeneratingHwpx || isGeneratingPdf}>{isGeneratingHwpx ? 'HWPX 생성 중...' : '문서 다운로드 (.hwpx)'}</button><button type="button" className="app-button app-button-secondary" onClick={() => void handleDownloadPdf()} disabled={isGeneratingHwpx || isGeneratingPdf}>{isGeneratingPdf ? 'PDF 생성 중...' : '문서 다운로드 (.pdf)'}</button></section> : null}
            </div>
          </div>
        </div>
      </MobileShell>

      <AppModal open={sourceModalOpen} title="원본 보고서 선택" size="large" onClose={() => setSourceModalOpen(false)} actions={<><button type="button" className="app-button app-button-secondary" onClick={() => setSourceModalOpen(false)}>닫기</button><button type="button" className="app-button app-button-primary" onClick={() => void handleApplySourceSelection()} disabled={isSourceLoading}>{isSourceLoading ? '반영 중...' : '선택 반영'}</button></>}>
        <div style={{ display: 'grid', gap: '10px' }}>
          {sourceReports.length > 0 ? sourceReports.map((report) => <label key={report.report_key} style={{ border: '1px solid rgba(215, 224, 235, 0.96)', borderRadius: '14px', display: 'grid', gap: '8px', padding: '14px' }}><div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', gap: '12px' }}><div style={{ display: 'grid', gap: '4px' }}><strong>{report.report_title || report.guidance_date || report.report_key}</strong><span style={{ color: '#64748b', fontSize: '13px' }}>{report.guidance_date || '-'} · {report.drafter || '작성자 미상'}</span></div><input type="checkbox" checked={selectedSourceSet.has(report.report_key)} onChange={(event) => setSelectedSourceKeys((current) => event.target.checked ? [...new Set([...current, report.report_key])] : current.filter((item) => item !== report.report_key))} /></div></label>) : <div className={styles.inlineNotice}>선택 가능한 원본 보고서가 없습니다.</div>}
        </div>
      </AppModal>
    </>
  );
}
