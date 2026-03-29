'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  fetchBadWorkplaceWordDocument,
  saveBlobAsFile,
} from '@/lib/api';
import {
  buildBadWorkplaceViolations,
  buildInitialBadWorkplaceReport,
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

export default function BadWorkplaceReportPage({ params }: BadWorkplaceReportPageProps) {
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
    [decodedSiteKey, sites]
  );
  const siteSessions = useMemo(
    () =>
      [...sessions]
        .filter((session) => session.siteKey === decodedSiteKey)
        .sort((left, right) => right.meta.reportDate.localeCompare(left.meta.reportDate)),
    [decodedSiteKey, sessions]
  );
  const { badWorkplaceReports, isSaving, error, saveBadWorkplaceReport } =
    useSiteOperationalReports(currentSite);
  const existing = useMemo(
    () =>
      badWorkplaceReports.find(
        (item) =>
          item.reportMonth === decodedReportMonth &&
          item.reporterUserId === currentUser?.id
      ) || null,
    [badWorkplaceReports, currentUser?.id, decodedReportMonth]
  );
  const initialDraft = useMemo(() => {
    if (!currentSite) return null;
    return buildInitialBadWorkplaceReport(
      currentSite,
      siteSessions,
      currentUser,
      decodedReportMonth,
      existing
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
        description="신고서를 저장하려면 다시 로그인해 주세요."
      />
    );
  }

  if (!currentSite || !initialDraft) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            <div className={operationalStyles.emptyState}>
              현장 또는 신고서 정보를 확인하지 못했습니다.
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
    () =>
      siteSessions.find((session) => session.id === draft.sourceSessionId) ||
      siteSessions[0] ||
      null,
    [draft.sourceSessionId, siteSessions]
  );
  const availableFindings =
    selectedSession?.document7Findings.filter(
      (item) =>
        item.location ||
        item.emphasis ||
        item.improvementPlan ||
        item.legalReferenceTitle ||
        item.referenceMaterial1
    ) || [];

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession = siteSessions.find((session) => session.id === sessionId) || null;
    const nextViolations = buildBadWorkplaceViolations(nextSession);
    setDraft((current) => ({
      ...current,
      sourceSessionId: sessionId,
      sourceFindingIds: nextViolations.map((item) => item.sourceFindingId),
      progressRate: nextSession?.document2Overview.progressRate || '',
      implementationCount:
        nextSession?.document2Overview.visitCount || current.implementationCount,
      violations: nextViolations,
    }));
  };

  const handleToggleFinding = (findingId: string, checked: boolean) => {
    setDraft((current) => {
      const nextIds = checked
        ? [...current.sourceFindingIds, findingId]
        : current.sourceFindingIds.filter((item) => item !== findingId);
      const nextViolations = buildBadWorkplaceViolations(selectedSession, nextIds);

      return {
        ...current,
        sourceFindingIds: nextIds,
        violations: nextViolations,
      };
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
            {formatReportMonthLabel(reportMonth)} 기준 불량사업장 신고 실적을 관리하는 문서입니다.
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
          <span className={operationalStyles.summaryLabel}>현장명</span>
          <strong className={operationalStyles.summaryValue}>{currentSite.siteName}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>작성자</span>
          <strong className={operationalStyles.summaryValue}>{draft.reporterName || '-'}</strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>공정율</span>
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
          <span className={operationalStyles.fieldLabel}>원본 기술지도 보고서</span>
          <select
            className="app-select"
            value={draft.sourceSessionId}
            onChange={(event) => handleSourceSessionChange(event.target.value)}
          >
            {siteSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.meta.reportDate || '-'} / {session.meta.drafter || '-'}
              </option>
            ))}
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

      <article className={operationalStyles.summaryCard}>
        <span className={operationalStyles.summaryLabel}>가져올 지적사항 선택</span>
        {availableFindings.length > 0 ? (
          <div className={operationalStyles.checkboxList}>
            {availableFindings.map((finding) => (
              <label key={finding.id} className={operationalStyles.checkboxCard}>
                <input
                  type="checkbox"
                  className="app-checkbox"
                  checked={draft.sourceFindingIds.includes(finding.id)}
                  onChange={(event) =>
                    handleToggleFinding(finding.id, event.target.checked)
                  }
                />
                <span className={operationalStyles.checkboxText}>
                  <strong>{finding.location || finding.emphasis || '지적사항'}</strong>
                  <span className={operationalStyles.muted}>
                    {finding.improvementPlan || finding.legalReferenceTitle || '-'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className={operationalStyles.emptyState}>
            선택한 기술지도 보고서에서 가져올 지적사항이 없습니다.
          </div>
        )}
      </article>

      <div className={operationalStyles.tableWrap}>
        <table className={operationalStyles.table}>
          <thead>
            <tr>
              <th>관련 법규</th>
              <th>유해·위험요인</th>
              <th>개선지도 사항</th>
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
                              : violation
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
                              : violation
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
                              : violation
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
                              : violation
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
                              : violation
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
