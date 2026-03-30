'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import { getSessionTitle } from '@/constants/inspectionSession';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import { fetchBadWorkplaceWordDocument, saveBlobAsFile } from '@/lib/api';
import {
  buildInitialBadWorkplaceReport,
  getBadWorkplaceSelectableFindings,
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';
import { formatReportMonthLabel } from '@/lib/erpReports/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

interface BadWorkplaceReportPageProps {
  params: Promise<{
    siteKey: string;
    reportMonth: string;
  }>;
}

export default function BadWorkplaceReportPage({
  params,
}: BadWorkplaceReportPageProps) {
  const { siteKey, reportMonth } = use(params);
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedReportMonth = decodeURIComponent(reportMonth);
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
    () =>
      getBadWorkplaceSourceSessions(
        sessions.filter((session) => session.siteKey === decodedSiteKey),
      ),
    [decodedSiteKey, sessions],
  );
  const { badWorkplaceReports, isSaving, error, saveBadWorkplaceReport } =
    useSiteOperationalReports(currentSite);
  const existing = useMemo(
    () =>
      badWorkplaceReports.find(
        (item) =>
          item.reportMonth === decodedReportMonth &&
          item.reporterUserId === currentUser?.id,
      ) || null,
    [badWorkplaceReports, currentUser?.id, decodedReportMonth],
  );
  const initialDraft = useMemo(() => {
    if (!currentSite) return null;
    return buildInitialBadWorkplaceReport(
      currentSite,
      siteSessions,
      currentUser,
      decodedReportMonth,
      existing,
    );
  }, [currentSite, currentUser, decodedReportMonth, existing, siteSessions]);

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            신고서 초안을 불러오는 중입니다.
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
        title="불량사업장 신고 로그인"
        description="신고서를 작성하려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>
              현장 또는 신고 대상 정보를 확인하지 못했습니다.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <div className="app-container">
        <BadWorkplaceReportEditor
          key={`${initialDraft.id}:${initialDraft.updatedAt}`}
          currentSite={currentSite}
          siteSessions={siteSessions}
          reportMonth={decodedReportMonth}
          initialDraft={initialDraft}
          isSaving={isSaving}
          error={error}
          onSave={saveBadWorkplaceReport}
        />
      </div>
    </main>
  );
}

interface BadWorkplaceReportEditorProps {
  currentSite: InspectionSite;
  siteSessions: InspectionSession[];
  reportMonth: string;
  initialDraft: BadWorkplaceReport;
  isSaving: boolean;
  error: string | null;
  onSave: (report: BadWorkplaceReport) => Promise<void>;
}

