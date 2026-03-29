'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  fetchQuarterlyWordDocument,
  saveBlobAsFile,
} from '@/lib/api';
import { buildInitialQuarterlySummaryReport } from '@/lib/erpReports/quarterly';
import { parseQuarterKey } from '@/lib/erpReports/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSite } from '@/types/inspectionSession';

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
    [decodedSiteKey, sites]
  );
  const siteSessions = useMemo(
    () => sessions.filter((session) => session.siteKey === decodedSiteKey),
    [decodedSiteKey, sessions]
  );
  const target = parseQuarterKey(decodedQuarterKey);
  const { quarterlyReports, isSaving, error, saveQuarterlyReport } =
    useSiteOperationalReports(currentSite);
  const existing = useMemo(
    () =>
      quarterlyReports.find((item) => item.quarterKey === decodedQuarterKey) || null,
    [decodedQuarterKey, quarterlyReports]
  );
  const initialDraft = useMemo(() => {
    if (!currentSite || !target) return null;
    return buildInitialQuarterlySummaryReport(
      currentSite,
      siteSessions,
      target,
      currentUser?.name || currentSite.assigneeName,
      existing
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
        description="분기 보고서를 저장하려면 다시 로그인해 주세요."
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
          quarterLabel={target.label}
          initialDraft={initialDraft}
          isSaving={isSaving}
          error={error}
          onSave={saveQuarterlyReport}
        />
      </div>
    </main>
  );
}

interface QuarterlyReportEditorProps {
  currentSite: InspectionSite;
  quarterLabel: string;
  initialDraft: QuarterlySummaryReport;
  isSaving: boolean;
  error: string | null;
  onSave: (report: QuarterlySummaryReport) => Promise<void>;
}

function QuarterlyReportEditor({
  currentSite,
  quarterLabel,
  initialDraft,
  isSaving,
  error,
  onSave,
}: QuarterlyReportEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

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
        error instanceof Error ? error.message : '문서 다운로드 중 오류가 발생했습니다.'
      );
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  return (
    <section className={operationalStyles.sectionCard}>
      <div className={operationalStyles.toolbar}>
        <div>
          <Link
            href={`/sites/${encodeURIComponent(currentSite.id)}`}
            className={operationalStyles.linkButtonSecondary + ' ' + operationalStyles.linkButton}
          >
            현장으로 돌아가기
          </Link>
          <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
            {draft.title}
          </h1>
          <p className={operationalStyles.sectionDescription}>
            {currentSite.siteName} 현장의 {quarterLabel} 기술지도 데이터를 집계한 초안입니다.
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
      {notice ? <div className="app-chip">{notice}</div> : null}

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
          <span className={operationalStyles.summaryLabel}>집계 보고서</span>
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
              <th>실시일</th>
              <th>보고서</th>
              <th>작성자</th>
              <th>공정율</th>
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
                <td colSpan={6}>대상 분기에 집계된 기술지도 보고서가 없습니다.</td>
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
                        : plan
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
                      plan.id === item.id ? { ...plan, hazard: event.target.value } : plan
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
                        : plan
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
                      plan.id === item.id ? { ...plan, note: event.target.value } : plan
                    ),
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>

      <article className={operationalStyles.summaryCard}>
        <span className={operationalStyles.summaryLabel}>대표 안전대책</span>
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
