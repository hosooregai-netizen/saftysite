'use client';

import Link from 'next/link';
import { use, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
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
  getSessionProgress,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { createTimestamp, generateId } from '@/constants/inspectionSession/shared';
import { primeControllerDashboardContentItems } from '@/hooks/controller/useControllerDashboard';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import {
  fetchQuarterlyHwpxDocument,
  fetchQuarterlyPdfDocument,
  saveBlobAsFile,
} from '@/lib/api';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  buildInitialQuarterlySummaryReport,
  createQuarterlySummaryDraft,
  getQuarterlySourceSessions,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { formatPeriodRangeLabel } from '@/lib/erpReports/shared';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { buildSiteQuarterlyListHref } from '@/features/home/lib/siteEntry';
import {
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
import shellStyles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import type { SafetyContentItem } from '@/types/backend';
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
  isSaving: boolean;
  error: string | null;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
  siteSessions: InspectionSession[];
  sourceReportsLoading: boolean;
  currentUserName: string;
  isAdminView: boolean;
}

interface OpsAssetOption {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  fileUrl: string;
  fileName: string;
  type: SafetyContentItem['content_type'];
}

export default function QuarterlyReportPage({ params }: QuarterlyReportPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { siteKey, quarterKey } = use(params);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedReportId = decodeURIComponent(quarterKey);
  const {
    sites,
    sessions,
    isReady,
    isAuthenticated,
    isHydratingReports,
    currentUser,
    authError,
    ensureSiteReportIndexLoaded,
    ensureSessionLoaded,
    getReportIndexBySiteId,
    login,
    logout,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const siteSessions = useMemo(
    () => sessions.filter((session) => session.siteKey === decodedSiteKey),
    [decodedSiteKey, sessions],
  );
  const reportIndexState = useMemo(
    () => (currentSite ? getReportIndexBySiteId(currentSite.id) : null),
    [currentSite, getReportIndexBySiteId],
  );
  const { quarterlyReports, isSaving, error, saveQuarterlyReport } =
    useSiteOperationalReports(currentSite);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite
    ? isAdminView
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : buildSiteQuarterlyListHref(currentSite.id)
    : isAdminView
      ? getAdminSectionHref('headquarters')
      : '/';
  const backLabel = isAdminView ? '현장 메인' : '분기 종합보고서 목록';
  const existing = useMemo(
    () =>
      quarterlyReports.find(
        (item) => item.id === decodedReportId || item.quarterKey === decodedReportId,
      ) || null,
    [decodedReportId, quarterlyReports],
  );
  const initialDraft = useMemo(() => {
    if (!currentSite) return null;

    if (existing) {
      return buildInitialQuarterlySummaryReport(
        currentSite,
        siteSessions,
        currentUser?.name || currentSite.assigneeName,
        existing,
      );
    }

    return {
      ...createQuarterlySummaryDraft(
        currentSite,
        currentUser?.name || currentSite.assigneeName,
      ),
      id: decodedReportId,
    };
  }, [currentSite, currentUser?.name, decodedReportId, existing, siteSessions]);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    void ensureSiteReportIndexLoaded(currentSite.id);
  }, [currentSite, ensureSiteReportIndexLoaded, isAuthenticated, isReady]);

  useEffect(() => {
    if (!currentSite || reportIndexState?.status !== 'loaded') return;
    void Promise.all(
      reportIndexState.items.map((item) => ensureSessionLoaded(item.reportKey)),
    );
  }, [currentSite, ensureSessionLoaded, reportIndexState]);

  const sourceReportsLoading = Boolean(
    currentSite &&
      (reportIndexState?.status === 'loading' ||
        reportIndexState?.status === 'idle' ||
        (reportIndexState?.status === 'loaded' &&
          reportIndexState.items.some(
            (item) => !siteSessions.some((session) => session.id === item.reportKey),
          )) ||
        isHydratingReports),
  );

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>분기 보고서 초안을 불러오는 중입니다.</section>
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

  if (!currentSite || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>현장 또는 보고서 정보를 확인하지 못했습니다.</div>
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
                  <Link
                    href={backHref}
                    className={shellStyles.heroBackLink}
                    aria-label="이전 페이지로"
                  >
                    {'<'} {backLabel}
                  </Link>
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{initialDraft.title}</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <QuarterlyReportEditor
                  key={`${initialDraft.id}:${initialDraft.updatedAt}:${initialDraft.opsAssignedAt}`}
                  currentSite={currentSite}
                  initialDraft={initialDraft}
                  isSaving={isSaving}
                  error={error}
                  onSave={saveQuarterlyReport}
                  siteSessions={siteSessions}
                  sourceReportsLoading={sourceReportsLoading}
                  currentUserName={currentUser?.name || ''}
                  isAdminView={isAdminView}
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

function getInitialSelectedSourceIds(
  initialDraft: QuarterlySummaryReport,
  sourceSessions: InspectionSession[],
) {
  const availableIds = new Set(sourceSessions.map((session) => session.id));
  const existingIds = initialDraft.generatedFromSessionIds.filter((id) => availableIds.has(id));
  if (existingIds.length > 0 || initialDraft.generatedFromSessionIds.length > 0) {
    return existingIds;
  }

  return [];
}

function sortSourceSessionsByDateDesc(sessions: InspectionSession[]) {
  return [...sessions].sort((left, right) => {
    const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
    const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
    return rightTime - leftTime;
  });
}

function countMeaningfulFindings(session: InspectionSession) {
  return session.document7Findings.filter(
    (item) =>
      item.location ||
      item.emphasis ||
      item.improvementPlan ||
      item.accidentType ||
      item.causativeAgentKey ||
      item.metadata,
  ).length;
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
  };
}

function QuarterlyReportEditor({
  currentSite,
  initialDraft,
  isSaving,
  error,
  onSave,
  siteSessions,
  sourceReportsLoading,
  currentUserName,
  isAdminView,
}: QuarterlyReportEditorProps) {
  const sourceSessions = useMemo(
    () => sortSourceSessionsByDateDesc(siteSessions),
    [siteSessions],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [selectedSourceSessionIds, setSelectedSourceSessionIds] = useState(() =>
    getInitialSelectedSourceIds(initialDraft, sourceSessions),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [titleEditorOpen, setTitleEditorOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialDraft.title);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [opsAssets, setOpsAssets] = useState<OpsAssetOption[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsModalOpen, setOpsModalOpen] = useState(false);
  const [opsQuery, setOpsQuery] = useState('');
  const deferredOpsQuery = useDeferredValue(opsQuery);
  const lastPersistedDraftFingerprintRef = useRef(getQuarterlyDraftFingerprint(initialDraft));
  const draftFingerprint = useMemo(() => getQuarterlyDraftFingerprint(draft), [draft]);
  const isGeneratingDocument = isGeneratingHwpx || isGeneratingPdf;
  const availableSourceSessions = useMemo(
    () =>
      sortSourceSessionsByDateDesc(
        getQuarterlySourceSessions(siteSessions, {
          periodStartDate: draft.periodStartDate,
          periodEndDate: draft.periodEndDate,
        }),
      ),
    [draft.periodEndDate, draft.periodStartDate, siteSessions],
  );

  useEffect(() => {
    setDraft(initialDraft);
    setTitleDraft(initialDraft.title);
    setSelectedSourceSessionIds(getInitialSelectedSourceIds(initialDraft, sourceSessions));
    lastPersistedDraftFingerprintRef.current = getQuarterlyDraftFingerprint(initialDraft);
  }, [initialDraft, sourceSessions]);

  useEffect(() => {
    if (!isAdminView) return;
    let cancelled = false;

    const loadOpsAssets = async () => {
      setOpsLoading(true);
      setOpsError(null);
      try {
        const token = readSafetyAuthToken();
        if (!token) throw new Error('콘텐츠를 불러오려면 다시 로그인해 주세요.');
        const contentItems = await primeControllerDashboardContentItems(token);
        if (cancelled) return;
        setOpsAssets(
          contentItems
            .filter((item) => item.content_type === 'campaign_template' && item.is_active)
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
        if (!cancelled) setOpsLoading(false);
      }
    };

    void loadOpsAssets();

    return () => {
      cancelled = true;
    };
  }, [isAdminView]);

  const selectedSourceSet = useMemo(
    () => new Set(selectedSourceSessionIds),
    [selectedSourceSessionIds],
  );
  const hasPendingSelectionChanges =
    normalizeIds(selectedSourceSessionIds) !== normalizeIds(draft.generatedFromSessionIds);
  const filteredOpsAssets = useMemo(() => {
    const normalizedQuery = deferredOpsQuery.trim().toLowerCase();
    if (!normalizedQuery) return opsAssets;
    return opsAssets.filter((item) =>
      [item.title, item.description, item.fileName].join(' ').toLowerCase().includes(normalizedQuery),
    );
  }, [deferredOpsQuery, opsAssets]);

  useEffect(() => {
    if (draftFingerprint === lastPersistedDraftFingerprintRef.current || isSaving) {
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
  }, [draft, draftFingerprint, isSaving, onSave]);

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
      setIsGeneratingPdf(true);
      const { blob, filename } = await fetchQuarterlyPdfDocument(draft, currentSite);
      saveBlobAsFile(blob, filename);
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error ? nextError.message : 'PDF를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleToggleSourceSession = (sessionId: string, checked: boolean) => {
    setSelectedSourceSessionIds((current) => {
      if (checked) return current.includes(sessionId) ? current : [...current, sessionId];
      return current.filter((item) => item !== sessionId);
    });
  };

  const handleApplySourceSelection = () => {
    setDraft((current) =>
      syncQuarterlySummaryReportSources(
        current,
        currentSite,
        siteSessions,
        selectedSourceSessionIds,
        availableSourceSessions,
      ),
    );
    setNotice(
      selectedSourceSessionIds.length > 0
        ? `선택한 지도 보고서 ${selectedSourceSessionIds.length}건을 반영했습니다.`
        : '선택한 지도 보고서가 없습니다.',
    );
  };

  const handlePeriodChange = (
    field: 'periodStartDate' | 'periodEndDate',
    value: string,
  ) => {
    const nextDraft = {
      ...draft,
      [field]: value,
    };
    const nextAvailableSourceSessions = sortSourceSessionsByDateDesc(
      getQuarterlySourceSessions(siteSessions, nextDraft),
    );
    const nextSelectedSourceSessionIds = nextAvailableSourceSessions.map((session) => session.id);

    setSelectedSourceSessionIds(nextSelectedSourceSessionIds);
    setDraft(
      syncQuarterlySummaryReportSources(
        nextDraft,
        currentSite,
        siteSessions,
        nextSelectedSourceSessionIds,
        nextAvailableSourceSessions,
      ),
    );
    setNotice(null);
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

  const handleSelectOpsAsset = (asset: OpsAssetOption) => {
    setDraft((current) => ({
      ...current,
      opsAssetId: asset.id,
      opsAssetTitle: asset.title,
      opsAssetDescription: asset.description,
      opsAssetPreviewUrl: asset.previewUrl,
      opsAssetFileUrl: asset.fileUrl,
      opsAssetFileName: asset.fileName,
      opsAssetType: asset.type,
      opsAssignedBy: currentUserName || current.opsAssignedBy,
      opsAssignedAt: createTimestamp(),
    }));
    setOpsModalOpen(false);
    setNotice('6번 OPS 자료를 연결했습니다.');
  };

  const handleClearOpsAsset = () => {
    setDraft((current) => ({
      ...current,
      opsAssetId: '',
      opsAssetTitle: '',
      opsAssetDescription: '',
      opsAssetPreviewUrl: '',
      opsAssetFileUrl: '',
      opsAssetFileName: '',
      opsAssetType: '',
      opsAssignedBy: '',
      opsAssignedAt: '',
    }));
    setNotice('6번 OPS 자료 연결을 해제했습니다.');
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
        sourceSessions={availableSourceSessions}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        onChangePeriod={handlePeriodChange}
        onOpenSelector={() => setSourceModalOpen(true)}
        onRecalculate={handleApplySourceSelection}
      />
      <QuarterlySourceSelectionModal
        open={sourceModalOpen}
        sourceSessions={availableSourceSessions}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        selectedSourceSessionIds={selectedSourceSessionIds}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        onClose={() => setSourceModalOpen(false)}
        onToggleSourceSession={handleToggleSourceSession}
        onSelectAll={() =>
          setSelectedSourceSessionIds(availableSourceSessions.map((session) => session.id))
        }
        onClearSelection={() => setSelectedSourceSessionIds([])}
        onRecalculate={() => {
          handleApplySourceSelection();
          setSourceModalOpen(false);
        }}
      />
      <QuarterlySiteSnapshotSection
        draft={draft}
        onChange={updateSiteSnapshotField}
      />
      <QuarterlyStatsSection draft={draft} />
      <QuarterlyOverallCommentSection
        value={draft.overallComment}
        onChange={(value) => setDraft((current) => ({ ...current, overallComment: value }))}
      />
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
        isAdminView={isAdminView}
        onOpenSelector={() => setOpsModalOpen(true)}
        onClear={handleClearOpsAsset}
      />
      <QuarterlyOpsAssetModal
        open={opsModalOpen}
        query={opsQuery}
        loading={opsLoading}
        error={opsError}
        items={filteredOpsAssets}
        selectedId={draft.opsAssetId}
        onChangeQuery={setOpsQuery}
        onClose={() => setOpsModalOpen(false)}
        onSelect={handleSelectOpsAsset}
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
          {isGeneratingHwpx ? '문서 생성 중...' : '문서 다운로드 (.hwpx)'}
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
      <div className={operationalStyles.summaryGrid}>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>현장</span>
          <strong className={operationalStyles.summaryValue}>{draft.siteSnapshot.siteName || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>선택 보고서</span>
          <strong className={operationalStyles.summaryValue}>{draft.generatedFromSessionIds.length}건</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>수정일</span>
          <strong className={operationalStyles.summaryValue}>
            {formatDateTimeLabel(draft.updatedAt || draft.lastCalculatedAt)}
          </strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>기간</span>
          <strong className={operationalStyles.summaryValue}>
            {formatPeriodRangeLabel(draft.periodStartDate, draft.periodEndDate)}
          </strong>
        </article>
      </div>
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}
    </>
  );
}

function QuarterlySourceSelectionSection(props: {
  periodStartDate: string;
  periodEndDate: string;
  sourceSessions: InspectionSession[];
  loading: boolean;
  selectedSourceSet: Set<string>;
  hasPendingSelectionChanges: boolean;
  onChangePeriod: (field: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onOpenSelector: () => void;
  onRecalculate: () => void;
}) {
  const {
    periodStartDate,
    periodEndDate,
    sourceSessions,
    loading,
    selectedSourceSet,
    hasPendingSelectionChanges,
    onChangePeriod,
    onOpenSelector,
    onRecalculate,
  } = props;
  const selectedSessions = sourceSessions.filter((session) => selectedSourceSet.has(session.id));
  const previewSessions = selectedSessions.slice(0, 3);

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="지도 보고서 선택" />
      <div className={operationalStyles.periodFieldGrid}>
        <FieldInput
          label="시작일"
          type="date"
          value={periodStartDate}
          onChange={(value) => onChangePeriod('periodStartDate', value)}
        />
        <FieldInput
          label="종료일"
          type="date"
          value={periodEndDate}
          onChange={(value) => onChangePeriod('periodEndDate', value)}
        />
      </div>

      {sourceSessions.length > 0 ? (
        <div className={operationalStyles.inlineEditorRow}>
          {previewSessions.length > 0 ? (
            <div className={operationalStyles.tagList}>
              {previewSessions.map((session) => (
                <span key={session.id} className={operationalStyles.tag}>
                  {getSessionTitle(session)}
                </span>
              ))}
              {selectedSessions.length > previewSessions.length ? (
                <span className={operationalStyles.tag}>+{selectedSessions.length - previewSessions.length}건</span>
              ) : null}
            </div>
          ) : (
            <div className={operationalStyles.muted}>선택된 보고서가 없습니다.</div>
          )}
          <div className={operationalStyles.inlineEditorActions}>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onOpenSelector}
            >
              보고서 선택
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={onRecalculate}
              disabled={!hasPendingSelectionChanges}
            >
              재계산
            </button>
          </div>
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading ? '해당 현장 지도 보고서를 불러오는 중입니다.' : '선택 가능한 지도 보고서가 없습니다.'}
        </div>
      )}
    </article>
  );
}

function QuarterlySourceSelectionModal(props: {
  open: boolean;
  sourceSessions: InspectionSession[];
  loading: boolean;
  selectedSourceSet: Set<string>;
  selectedSourceSessionIds: string[];
  hasPendingSelectionChanges: boolean;
  onClose: () => void;
  onToggleSourceSession: (sessionId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRecalculate: () => void;
}) {
  const {
    open,
    sourceSessions,
    loading,
    selectedSourceSet,
    selectedSourceSessionIds,
    hasPendingSelectionChanges,
    onClose,
    onToggleSourceSession,
    onSelectAll,
    onClearSelection,
    onRecalculate,
  } = props;

  return (
    <AppModal
      open={open}
      title="지도 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onSelectAll}
            >
              전체 선택
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={onClearSelection}
            >
              선택 해제
            </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onRecalculate}
            disabled={!hasPendingSelectionChanges}
          >
            재계산
          </button>
        </>
      }
    >
      {selectedSourceSessionIds.length === 0 ? (
        <div className={operationalStyles.bannerInfo}>선택된 보고서가 없습니다.</div>
      ) : null}
      {sourceSessions.length > 0 ? (
        <div className={operationalStyles.sourceModalList}>
          {sourceSessions.map((session) => {
            const isSelected = selectedSourceSet.has(session.id);
            const progress = getSessionProgress(session).percentage;
            const findingCount = countMeaningfulFindings(session);

            return (
              <article
                key={session.id}
                className={`${operationalStyles.sourceModalRow} ${isSelected ? operationalStyles.sourceModalRowActive : ''}`}
              >
                <label className={operationalStyles.sourceModalRowMain}>
                  <input
                    type="checkbox"
                    className={`app-checkbox ${operationalStyles.sourceCheckbox}`}
                    checked={isSelected}
                    onChange={(event) => onToggleSourceSession(session.id, event.target.checked)}
                  />
                  <div className={operationalStyles.sourceCardBody}>
                    <strong className={operationalStyles.sourceCardTitle}>{getSessionTitle(session)}</strong>
                    <span className={operationalStyles.sourceCardMeta}>
                      지도일 {getSessionGuidanceDate(session) || '-'} / 작성자 {session.meta.drafter || '-'} / 진행률 {progress}% /
                      지적사항 {findingCount}건
                    </span>
                  </div>
                </label>
                <div className={operationalStyles.sourceModalRowActions}>
                  <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  <Link
                    href={`/sessions/${encodeURIComponent(session.id)}`}
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
          {loading ? '해당 현장 지도 보고서를 불러오는 중입니다.' : '선택 가능한 지도 보고서가 없습니다.'}
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
      <SectionHeader title="1. 기술지도 대상사업장" />
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
                    현장주소
                  </th>
                  <SnapshotInputCell
                    label="현장주소"
                    value={draft.siteSnapshot.siteAddress}
                    onChange={(value) => onChange('siteAddress', value)}
                    colSpan={3}
                  />
                </tr>
                <tr>
                  <th scope="row" className={operationalStyles.snapshotLabelCell}>
                    고객사
                  </th>
                  <SnapshotInputCell
                    label="고객사"
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
                    본사주소
                  </th>
                  <SnapshotInputCell
                    label="본사주소"
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
      <SectionHeader title="2. 통계분석(누계)" />
      <div className={operationalStyles.cardGrid}>
        <ChartCard title="지적유형별 종합" entries={props.draft.accidentStats} />
        <ChartCard title="기인물별 종합" entries={props.draft.causativeStats} />
      </div>
    </article>
  );
}

function QuarterlyOverallCommentSection(props: { value: string; onChange: (value: string) => void }) {
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="3. 기술지도 총평" />
      <FieldTextarea label="총평" value={props.value} onChange={props.onChange} />
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
      <SectionHeader title="4. 기술지도 이행현황" />
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
              <th className={operationalStyles.implementationHeaderCell}>실시일</th>
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
                <td colSpan={9} className={operationalStyles.implementationEmptyCell}>선택한 기술지도 보고서가 없습니다.</td>
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
      <SectionHeader title="5. 향후 공정 유해위험요인 및 대책" />
      <div className={operationalStyles.implementationTableWrap}>
        <table className={operationalStyles.implementationTable}>
          <colgroup>
            <col className={operationalStyles.futurePlanColHazard} />
            <col className={operationalStyles.futurePlanColMeasure} />
            <col className={operationalStyles.futurePlanColAction} />
          </colgroup>
          <thead>
            <tr>
              <th className={operationalStyles.implementationHeaderCell}>위험요인</th>
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
                  <FuturePlanInputCell
                    value={item.hazard}
                    onChange={(value) =>
                      onChange(
                        plans.map((plan) =>
                          plan.id === item.id
                            ? { ...plan, processName: '', hazard: value }
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
                            ? { ...plan, note: '', countermeasure: value }
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
                <td colSpan={3} className={operationalStyles.implementationEmptyCell}>
                  등록된 향후 공정 항목이 없습니다.
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
  isAdminView: boolean;
  onOpenSelector: () => void;
  onClear: () => void;
}) {
  const { draft, isAdminView, onOpenSelector, onClear } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader
        title="6. OPS / One Point Sheet"
        chips={draft.opsAssetId ? ['관리자 전용', '자료 연결됨'] : ['관리자 전용']}
        description="작성자는 연결 결과만 확인할 수 있습니다. 관리자는 콘텐츠의 캠페인 자료를 선택해 이 섹션을 보완합니다."
      />
      {draft.opsAssetId ? (
        <div className={operationalStyles.opsAssetCard}>
          {draft.opsAssetPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.opsAssetPreviewUrl} alt={draft.opsAssetTitle || 'OPS 자료'} className={operationalStyles.opsAssetPreview} />
          ) : (
            <div className={operationalStyles.emptyState}>미리보기 이미지가 없습니다.</div>
          )}
          <div className={operationalStyles.field}>
            <strong className={operationalStyles.reportCardTitle}>{draft.opsAssetTitle || '제목 없음'}</strong>
            {draft.opsAssetDescription ? <p className={operationalStyles.reportCardDescription}>{draft.opsAssetDescription}</p> : null}
            <p className={operationalStyles.muted}>{draft.opsAssignedBy ? `연결자 ${draft.opsAssignedBy} / ${formatDateTimeLabel(draft.opsAssignedAt)}` : '연결 정보 없음'}</p>
            {draft.opsAssetFileUrl ? <a href={draft.opsAssetFileUrl} target="_blank" rel="noreferrer" className={operationalStyles.linkButton}>원본 자료 열기</a> : null}
          </div>
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>아직 연결된 OPS 자료가 없습니다. 관리자가 이후 자료를 연결할 수 있습니다.</div>
      )}
      {isAdminView ? (
        <div className={operationalStyles.reportActions}>
          <button type="button" className="app-button app-button-primary" onClick={onOpenSelector}>라이브러리에서 선택</button>
          {draft.opsAssetId ? <button type="button" className="app-button app-button-secondary" onClick={onClear}>연결 해제</button> : null}
        </div>
      ) : null}
    </article>
  );
}

function QuarterlyOpsAssetModal(props: {
  open: boolean;
  query: string;
  loading: boolean;
  error: string | null;
  items: OpsAssetOption[];
  selectedId: string;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (asset: OpsAssetOption) => void;
}) {
  const { open, query, loading, error, items, selectedId, onChangeQuery, onClose, onSelect } = props;
  return (
    <AppModal open={open} title="OPS 자료 선택" size="large" onClose={onClose} actions={<button type="button" className="app-button app-button-secondary" onClick={onClose}>닫기</button>}>
      <FieldInput label="검색" value={query} onChange={onChangeQuery} placeholder="제목이나 설명으로 검색" />
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {loading ? (
        <div className={operationalStyles.emptyState}>OPS 자료를 불러오는 중입니다.</div>
      ) : items.length > 0 ? (
        <div className={operationalStyles.opsAssetGrid}>
          {items.map((asset) => {
            const isSelected = selectedId === asset.id;
            return (
              <article key={asset.id} className={`${operationalStyles.sourceCard} ${isSelected ? operationalStyles.sourceCardActive : ''}`}>
                {asset.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.previewUrl} alt={asset.title} className={operationalStyles.opsAssetPreview} />
                ) : (
                  <div className={operationalStyles.emptyState}>미리보기 없음</div>
                )}
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>{asset.title}</strong>
                  <span className={operationalStyles.sourceCardMeta}>{asset.description || '설명 없음'}</span>
                  {asset.fileName ? <span className={operationalStyles.muted}>{asset.fileName}</span> : null}
                </div>
                <div className={operationalStyles.sourceCardActions}>
                  <button type="button" className="app-button app-button-primary" onClick={() => onSelect(asset)}>{isSelected ? '다시 선택' : '이 자료 연결'}</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>선택 가능한 캠페인 자료가 없습니다. 관리자 콘텐츠에서 자료를 먼저 등록해 주세요.</div>
      )}
    </AppModal>
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

function FieldTextarea(props: {
  label: string;
  readOnly?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
      <span className={operationalStyles.fieldLabel}>{props.label}</span>
      <textarea
        className={`app-textarea ${props.readOnly ? operationalStyles.readOnlyField : ''}`}
        value={props.value}
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