function BadWorkplaceReportEditor({
  currentSite,
  siteSessions,
  reportMonth,
  initialDraft,
  isSaving,
  error,
  onSave,
}: BadWorkplaceReportEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  const selectedSession = useMemo(
    () => siteSessions.find((session) => session.id === draft.sourceSessionId) || siteSessions[0] || null,
    [draft.sourceSessionId, siteSessions],
  );
  const availableFindings = useMemo(
    () => getBadWorkplaceSelectableFindings(selectedSession),
    [selectedSession],
  );

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession = siteSessions.find((session) => session.id === sessionId) || null;
    setDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
    setNotice(
      nextSession
        ? `${nextSession.meta.reportDate || '-'} 기술지도 보고서를 원본으로 선택했습니다.`
        : null,
    );
  };

  const handleToggleFinding = (findingId: string, checked: boolean) => {
    setDraft((current) => {
      const nextIds = checked
        ? [...current.sourceFindingIds, findingId]
        : current.sourceFindingIds.filter((item) => item !== findingId);

      return syncBadWorkplaceReportSource(current, selectedSession, nextIds);
    });
  };

  const handleSave = async () => {
    const nextDraft = { ...draft, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);
    setNotice('불량사업장 신고서를 저장했습니다.');
  };

  const handleDownloadWord = async () => {
    try {
      setDocumentError(null);
      setIsGeneratingDocument(true);
      const { blob, filename } = await fetchBadWorkplaceWordDocument(draft, currentSite);
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

  return (
    <section className={operationalStyles.sectionCard}>
      <div className={operationalStyles.toolbar}>
        <div>
          <Link
            href={`/sites/${encodeURIComponent(currentSite.id)}/entry?entry=bad-workplace`}
            className={`${operationalStyles.linkButtonSecondary} ${operationalStyles.linkButton}`}
          >
            현장 허브로 돌아가기
          </Link>
          <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
            {draft.title}
          </h1>
          <p className={operationalStyles.sectionDescription}>
            {formatReportMonthLabel(reportMonth)} 기준 불량사업장 신고서를 작성합니다. 최신 기술지도 보고서를 원본으로 자동 선택하며, 필요하면 다른 보고서와 지적사항을 직접 고를 수 있습니다.
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
          <strong className={operationalStyles.reportCardTitle}>1. 원본 기술지도 보고서 선택</strong>
          <div className={operationalStyles.statusRow}>
            <span className="app-chip">후보 보고서 {siteSessions.length}건</span>
            <span className="app-chip">
              선택 {selectedSession ? getSessionTitle(selectedSession) : '없음'}
            </span>
          </div>
        </div>
        <p className={operationalStyles.reportCardDescription}>
          기술지도 보고서를 최신순으로 보여줍니다. 선택한 보고서의 지적사항을 아래 신고 초안으로 이어받습니다.
        </p>

        {siteSessions.length > 0 ? (
          <div className={operationalStyles.sourceList}>
            {siteSessions.map((session) => {
              const isSelected = session.id === selectedSession?.id;
              const findingCount = getBadWorkplaceSelectableFindings(session).length;

              return (
                <article
                  key={session.id}
                  className={`${operationalStyles.sourceCard} ${
                    isSelected ? operationalStyles.sourceCardActive : ''
                  }`}
                >
                  <div className={operationalStyles.sourceCardTop}>
                    <div className={operationalStyles.sourceCardBody}>
                      <strong className={operationalStyles.sourceCardTitle}>
                        {getSessionTitle(session)}
                      </strong>
                      <span className={operationalStyles.sourceCardMeta}>
                        작성일 {session.meta.reportDate || '-'} / 작성자 {session.meta.drafter || '-'} / 지적사항 {findingCount}건 / 진행률 {session.document2Overview.progressRate || '-'}
                      </span>
                    </div>
                    <span className="app-chip">{isSelected ? '선택됨' : '후보'}</span>
                  </div>
                  <div className={operationalStyles.sourceCardActions}>
                    <button
                      type="button"
                      className={`app-button ${
                        isSelected ? 'app-button-primary' : 'app-button-secondary'
                      }`}
                      onClick={() => handleSourceSessionChange(session.id)}
                    >
                      {isSelected ? '현재 원본' : '이 보고서 기준으로 불러오기'}
                    </button>
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
            원본으로 사용할 기술지도 보고서가 아직 없습니다.
          </div>
        )}
      </article>

      <article className={operationalStyles.reportCard}>
        <div className={operationalStyles.reportCardHeader}>
          <strong className={operationalStyles.reportCardTitle}>2. 가져올 지적사항 선택</strong>
          <div className={operationalStyles.statusRow}>
            <span className="app-chip">
              선택 지적사항 {draft.sourceFindingIds.length}건
            </span>
            {selectedSession ? (
              <span className="app-chip">{selectedSession.meta.reportDate || '-'}</span>
            ) : null}
          </div>
        </div>
        <p className={operationalStyles.reportCardDescription}>
          선택한 원본 보고서에서 신고 초안으로 이어받을 지적사항을 고르세요. 체크를 바꾸면 아래 위반 사항 표도 함께 갱신됩니다.
        </p>

        {selectedSession ? (
          <div className={operationalStyles.bannerInfo}>
            원본 보고서: {getSessionTitle(selectedSession)} / 작성자 {selectedSession.meta.drafter || '-'}
          </div>
        ) : null}

        {availableFindings.length > 0 ? (
          <div className={operationalStyles.checkboxList}>
            {availableFindings.map((finding) => (
              <label key={finding.id} className={operationalStyles.checkboxCard}>
                <input
                  type="checkbox"
                  className="app-checkbox"
                  checked={draft.sourceFindingIds.includes(finding.id)}
                  onChange={(event) => handleToggleFinding(finding.id, event.target.checked)}
                />
                <span className={operationalStyles.checkboxText}>
                  <strong>{finding.location || finding.emphasis || '지적사항'}</strong>
                  <span className={operationalStyles.muted}>
                    법적 근거: {finding.legalReferenceTitle || finding.referenceMaterial1 || finding.referenceMaterial2 || '-'}
                  </span>
                  <span className={operationalStyles.muted}>
                    개선 요청: {finding.improvementPlan || '-'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className={operationalStyles.emptyState}>
            선택한 원본 보고서에 가져올 지적사항이 없습니다. 다른 보고서를 선택해 보세요.
          </div>
        )}
      </article>

      <div className={operationalStyles.summaryGrid}>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>현장명</span>
          <strong className={operationalStyles.summaryValue}>{currentSite.siteName}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>작성자</span>
          <strong className={operationalStyles.summaryValue}>{draft.reporterName || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>원본 진행률</span>
          <strong className={operationalStyles.summaryValue}>{draft.progressRate || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>기술지도 횟수</span>
          <strong className={operationalStyles.summaryValue}>{draft.implementationCount || '-'}</strong>
        </article>
      </div>

      <div className={operationalStyles.formGrid}>
        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>작성 상태</span>
          <select
            className="app-select"
            value={draft.status}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                status: event.target.value as BadWorkplaceReport['status'],
              }))
            }
          >
            <option value="draft">작성 중</option>
            <option value="completed">완료</option>
          </select>
        </label>

        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>수신자</span>
          <input
            className="app-input"
            value={draft.receiverName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, receiverName: event.target.value }))
            }
          />
        </label>

        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>공사기간</span>
          <input
            className="app-input"
            value={draft.contractPeriod}
            onChange={(event) =>
              setDraft((current) => ({ ...current, contractPeriod: event.target.value }))
            }
          />
        </label>

        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>지도기관명</span>
          <input
            className="app-input"
            value={draft.agencyName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, agencyName: event.target.value }))
            }
          />
        </label>

        <label className={operationalStyles.field}>
          <span className={operationalStyles.fieldLabel}>대표자</span>
          <input
            className="app-input"
            value={draft.agencyRepresentative}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                agencyRepresentative: event.target.value,
              }))
            }
          />
        </label>

        <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
          <span className={operationalStyles.fieldLabel}>기관 주소</span>
          <input
            className="app-input"
            value={draft.agencyAddress}
            onChange={(event) =>
              setDraft((current) => ({ ...current, agencyAddress: event.target.value }))
            }
          />
        </label>

        <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
          <span className={operationalStyles.fieldLabel}>연락처</span>
          <input
            className="app-input"
            value={draft.agencyContact}
            onChange={(event) =>
              setDraft((current) => ({ ...current, agencyContact: event.target.value }))
            }
          />
        </label>
      </div>

      <div className={operationalStyles.tableWrap}>
        <table className={operationalStyles.table}>
          <thead>
            <tr>
              <th>관련 법칙</th>
              <th>유해·위험요인</th>
              <th>개선지시 사항</th>
              <th>불이행 사항</th>
              <th>확인일</th>
            </tr>
          </thead>
          <tbody>
            {draft.violations.length > 0 ? (
              draft.violations.map((item) => (
                <tr key={item.id}>
                  <td>
                    <textarea
                      className="app-textarea"
                      value={item.legalReference}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          violations: current.violations.map((violation) =>
                            violation.id === item.id
                              ? { ...violation, legalReference: event.target.value }
                              : violation,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      className="app-textarea"
                      value={item.hazardFactor}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          violations: current.violations.map((violation) =>
                            violation.id === item.id
                              ? { ...violation, hazardFactor: event.target.value }
                              : violation,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      className="app-textarea"
                      value={item.improvementMeasure}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          violations: current.violations.map((violation) =>
                            violation.id === item.id
                              ? { ...violation, improvementMeasure: event.target.value }
                              : violation,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      className="app-textarea"
                      value={item.nonCompliance}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          violations: current.violations.map((violation) =>
                            violation.id === item.id
                              ? { ...violation, nonCompliance: event.target.value }
                              : violation,
                          ),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      value={item.confirmationDate}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          violations: current.violations.map((violation) =>
                            violation.id === item.id
                              ? { ...violation, confirmationDate: event.target.value }
                              : violation,
                          ),
                        }))
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>선택된 지적사항이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
        <span className={operationalStyles.fieldLabel}>비고</span>
        <textarea
          className="app-textarea"
          value={draft.note}
          onChange={(event) =>
            setDraft((current) => ({ ...current, note: event.target.value }))
          }
        />
      </label>
    </section>
  );
}
