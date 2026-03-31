'use client';

import Link from 'next/link';
import { use, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import {
  createFutureProcessRiskPlan,
  getSessionProgress,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { createTimestamp, generateId } from '@/constants/inspectionSession/shared';
import { primeControllerDashboardContentItems } from '@/hooks/controller/useControllerDashboard';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import { fetchQuarterlyWordDocument, saveBlobAsFile } from '@/lib/api';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  buildInitialQuarterlySummaryReport,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { parseQuarterKey } from '@/lib/erpReports/shared';
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
import type { QuarterTarget, QuarterlyCounter, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface QuarterlyReportPageProps {
  params: Promise<{
    siteKey: string;
    quarterKey: string;
  }>;
}

interface QuarterlyReportEditorProps {
  currentSite: InspectionSite;
  target: QuarterTarget;
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
  const decodedQuarterKey = decodeURIComponent(quarterKey);
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
  const target = parseQuarterKey(decodedQuarterKey);
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
  const backLabel = isAdminView ? '본사 상세' : '분기 종합보고서 목록';
  const existing = useMemo(
    () => quarterlyReports.find((item) => item.quarterKey === decodedQuarterKey) || null,
    [decodedQuarterKey, quarterlyReports],
  );
  const initialDraft = useMemo(() => {
    if (!currentSite || !target) return null;
    return buildInitialQuarterlySummaryReport(
      currentSite,
      siteSessions,
      target,
      currentUser?.name || currentSite.assigneeName,
      existing,
    );
  }, [currentSite, currentUser?.name, existing, siteSessions, target]);

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

  if (!currentSite || !target || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>현장 또는 대상 분기 정보를 확인하지 못했습니다.</div>
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
                <AdminMenuPanel activeSection="headquarters" />
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
                  target={target}
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

  return sourceSessions.map((session) => session.id);
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

function createEmptyCounter(): QuarterlyCounter {
  return { label: '', count: 0 };
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
  target,
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
    () =>
      [...siteSessions].sort((left, right) => {
        const leftTime = new Date(left.meta.reportDate || left.updatedAt).getTime();
        const rightTime = new Date(right.meta.reportDate || right.updatedAt).getTime();
        return rightTime - leftTime;
      }),
    [siteSessions],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [selectedSourceSessionIds, setSelectedSourceSessionIds] = useState(() =>
    getInitialSelectedSourceIds(initialDraft, sourceSessions),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [opsAssets, setOpsAssets] = useState<OpsAssetOption[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsModalOpen, setOpsModalOpen] = useState(false);
  const [opsQuery, setOpsQuery] = useState('');
  const deferredOpsQuery = useDeferredValue(opsQuery);

  useEffect(() => {
    setDraft(initialDraft);
    setSelectedSourceSessionIds(getInitialSelectedSourceIds(initialDraft, sourceSessions));
  }, [initialDraft, sourceSessions]);

  useEffect(() => {
    if (sourceSessions.length === 0) return;

    setDraft((current) => {
      if (current.generatedFromSessionIds.length > 0) {
        return current;
      }

      return syncQuarterlySummaryReportSources(
        current,
        currentSite,
        siteSessions,
        target,
        sourceSessions.map((session) => session.id),
        sourceSessions,
      );
    });
  }, [currentSite, siteSessions, sourceSessions, target]);

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

  const handleSave = async (status: QuarterlySummaryReport['status']) => {
    const nextDraft = { ...draft, status, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);
    setNotice(
      status === 'completed'
        ? '분기 종합보고서를 완료 처리했습니다.'
        : '분기 종합보고서 초안을 저장했습니다.',
    );
  };

  const handleDownloadWord = async () => {
    try {
      setDocumentError(null);
      setIsGeneratingDocument(true);
      const { blob, filename } = await fetchQuarterlyWordDocument(draft, currentSite);
      saveBlobAsFile(blob, filename);
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error ? nextError.message : '문서를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingDocument(false);
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
        target,
        selectedSourceSessionIds,
        sourceSessions,
      ),
    );
    setNotice(
      selectedSourceSessionIds.length > 0
        ? `선택한 지도 보고서 ${selectedSourceSessionIds.length}건 기준으로 분기 초안을 다시 계산했습니다.`
        : '선택한 지도 보고서가 없어 분기 초안을 빈 상태로 다시 계산했습니다.',
    );
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

  const handleCounterChange = (
    key: 'accidentStats' | 'causativeStats',
    index: number,
    field: keyof QuarterlyCounter,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: field === 'count' ? Number(value || 0) : value }
          : item,
      ),
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
        isSaving={isSaving}
        onDownloadWord={handleDownloadWord}
        onSave={handleSave}
      />
      <QuarterlySummaryCards
        draft={draft}
        error={error}
        documentError={documentError}
        notice={notice}
      />
      <QuarterlySourceSelectionSection
        sourceSessions={sourceSessions}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        selectedSourceSessionIds={selectedSourceSessionIds}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        target={target}
        onOpenSelector={() => setSourceModalOpen(true)}
        onToggleSourceSession={handleToggleSourceSession}
        onSelectAll={() => setSelectedSourceSessionIds(sourceSessions.map((session) => session.id))}
        onClearSelection={() => setSelectedSourceSessionIds([])}
        onRecalculate={handleApplySourceSelection}
      />
      <QuarterlySourceSelectionModal
        open={sourceModalOpen}
        sourceSessions={sourceSessions}
        loading={sourceReportsLoading}
        selectedSourceSet={selectedSourceSet}
        selectedSourceSessionIds={selectedSourceSessionIds}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        target={target}
        onClose={() => setSourceModalOpen(false)}
        onToggleSourceSession={handleToggleSourceSession}
        onSelectAll={() => setSelectedSourceSessionIds(sourceSessions.map((session) => session.id))}
        onClearSelection={() => setSelectedSourceSessionIds([])}
        onRecalculate={() => {
          handleApplySourceSelection();
          setSourceModalOpen(false);
        }}
      />
      <QuarterlySiteSnapshotSection draft={draft} onChange={updateSiteSnapshotField} />
      <QuarterlyStatsSection
        draft={draft}
        onCounterChange={handleCounterChange}
        onAddCounter={(key) =>
          setDraft((current) => ({ ...current, [key]: [...current[key], createEmptyCounter()] }))
        }
        onRemoveCounter={(key, index) =>
          setDraft((current) => ({
            ...current,
            [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
          }))
        }
      />
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
  isSaving: boolean;
  onDownloadWord: () => Promise<void>;
  onSave: (status: QuarterlySummaryReport['status']) => Promise<void>;
}) {
  const { draft, isGeneratingDocument, isSaving, onDownloadWord, onSave } = props;

  return (
    <div className={operationalStyles.toolbar}>
      <div>
        <h1 className={operationalStyles.sectionTitle}>{draft.title}</h1>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() => void onDownloadWord()}
          disabled={isGeneratingDocument}
        >
          {isGeneratingDocument ? '문서 생성 중...' : '문서 다운로드 (.docx)'}
        </button>
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={() => void onSave('completed')}
          disabled={isSaving}
        >
          {isSaving ? '처리 중...' : '완료 처리'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={operationalStyles.toolbar}>
      <div>

        <Link href="#" className={operationalStyles.linkButton}>
          ?꾩떆
        </Link>
        <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
          {draft.title}
        </h1>
        <p className={operationalStyles.sectionDescription}>
          ?먮룞 珥덉븞??寃?좏븯怨?1~5踰덉쓣 ?몄쭛?섏꽭?? 6踰?OPS ?먮즺??愿由ъ옄留??곌껐?????덉뒿?덈떎.
        </p>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button type="button" className="app-button app-button-secondary" onClick={() => void onDownloadWord()} disabled={isGeneratingDocument}>
          {isGeneratingDocument ? '臾몄꽌 ?앹꽦 以?..' : '臾몄꽌 ?ㅼ슫濡쒕뱶 (.docx)'}
        </button>
        <button type="button" className="app-button app-button-secondary" onClick={() => void onSave('draft')} disabled={isSaving}>
          {isSaving ? '저장 중...' : '초안 저장'}
        </button>
        <button type="button" className="app-button app-button-primary" onClick={() => void onSave('completed')} disabled={isSaving}>
          {isSaving ? '泥섎━ 以?..' : '?꾨즺 泥섎━'}
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
          <span className={operationalStyles.summaryLabel}>상태</span>
          <strong className={operationalStyles.summaryValue}>
            {draft.status === 'completed' ? '완료' : '작성 중'}
          </strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>선택 보고서</span>
          <strong className={operationalStyles.summaryValue}>{draft.generatedFromSessionIds.length}건</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>마지막 재계산</span>
          <strong className={operationalStyles.summaryValue}>{formatDateTimeLabel(draft.lastCalculatedAt)}</strong>
        </article>
      </div>
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}
    </>
  );

  return (
    <>
      <div className={operationalStyles.summaryGrid}>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>?꾩옣</span>
          <strong className={operationalStyles.summaryValue}>{draft.siteSnapshot.siteName || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>상태</span>
          <strong className={operationalStyles.summaryValue}>{draft.status === 'completed' ? '완료' : '작성 중'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>선택 보고서</span>
          <strong className={operationalStyles.summaryValue}>{draft.generatedFromSessionIds.length}건</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>마지막 재계산</span>
          <strong className={operationalStyles.summaryValue}>{formatDateTimeLabel(draft.lastCalculatedAt)}</strong>
        </article>
      </div>
      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}
      {!draft.opsAssetId ? (
        <div className={operationalStyles.bannerInfo}>
          6踰?OPS ?먮즺??鍮꾩뼱 ?덉뼱??????꾨즺?????덉뒿?덈떎. ?꾩슂?섎㈃ 愿由ъ옄媛 ?댄썑 蹂댁셿?⑸땲??
        </div>
      ) : null}
    </>
  );
}

function QuarterlySourceSelectionSection(props: {
  sourceSessions: InspectionSession[];
  loading: boolean;
  selectedSourceSet: Set<string>;
  selectedSourceSessionIds: string[];
  hasPendingSelectionChanges: boolean;
  target: QuarterTarget;
  onOpenSelector: () => void;
  onToggleSourceSession: (sessionId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRecalculate: () => void;
}) {
  const {
    sourceSessions,
    loading,
    selectedSourceSet,
    selectedSourceSessionIds,
    hasPendingSelectionChanges,
    target,
    onOpenSelector,
    onToggleSourceSession,
    onSelectAll,
    onClearSelection,
    onRecalculate,
  } = props;
  const selectedSessions = sourceSessions.filter((session) => selectedSourceSet.has(session.id));
  const previewSessions = selectedSessions.slice(0, 3);

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="지도 보고서 선택" />
      {sourceSessions.length > 0 ? (
        <>
          <div className={operationalStyles.summaryGrid}>
            <article className={operationalStyles.summaryCard}>
              <span className={operationalStyles.summaryLabel}>선택 현황</span>
              <strong className={operationalStyles.summaryValue}>
                {selectedSourceSessionIds.length} / {sourceSessions.length}건
              </strong>
            </article>
            <article className={operationalStyles.summaryCard}>
              <span className={operationalStyles.summaryLabel}>재계산 상태</span>
              <strong className={operationalStyles.summaryValue}>
                {hasPendingSelectionChanges ? '변경 있음' : '최신 상태'}
              </strong>
            </article>
          </div>
          <article className={operationalStyles.summaryCard}>
            <div className={operationalStyles.reportCardHeader}>
              <strong className={operationalStyles.reportCardTitle}>선택된 보고서</strong>
              <button type="button" className="app-button app-button-secondary" onClick={onOpenSelector}>
                보고서 선택
              </button>
            </div>
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
              <div className={operationalStyles.emptyState}>선택된 보고서가 없습니다.</div>
            )}
          </article>
          <div className={operationalStyles.reportActions}>
            <button type="button" className="app-button app-button-secondary" onClick={onOpenSelector}>
              목록 열기
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
        </>
      ) : (
        <div className={operationalStyles.emptyState}>
          {loading ? '해당 현장 지도 보고서를 불러오는 중입니다.' : '선택 가능한 지도 보고서가 없습니다.'}
        </div>
      )}
    </article>
  );

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader
        title="?곷떒. ?뚯뒪 蹂닿퀬???좏깮"
        chips={['?먮룞 珥덉븞', '?ш퀎???곗꽑', `${target.startDate} ~ ${target.endDate}`]}
        description="遺꾧린 ?듦퀎??諛섏쁺??湲곗닠吏??蹂닿퀬?쒕? 怨좊Ⅴ怨??ㅼ떆 ?ш퀎?고빀?덈떎. 蹂몃Ц? ?뺤텞?섍퀬, ?ㅼ젣 ?좏깮? 紐⑤떖 由ъ뒪?몄뿉??吏꾪뻾?⑸땲??"
      />
      {sourceSessions.length > 0 ? (
        <>
          <div className={operationalStyles.summaryGrid}>
            <article className={operationalStyles.summaryCard}>
              <span className={operationalStyles.summaryLabel}>?좏깮 ?꾪솴</span>
              <strong className={operationalStyles.summaryValue}>
                {selectedSourceSessionIds.length} / {sourceSessions.length}嫄?              </strong>
              <p className={operationalStyles.muted}>
                {hasPendingSelectionChanges
                  ? '?좏깮??諛붾뚯뿀?듬땲?? ?ш퀎?고븯硫?1~5踰??먮룞 珥덉븞???덈줈 ??뼱?⑥쭛?덈떎.'
                  : '?꾩옱 ?좏깮??蹂닿퀬??吏묓빀?쇰줈 遺꾧린 珥덉븞???좎??섍퀬 ?덉뒿?덈떎.'}
              </p>
            </article>
            <article className={operationalStyles.summaryCard}>
              <span className={operationalStyles.summaryLabel}>?좏깮 踰붿쐞</span>
              <strong className={operationalStyles.summaryValue}>
                {target.startDate} ~ {target.endDate}
              </strong>
              <p className={operationalStyles.muted}>湲곌컙 諛?蹂닿퀬?쒕룄 ?꾩슂?섎㈃ 紐⑤떖?먯꽌 吏곸젒 ?좏깮??諛섏쁺?????덉뒿?덈떎.</p>
            </article>
          </div>
          <article className={operationalStyles.summaryCard}>
            <div className={operationalStyles.reportCardHeader}>
              <strong className={operationalStyles.reportCardTitle}>선택된 보고서</strong>
              <button type="button" className="app-button app-button-secondary" onClick={onOpenSelector}>
                蹂닿퀬???좏깮
              </button>
            </div>
            {previewSessions.length > 0 ? (
              <>
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
                <p className={operationalStyles.muted}>
                  紐⑸줉 ?닿린瑜??꾨Ⅴ硫??꾩껜 蹂닿퀬?쒕? 由ъ뒪?명삎 紐⑤떖?먯꽌 ?뺤씤?섍퀬 諛붽? ???덉뒿?덈떎.
                </p>
              </>
            ) : (
              <div className={operationalStyles.emptyState}>
                ?꾩쭅 ?좏깮??蹂닿퀬?쒓? ?놁뒿?덈떎. 蹂닿퀬???좏깮 踰꾪듉???뚮윭 ?듦퀎??諛섏쁺??蹂닿퀬?쒕? 怨⑤씪二쇱꽭??
              </div>
            )}
          </article>
          <div className={operationalStyles.reportActions}>
            <button type="button" className="app-button app-button-secondary" onClick={onOpenSelector}>
              紐⑸줉 ?닿린
            </button>
            <button type="button" className="app-button app-button-primary" onClick={onRecalculate} disabled={!hasPendingSelectionChanges}>
              ?좏깮??蹂닿퀬?쒕줈 ?ш퀎??            </button>
          </div>
          {selectedSourceSessionIds.length === 0 ? (
            <div className={operationalStyles.bannerInfo}>
              ?좏깮??蹂닿퀬?쒓? ?놁쑝硫??ш퀎????1~5踰??먮룞 珥덉븞??鍮꾩뼱吏????덉뒿?덈떎.
            </div>
          ) : null}
        </>
      ) : (
        <div className={operationalStyles.emptyState}>吏묎퀎???ъ슜??湲곗닠吏??蹂닿퀬?쒓? ?놁뒿?덈떎.</div>
      )}
    </article>
  );

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader
        title="?곷떒. ?뚯뒪 蹂닿퀬???좏깮"
        chips={['?먮룞 珥덉븞', '?ш퀎???곗꽑', `${target.startDate} ~ ${target.endDate}`]}
        description="遺꾧린 ?덉쓽 湲곗닠吏??蹂닿퀬?쒕? 怨⑤씪 珥덉븞???ㅼ떆 怨꾩궛?⑸땲?? ?ш퀎?고븯硫?1~5踰??섏젙媛믪? ??吏묎퀎 寃곌낵濡???뼱?⑥쭛?덈떎."
      />
      {sourceSessions.length > 0 ? (
        <>
          <div className={operationalStyles.sourceList}>
            {sourceSessions.map((session) => {
              const isSelected = selectedSourceSet.has(session.id);
              const progress = getSessionProgress(session).percentage;
              const findingCount = countMeaningfulFindings(session);
              return (
                <article key={session.id} className={`${operationalStyles.sourceCard} ${isSelected ? operationalStyles.sourceCardActive : ''}`}>
                  <div className={operationalStyles.sourceCardTop}>
                    <input type="checkbox" className={`app-checkbox ${operationalStyles.sourceCheckbox}`} checked={isSelected} onChange={(event) => onToggleSourceSession(session.id, event.target.checked)} />
                    <div className={operationalStyles.sourceCardBody}>
                      <strong className={operationalStyles.sourceCardTitle}>{getSessionTitle(session)}</strong>
                      <span className={operationalStyles.sourceCardMeta}>
                        ?묒꽦??{session.meta.reportDate || '-'} / ?묒꽦??{session.meta.drafter || '-'} / 吏꾪뻾瑜?{progress}% / 吏?곸궗??{findingCount}嫄?                      </span>
                    </div>
                    <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  </div>
                  <div className={operationalStyles.sourceCardActions}>
                    <Link href={`/sessions/${encodeURIComponent(session.id)}`} className={`${operationalStyles.linkButton} ${operationalStyles.linkButtonSecondary}`}>
                      ?먮낯 蹂닿린
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className={operationalStyles.reportActions}>
            <button type="button" className="app-button app-button-secondary" onClick={onSelectAll}>?꾩껜 ?좏깮</button>
            <button type="button" className="app-button app-button-secondary" onClick={onClearSelection}>?좏깮 ?댁젣</button>
            <button type="button" className="app-button app-button-primary" onClick={onRecalculate} disabled={!hasPendingSelectionChanges}>재계산</button>
          </div>
          {selectedSourceSessionIds.length === 0 ? (
            <div className={operationalStyles.bannerInfo}>?좏깮??蹂닿퀬?쒓? ?놁쑝硫??ш퀎????1~5踰??먮룞 珥덉븞??鍮꾩썙吏묐땲??</div>
          ) : null}
        </>
      ) : (
        <div className={operationalStyles.emptyState}>???遺꾧린 ?덉뿉 吏묎퀎??湲곗닠吏??蹂닿퀬?쒓? ?놁뒿?덈떎.</div>
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
  target: QuarterTarget;
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
    target,
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
          <button type="button" className="app-button app-button-secondary" onClick={onSelectAll}>
            전체 선택
          </button>
          <button type="button" className="app-button app-button-secondary" onClick={onClearSelection}>
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
                      작성일 {session.meta.reportDate || '-'} / 작성자 {session.meta.drafter || '-'} / 진행률 {progress}% /
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

  return (
    <AppModal
      open={open}
      title="?뚯뒪 蹂닿퀬???좏깮"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onSelectAll}>
            ?꾩껜 ?좏깮
          </button>
          <button type="button" className="app-button app-button-secondary" onClick={onClearSelection}>
            ?좏깮 ?댁젣
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onRecalculate}
            disabled={!hasPendingSelectionChanges}
          >
            ?좏깮 ?곸슜 ???ш퀎??          </button>
        </>
      }
    >
      <p className={operationalStyles.reportCardDescription}>
        {target.startDate} ~ {target.endDate} 援ш컙??遺꾧린 蹂닿퀬?쒖뿉 諛섏쁺??湲곗닠吏??蹂닿퀬?쒕? ?좏깮?섏꽭??
      </p>
      {selectedSourceSessionIds.length === 0 ? (
        <div className={operationalStyles.bannerInfo}>?좏깮??蹂닿퀬?쒓? ?놁쑝硫??먮룞 吏묎퀎 寃곌낵媛 鍮꾩뼱吏????덉뒿?덈떎.</div>
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
                      ?묒꽦??{session.meta.reportDate || '-'} / ?묒꽦??{session.meta.drafter || '-'} / 吏꾪뻾瑜?{progress}% /
                      吏?곸궗??{findingCount}嫄?                    </span>
                  </div>
                </label>
                <div className={operationalStyles.sourceModalRowActions}>
                  <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  <Link
                    href={`/sessions/${encodeURIComponent(session.id)}`}
                    className={`${operationalStyles.linkButton} ${operationalStyles.linkButtonSecondary}`}
                  >
                    ?먮낯 蹂닿린
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={operationalStyles.emptyState}>?좏깮 媛?ν븳 湲곗닠吏??蹂닿퀬?쒓? ?놁뒿?덈떎.</div>
      )}
    </AppModal>
  );
}

function QuarterlySiteSnapshotSection(props: {
  draft: QuarterlySummaryReport;
  onChange: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}) {
  const { draft, onChange } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="1. 기술지도 대상사업장" />
      <div className={operationalStyles.formGrid}>
        <FieldInput label="현장명" value={draft.siteSnapshot.siteName} onChange={(value) => onChange('siteName', value)} />
        <FieldInput label="고객사" value={draft.siteSnapshot.customerName} onChange={(value) => onChange('customerName', value)} />
        <FieldInput label="사업장관리번호" value={draft.siteSnapshot.siteManagementNumber} onChange={(value) => onChange('siteManagementNumber', value)} />
        <FieldInput label="사업개시번호" value={draft.siteSnapshot.businessStartNumber} onChange={(value) => onChange('businessStartNumber', value)} />
        <FieldInput label="공사기간" value={draft.siteSnapshot.constructionPeriod} onChange={(value) => onChange('constructionPeriod', value)} />
        <FieldInput label="공사금액" value={draft.siteSnapshot.constructionAmount} onChange={(value) => onChange('constructionAmount', value)} />
        <FieldInput label="책임자" value={draft.siteSnapshot.siteManagerName} onChange={(value) => onChange('siteManagerName', value)} />
        <FieldInput label="연락처(이메일)" value={draft.siteSnapshot.siteContactEmail} onChange={(value) => onChange('siteContactEmail', value)} />
        <FieldTextarea label="현장주소" value={draft.siteSnapshot.siteAddress} onChange={(value) => onChange('siteAddress', value)} />
        <FieldInput label="회사명" value={draft.siteSnapshot.companyName} onChange={(value) => onChange('companyName', value)} />
        <FieldInput label="법인등록번호" value={draft.siteSnapshot.corporationRegistrationNumber} onChange={(value) => onChange('corporationRegistrationNumber', value)} />
        <FieldInput label="사업자등록번호" value={draft.siteSnapshot.businessRegistrationNumber} onChange={(value) => onChange('businessRegistrationNumber', value)} />
        <FieldInput label="면허번호" value={draft.siteSnapshot.licenseNumber} onChange={(value) => onChange('licenseNumber', value)} />
        <FieldInput label="본사 연락처" value={draft.siteSnapshot.headquartersContact} onChange={(value) => onChange('headquartersContact', value)} />
        <FieldTextarea label="본사 주소" value={draft.siteSnapshot.headquartersAddress} onChange={(value) => onChange('headquartersAddress', value)} />
      </div>
    </article>
  );
}

function QuarterlyStatsSection(props: {
  draft: QuarterlySummaryReport;
  onCounterChange: (
    key: 'accidentStats' | 'causativeStats',
    index: number,
    field: keyof QuarterlyCounter,
    value: string,
  ) => void;
  onAddCounter: (key: 'accidentStats' | 'causativeStats') => void;
  onRemoveCounter: (key: 'accidentStats' | 'causativeStats', index: number) => void;
}) {
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="2. 통계분석(누계)" />
      <div className={operationalStyles.summaryGrid}>
        <CounterEditorCard title="재해형태별 분석" items={props.draft.accidentStats} onChange={(index, field, value) => props.onCounterChange('accidentStats', index, field, value)} onAdd={() => props.onAddCounter('accidentStats')} onRemove={(index) => props.onRemoveCounter('accidentStats', index)} />
        <CounterEditorCard title="기인물별 분석" items={props.draft.causativeStats} onChange={(index, field, value) => props.onCounterChange('causativeStats', index, field, value)} onAdd={() => props.onAddCounter('causativeStats')} onRemove={(index) => props.onRemoveCounter('causativeStats', index)} />
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
      <div className={operationalStyles.tableWrap}>
        <table className={operationalStyles.table}>
          <thead>
            <tr>
              <th>실시일</th>
              <th>보고서명</th>
              <th>차수</th>
              <th>담당자</th>
              <th>공정률</th>
              <th>지적 건수</th>
              <th>개선 건수</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item, index) => (
                <tr key={item.sessionId || index}>
                  <td><input className="app-input" value={item.reportDate} onChange={(event) => onChange(index, 'reportDate', event.target.value)} /></td>
                  <td><input className="app-input" value={item.reportTitle} onChange={(event) => onChange(index, 'reportTitle', event.target.value)} /></td>
                  <td><input className="app-input" type="number" min={0} value={item.reportNumber} onChange={(event) => onChange(index, 'reportNumber', event.target.value)} /></td>
                  <td><input className="app-input" value={item.drafter} onChange={(event) => onChange(index, 'drafter', event.target.value)} /></td>
                  <td><input className="app-input" value={item.progressRate} onChange={(event) => onChange(index, 'progressRate', event.target.value)} /></td>
                  <td><input className="app-input" type="number" min={0} value={item.findingCount} onChange={(event) => onChange(index, 'findingCount', event.target.value)} /></td>
                  <td><input className="app-input" type="number" min={0} value={item.improvedCount} onChange={(event) => onChange(index, 'improvedCount', event.target.value)} /></td>
                  <td><button type="button" className="app-button app-button-secondary" onClick={() => onRemove(index)}>삭제</button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>선택한 기술지도 보고서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={operationalStyles.reportActions}>
        <button type="button" className="app-button app-button-secondary" onClick={onAdd}>행 추가</button>
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
      <div className={operationalStyles.formGrid}>
        {plans.map((item, index) => (
          <div key={item.id} className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
            <span className={operationalStyles.fieldLabel}>향후 공정 {index + 1}</span>
            <div className={operationalStyles.formGrid}>
              <input className="app-input" value={item.processName} placeholder="공정명" onChange={(event) => onChange(plans.map((plan) => plan.id === item.id ? { ...plan, processName: event.target.value } : plan))} />
              <input className="app-input" value={item.hazard} placeholder="유해위험요인" onChange={(event) => onChange(plans.map((plan) => plan.id === item.id ? { ...plan, hazard: event.target.value } : plan))} />
              <textarea className={`app-textarea ${operationalStyles.fieldWide}`} value={item.countermeasure} placeholder="안전대책" onChange={(event) => onChange(plans.map((plan) => plan.id === item.id ? { ...plan, countermeasure: event.target.value } : plan))} />
              <textarea className={`app-textarea ${operationalStyles.fieldWide}`} value={item.note} placeholder="비고" onChange={(event) => onChange(plans.map((plan) => plan.id === item.id ? { ...plan, note: event.target.value } : plan))} />
            </div>
            <div className={operationalStyles.reportActions}>
              <button type="button" className="app-button app-button-secondary" onClick={() => onChange(plans.filter((plan) => plan.id !== item.id))}>삭제</button>
            </div>
          </div>
        ))}
      </div>
      <div className={operationalStyles.reportActions}>
        <button type="button" className="app-button app-button-secondary" onClick={onAdd}>계획 추가</button>
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
        chips={['관리자 전용', draft.opsAssetId ? '자료 연결됨' : '보완 대기']}
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

function CounterEditorCard(props: {
  title: string;
  items: QuarterlyCounter[];
  onChange: (index: number, field: keyof QuarterlyCounter, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <article className={operationalStyles.summaryCard}>
      <span className={operationalStyles.summaryLabel}>{props.title}</span>
      <div className={operationalStyles.checkboxList}>
        {props.items.map((item, index) => (
          <div key={`${props.title}-${index}`} className={operationalStyles.inlineEditorRow}>
            <input className="app-input" value={item.label} placeholder="항목명" onChange={(event) => props.onChange(index, 'label', event.target.value)} />
            <input className="app-input" type="number" min={0} value={item.count} placeholder="건수" onChange={(event) => props.onChange(index, 'count', event.target.value)} />
            <button type="button" className="app-button app-button-secondary" onClick={() => props.onRemove(index)}>삭제</button>
          </div>
        ))}
        <button type="button" className="app-button app-button-secondary" onClick={props.onAdd}>항목 추가</button>
      </div>
    </article>
  );
}

function FieldInput(props: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className={operationalStyles.field}>
      <span className={operationalStyles.fieldLabel}>{props.label}</span>
      <input className="app-input" value={props.value} placeholder={props.placeholder} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}

function FieldTextarea(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
      <span className={operationalStyles.fieldLabel}>{props.label}</span>
      <textarea className="app-textarea" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}
