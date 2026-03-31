'use client';

import Link from 'next/link';
import { use, useDeferredValue, useEffect, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import AppModal from '@/components/ui/AppModal';
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
import { isAdminUserRole } from '@/lib/admin';
import {
  buildInitialQuarterlySummaryReport,
  getQuarterlySourceSessions,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { parseQuarterKey } from '@/lib/erpReports/shared';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import {
  contentBodyToAssetName,
  contentBodyToAssetUrl,
  contentBodyToImageUrl,
  contentBodyToText,
} from '@/lib/safetyApiMappers/utils';
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
  const { siteKey, quarterKey } = use(params);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedQuarterKey = decodeURIComponent(quarterKey);
  const {
    sites,
    sessions,
    isReady,
    isAuthenticated,
    currentUser,
    authError,
    login,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const siteSessions = useMemo(
    () => sessions.filter((session) => session.siteKey === decodedSiteKey),
    [decodedSiteKey, sessions],
  );
  const target = parseQuarterKey(decodedQuarterKey);
  const { quarterlyReports, isSaving, error, saveQuarterlyReport } =
    useSiteOperationalReports(currentSite);
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

  if (!currentSite || !target || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>
              현장 또는 대상 분기 정보를 확인하지 못했습니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <QuarterlyReportEditor
          key={`${initialDraft.id}:${initialDraft.updatedAt}:${initialDraft.opsAssignedAt}`}
          currentSite={currentSite}
          target={target}
          initialDraft={initialDraft}
          isSaving={isSaving}
          error={error}
          onSave={saveQuarterlyReport}
          siteSessions={siteSessions}
          currentUserName={currentUser?.name || ''}
          isAdminView={Boolean(currentUser && isAdminUserRole(currentUser.role))}
        />
      </div>
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
  currentUserName,
  isAdminView,
}: QuarterlyReportEditorProps) {
  const sourceSessions = useMemo(
    () => getQuarterlySourceSessions(siteSessions, target),
    [siteSessions, target],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [selectedSourceSessionIds, setSelectedSourceSessionIds] = useState(() =>
    getInitialSelectedSourceIds(initialDraft, sourceSessions),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
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
        nextError instanceof Error
          ? nextError.message
          : '문서 다운로드 중 오류가 발생했습니다.',
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
      ),
    );
    setNotice(
      selectedSourceSessionIds.length > 0
        ? `선택한 기술지도 보고서 ${selectedSourceSessionIds.length}건 기준으로 분기 초안을 다시 계산했습니다.`
        : '선택한 기술지도 보고서가 없어 분기 초안을 비운 상태로 다시 계산했습니다.',
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
        currentSite={currentSite}
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
        selectedSourceSet={selectedSourceSet}
        selectedSourceSessionIds={selectedSourceSessionIds}
        hasPendingSelectionChanges={hasPendingSelectionChanges}
        target={target}
        onToggleSourceSession={handleToggleSourceSession}
        onSelectAll={() => setSelectedSourceSessionIds(sourceSessions.map((session) => session.id))}
        onClearSelection={() => setSelectedSourceSessionIds([])}
        onRecalculate={handleApplySourceSelection}
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

function SectionHeader(props: { title: string; chips: string[]; description?: string }) {
  return (
    <>
      <div className={operationalStyles.reportCardHeader}>
        <strong className={operationalStyles.reportCardTitle}>{props.title}</strong>
        <div className={operationalStyles.statusRow}>
          {props.chips.map((chip) => (
            <span key={chip} className="app-chip">
              {chip}
            </span>
          ))}
        </div>
      </div>
      {props.description ? (
        <p className={operationalStyles.reportCardDescription}>{props.description}</p>
      ) : null}
    </>
  );
}

function QuarterlySummaryToolbar(props: {
  currentSite: InspectionSite;
  draft: QuarterlySummaryReport;
  isGeneratingDocument: boolean;
  isSaving: boolean;
  onDownloadWord: () => Promise<void>;
  onSave: (status: QuarterlySummaryReport['status']) => Promise<void>;
}) {
  const { currentSite, draft, isGeneratingDocument, isSaving, onDownloadWord, onSave } = props;

  return (
    <div className={operationalStyles.toolbar}>
      <div>
        <Link
          href={`/sites/${encodeURIComponent(currentSite.id)}/entry?entry=quarterly`}
          className={`${operationalStyles.linkButtonSecondary} ${operationalStyles.linkButton}`}
        >
          현장 허브로 돌아가기
        </Link>
        <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
          {draft.title}
        </h1>
        <p className={operationalStyles.sectionDescription}>
          자동 초안을 검토하고 1~5번을 편집하세요. 6번 OPS 자료는 관리자만 연결할 수 있습니다.
        </p>
      </div>
      <div className={operationalStyles.toolbarActions}>
        <button type="button" className="app-button app-button-secondary" onClick={() => void onDownloadWord()} disabled={isGeneratingDocument}>
          {isGeneratingDocument ? '문서 생성 중...' : '문서 다운로드 (.docx)'}
        </button>
        <button type="button" className="app-button app-button-secondary" onClick={() => void onSave('draft')} disabled={isSaving}>
          {isSaving ? '저장 중...' : '초안 저장'}
        </button>
        <button type="button" className="app-button app-button-primary" onClick={() => void onSave('completed')} disabled={isSaving}>
          {isSaving ? '처리 중...' : '완료 처리'}
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
          6번 OPS 자료는 비어 있어도 저장/완료할 수 있습니다. 필요하면 관리자가 이후 보완합니다.
        </div>
      ) : null}
    </>
  );
}

function QuarterlySourceSelectionSection(props: {
  sourceSessions: InspectionSession[];
  selectedSourceSet: Set<string>;
  selectedSourceSessionIds: string[];
  hasPendingSelectionChanges: boolean;
  target: QuarterTarget;
  onToggleSourceSession: (sessionId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRecalculate: () => void;
}) {
  const {
    sourceSessions,
    selectedSourceSet,
    selectedSourceSessionIds,
    hasPendingSelectionChanges,
    target,
    onToggleSourceSession,
    onSelectAll,
    onClearSelection,
    onRecalculate,
  } = props;

  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader
        title="상단. 소스 보고서 선택"
        chips={['자동 초안', '재계산 우선', `${target.startDate} ~ ${target.endDate}`]}
        description="분기 안의 기술지도 보고서를 골라 초안을 다시 계산합니다. 재계산하면 1~5번 수정값은 새 집계 결과로 덮어써집니다."
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
                        작성일 {session.meta.reportDate || '-'} / 작성자 {session.meta.drafter || '-'} / 진행률 {progress}% / 지적사항 {findingCount}건
                      </span>
                    </div>
                    <span className="app-chip">{isSelected ? '선택됨' : '미선택'}</span>
                  </div>
                  <div className={operationalStyles.sourceCardActions}>
                    <Link href={`/sessions/${encodeURIComponent(session.id)}`} className={`${operationalStyles.linkButton} ${operationalStyles.linkButtonSecondary}`}>
                      원본 보기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className={operationalStyles.reportActions}>
            <button type="button" className="app-button app-button-secondary" onClick={onSelectAll}>전체 선택</button>
            <button type="button" className="app-button app-button-secondary" onClick={onClearSelection}>선택 해제</button>
            <button type="button" className="app-button app-button-primary" onClick={onRecalculate} disabled={!hasPendingSelectionChanges}>선택한 보고서로 재계산</button>
          </div>
          {selectedSourceSessionIds.length === 0 ? (
            <div className={operationalStyles.bannerInfo}>선택된 보고서가 없으면 재계산 후 1~5번 자동 초안이 비워집니다.</div>
          ) : null}
        </>
      ) : (
        <div className={operationalStyles.emptyState}>대상 분기 안에 집계할 기술지도 보고서가 없습니다.</div>
      )}
    </article>
  );
}

