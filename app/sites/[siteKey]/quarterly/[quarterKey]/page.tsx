'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import { getSessionProgress, getSessionTitle } from '@/constants/inspectionSession';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import { fetchQuarterlyWordDocument, saveBlobAsFile } from '@/lib/api';
import {
  buildInitialQuarterlySummaryReport,
  getQuarterlySourceSessions,
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { parseQuarterKey } from '@/lib/erpReports/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import type { QuarterTarget, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface QuarterlyReportPageProps {
  params: Promise<{
    siteKey: string;
    quarterKey: string;
  }>;
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
          key={`${initialDraft.id}:${initialDraft.updatedAt}`}
          currentSite={currentSite}
          target={target}
          initialDraft={initialDraft}
          isSaving={isSaving}
          error={error}
          onSave={saveQuarterlyReport}
          siteSessions={siteSessions}
        />
      </div>
    </main>
  );
}

interface QuarterlyReportEditorProps {
  currentSite: InspectionSite;
  target: QuarterTarget;
  initialDraft: QuarterlySummaryReport;
  isSaving: boolean;
  error: string | null;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
  siteSessions: InspectionSession[];
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

function QuarterlyReportEditor({
  currentSite,
  target,
  initialDraft,
  isSaving,
  error,
  onSave,
  siteSessions,
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

  const selectedSourceSet = useMemo(
    () => new Set(selectedSourceSessionIds),
    [selectedSourceSessionIds],
  );
  const hasPendingSelectionChanges =
    normalizeIds(selectedSourceSessionIds) !== normalizeIds(draft.generatedFromSessionIds);

  const handleSave = async () => {
    const nextDraft = { ...draft, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);
    setNotice('분기 종합보고서를 저장했습니다.');
  };

  const handleDownloadWord = async () => {
    try {
      setDocumentError(null);
      setIsGeneratingDocument(true);
      const { blob, filename } = await fetchQuarterlyWordDocument(draft, currentSite);
      saveBlobAsFile(blob, filename);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : '문서 다운로드 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  const handleToggleSourceSession = (sessionId: string, checked: boolean) => {
    setSelectedSourceSessionIds((current) => {
      if (checked) {
        return current.includes(sessionId) ? current : [...current, sessionId];
      }

      return current.filter((item) => item !== sessionId);
    });
  };

  const handleApplySourceSelection = () => {
    setDraft((current) =>
      syncQuarterlySummaryReportSources(
        current,
        siteSessions,
        target,
        selectedSourceSessionIds,
      ),
    );
    setNotice(
      selectedSourceSessionIds.length > 0
        ? `선택한 기술지도 보고서 ${selectedSourceSessionIds.length}건을 기준으로 초안을 다시 계산했습니다.`
        : '선택한 기술지도 보고서가 없어 분기 초안을 비운 상태로 다시 계산했습니다.',
    );
  };

  return (
    <section className={operationalStyles.sectionCard}>
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
            {currentSite.siteName} 현장의 {target.label} 기술지도 보고서를 기준으로 분기 종합보고서를 작성합니다.
          </p>
        </div>
        <div className={operationalStyles.toolbarActions}>
          <span className="app-chip">
            {draft.status === 'completed' ? '완료' : '작성 중'}
          </span>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void handleDownloadWord()}
            disabled={isGeneratingDocument}
          >
            {isGeneratingDocument ? '문서 생성 중...' : '문서 다운로드 (.docx)'}
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {error ? <div className={operationalStyles.bannerError}>{error}</div> : null}
      {documentError ? <div className={operationalStyles.bannerError}>{documentError}</div> : null}
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}

      <article className={operationalStyles.reportCard}>
        <div className={operationalStyles.reportCardHeader}>
          <strong className={operationalStyles.reportCardTitle}>1. 대상 분기와 기준 보고서 선택</strong>
          <div className={operationalStyles.statusRow}>
            <span className="app-chip">{target.label}</span>
            <span className="app-chip">
              {target.startDate} ~ {target.endDate}
            </span>
            <span className="app-chip">후보 보고서 {sourceSessions.length}건</span>
            <span className="app-chip">선택 {selectedSourceSessionIds.length}건</span>
          </div>
        </div>
        <p className={operationalStyles.reportCardDescription}>
          대상 분기 안에 있는 기술지도 보고서를 먼저 자동 선택했습니다. 필요하면 체크를 조정한 뒤 아래 초안을 다시 계산하세요.
        </p>

        {sourceSessions.length > 0 ? (
          <>
            <div className={operationalStyles.sourceList}>
              {sourceSessions.map((session) => {
                const isSelected = selectedSourceSet.has(session.id);
                const progress = getSessionProgress(session).percentage;
                const findingCount = countMeaningfulFindings(session);

                return (
                  <article
                    key={session.id}
                    className={`${operationalStyles.sourceCard} ${
                      isSelected ? operationalStyles.sourceCardActive : ''
                    }`}
                  >
                    <div className={operationalStyles.sourceCardTop}>
                      <input
                        type="checkbox"
                        className={`app-checkbox ${operationalStyles.sourceCheckbox}`}
                        checked={isSelected}
                        onChange={(event) =>
                          handleToggleSourceSession(session.id, event.target.checked)
                        }
                      />
                      <div className={operationalStyles.sourceCardBody}>
                        <strong className={operationalStyles.sourceCardTitle}>
                          {getSessionTitle(session)}
                        </strong>
                        <span className={operationalStyles.sourceCardMeta}>
                          작성일 {session.meta.reportDate || '-'} / 작성자 {session.meta.drafter || '-'} / 진행률 {progress}% / 지적사항 {findingCount}건
                        </span>
                      </div>
                      <span className="app-chip">{isSelected ? '선택됨' : '제외됨'}</span>
                    </div>
                    <div className={operationalStyles.sourceCardActions}>
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

            <div className={operationalStyles.reportActions}>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setSelectedSourceSessionIds(sourceSessions.map((session) => session.id))}
              >
                전체 선택
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setSelectedSourceSessionIds([])}
              >
                선택 해제
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={handleApplySourceSelection}
                disabled={!hasPendingSelectionChanges}
              >
                선택한 보고서로 초안 다시 계산
              </button>
            </div>

            {hasPendingSelectionChanges ? (
              <div className={operationalStyles.bannerInfo}>
                기준 보고서 선택이 바뀌었습니다. 초안 다시 계산을 누르면 아래 종합 의견, 통계, 집계 표가 선택 결과에 맞게 갱신됩니다.
              </div>
            ) : null}
          </>
        ) : (
          <div className={operationalStyles.emptyState}>
            대상 분기 안에 집계할 기술지도 보고서가 없습니다.
          </div>
        )}
      </article>

      <div className={operationalStyles.summaryGrid}>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>대상 현장</span>
          <strong className={operationalStyles.summaryValue}>{currentSite.siteName}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>작성자</span>
          <strong className={operationalStyles.summaryValue}>{draft.drafter || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>선택 보고서</span>
          <strong className={operationalStyles.summaryValue}>
            {draft.generatedFromSessionIds.length}건
          </strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>공사기간</span>
          <strong className={operationalStyles.summaryValue}>
            {currentSite.adminSiteSnapshot.constructionPeriod || '-'}
          </strong>
        </article>
      </div>

      <div className={operationalStyles.formGrid}>
        <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
          <span className={operationalStyles.fieldLabel}>기술지도 총평</span>
          <textarea
            className="app-textarea"
            value={draft.overallComment}
            onChange={(event) =>
              setDraft((current) => ({ ...current, overallComment: event.target.value }))
            }
          />
        </label>

        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>작성 상태</span>
          <select
            className="app-select"
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as QuarterlySummaryReport['status'],
              }))
            }
          >
            <option value="draft">작성 중</option>
            <option value="completed">완료</option>
          </select>
        </label>
      </div>

      <div className={operationalStyles.tableWrap}>
        <table className={operationalStyles.table}>
          <thead>
            <tr>
              <th>작성일</th>
              <th>보고서</th>
              <th>작성자</th>
              <th>진행률</th>
              <th>지적 건수</th>
              <th>개선 건수</th>
            </tr>
          </thead>
          <tbody>
            {draft.implementationRows.length > 0 ? (
              draft.implementationRows.map((item) => (
                <tr key={item.sessionId}>
                  <td>{item.reportDate || '-'}</td>
                  <td>{item.reportTitle || `보고서 ${item.reportNumber}`}</td>
                  <td>{item.drafter || '-'}</td>
                  <td>{item.progressRate || '-'}</td>
                  <td>{item.findingCount}</td>
                  <td>{item.improvedCount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>선택된 기술지도 보고서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={operationalStyles.summaryGrid}>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>주요 재해유형</span>
          <div className={operationalStyles.tagList}>
            {draft.accidentStats.length > 0 ? (
              draft.accidentStats.map((item) => (
                <span key={item.label} className={operationalStyles.tag}>
                  {item.label} {item.count}
                </span>
              ))
            ) : (
              <span className={operationalStyles.muted}>집계 데이터 없음</span>
            )}
          </div>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>주요 기인물</span>
          <div className={operationalStyles.tagList}>
            {draft.causativeStats.length > 0 ? (
              draft.causativeStats.map((item) => (
                <span key={item.label} className={operationalStyles.tag}>
                  {item.label} {item.count}
                </span>
              ))
            ) : (
              <span className={operationalStyles.muted}>집계 데이터 없음</span>
            )}
          </div>
        </article>
      </div>

      <div className={operationalStyles.formGrid}>
        {draft.futurePlans.map((item, index) => (
          <div
            key={item.id}
            className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}
          >
            <span className={operationalStyles.fieldLabel}>향후 공정 {index + 1}</span>
            <div className={operationalStyles.formGrid}>
              <input
                className="app-input"
                value={item.processName}
                placeholder="공정명"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    futurePlans: current.futurePlans.map((plan) =>
                      plan.id === item.id
                        ? { ...plan, processName: event.target.value }
                        : plan,
                    ),
                  }))
                }
              />
              <input
                className="app-input"
                value={item.hazard}
                placeholder="유해·위험요인"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    futurePlans: current.futurePlans.map((plan) =>
                      plan.id === item.id ? { ...plan, hazard: event.target.value } : plan,
                    ),
                  }))
                }
              />
              <textarea
                className={`app-textarea ${operationalStyles.fieldWide}`}
                value={item.countermeasure}
                placeholder="대책"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    futurePlans: current.futurePlans.map((plan) =>
                      plan.id === item.id
                        ? { ...plan, countermeasure: event.target.value }
                        : plan,
                    ),
                  }))
                }
              />
              <textarea
                className={`app-textarea ${operationalStyles.fieldWide}`}
                value={item.note}
                placeholder="비고"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    futurePlans: current.futurePlans.map((plan) =>
                      plan.id === item.id ? { ...plan, note: event.target.value } : plan,
                    ),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <article className={operationalStyles.summaryCard}>
        <span className={operationalStyles.summaryLabel}>주요 안전대책</span>
        <div className={operationalStyles.tagList}>
          {draft.majorMeasures.length > 0 ? (
            draft.majorMeasures.map((item, index) => (
              <span key={`${index}-${item}`} className={operationalStyles.tag}>
                {item}
              </span>
            ))
          ) : (
            <span className={operationalStyles.muted}>자동 추천된 대책이 없습니다.</span>
          )}
        </div>
      </article>
    </section>
  );
}