function QuarterlySiteSnapshotSection(props: {
  draft: QuarterlySummaryReport;
  onChange: (field: keyof QuarterlySummaryReport['siteSnapshot'], value: string) => void;
}) {
  const { draft, onChange } = props;
  return (
    <article className={operationalStyles.reportCard}>
      <SectionHeader title="1. 기술지도 대상사업장" chips={['자동 초안', '수정 가능']} />
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
      <SectionHeader title="2. 통계분석(누계)" chips={['자동 초안', '수정 가능']} />
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
      <SectionHeader title="3. 기술지도 총평" chips={['자동 초안', '수정 가능']} />
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
      <SectionHeader title="4. 기술지도 이행현황" chips={['자동 초안', '수정 가능']} />
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
      <SectionHeader title="5. 향후 공정 유해위험요인 및 대책" chips={['자동 초안', '수정 가능']} />
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
      <SectionHeader title="6. OPS / One Point Sheet" chips={['관리자 전용', draft.opsAssetId ? '자료 연결됨' : '보완 대기']} description="작성자는 연결 결과만 확인할 수 있습니다. 관리자는 콘텐츠의 캠페인 자료를 선택해 이 섹션을 보완합니다." />
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
        <div className={operationalStyles.emptyState}>아직 연결된 OPS 자료가 없습니다. 작성자는 그대로 진행할 수 있고, 관리자가 이후 자료를 연결할 수 있습니다.</div>
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
        <div className={operationalStyles.emptyState}>선택 가능한 캠페인 자료가 없습니다. 관리자 콘텐츠에서 `캠페인 자료`를 먼저 등록해 주세요.</div>
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
