'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import AppModal from '@/components/ui/AppModal';
import WorkerAppHeader from '@/components/worker/WorkerAppHeader';
import WorkerMenuSidebar from '@/components/worker/WorkerMenuSidebar';
import WorkerShellBody from '@/components/worker/WorkerShellBody';
import { WorkerMenuDrawer, WorkerMenuPanel } from '@/components/worker/WorkerMenu';
import {
  getSessionGuidanceDate,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReports } from '@/hooks/useSiteOperationalReports';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import {
  buildInitialBadWorkplaceReport,
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
  getBadWorkplaceSelectableFindings,
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';
import shellStyles from '@/features/site-reports/components/SiteReportsScreen.module.css';
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
  const [menuOpen, setMenuOpen] = useState(false);
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
    logout,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const backHref = currentSite
    ? isAdminView
      ? getAdminSectionHref('headquarters', {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : `/sites/${encodeURIComponent(currentSite.id)}/entry?entry=bad-workplace`
    : isAdminView
      ? getAdminSectionHref('headquarters')
      : '/';
  const backLabel = isAdminView ? '현장 메인' : '현장 메뉴';
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
          <section className={operationalStyles.sectionCard}>신고서 초안을 불러오는 중입니다.</section>
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
            <div className={operationalStyles.emptyState}>현장 또는 신고 대상 정보를 확인하지 못했습니다.</div>
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
                    aria-label="이전 화면으로 돌아가기"
                  >
                    {'<'} {backLabel}
                  </Link>
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{initialDraft.title}</h1>
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <BadWorkplaceReportEditor
                  key={`${initialDraft.id}:${initialDraft.updatedAt}`}
                  currentSite={currentSite}
                  siteSessions={siteSessions}
                  initialDraft={initialDraft}
                  isSaving={isSaving}
                  error={error}
                  onSave={saveBadWorkplaceReport}
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

interface BadWorkplaceReportEditorProps {
  currentSite: InspectionSite;
  siteSessions: InspectionSession[];
  initialDraft: BadWorkplaceReport;
  isSaving: boolean;
  error: string | null;
  onSave: (report: BadWorkplaceReport) => Promise<void>;
}

function BadWorkplaceReportEditor({
  currentSite,
  siteSessions,
  initialDraft,
  isSaving,
  error,
  onSave,
}: BadWorkplaceReportEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

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
        ? `${getSessionGuidanceDate(nextSession) || '-'} 기술지도 보고서를 선택했습니다.`
        : null,
    );
    setSourceModalOpen(false);
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

  return (
    <section className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}>
      <div className={operationalStyles.toolbar}>
        <div>
          <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
            {draft.title}
          </h1>
        </div>
        <div className={operationalStyles.toolbarActions}>
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
      {notice ? <div className={operationalStyles.bannerInfo}>{notice}</div> : null}

      <article className={operationalStyles.reportCard}>
        <div className={operationalStyles.reportCardHeader}>
          <strong className={operationalStyles.reportCardTitle}>기술지도 보고서 선택</strong>
        </div>
        {siteSessions.length > 0 ? (
          <>
            {selectedSession ? (
              <div className={operationalStyles.bannerInfo}>
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>{getSessionTitle(selectedSession)}</strong>
                  <span className={operationalStyles.sourceCardMeta}>
                    지도일 {getSessionGuidanceDate(selectedSession) || '-'} / 작성자 {selectedSession.meta.drafter || '-'} / 지적사항{' '}
                    {countDocument7FindingsForDisplay(selectedSession)}건 / 진행률{' '}
                    {formatSessionProgressRateDisplay(selectedSession)}
                  </span>
                </div>
              </div>
            ) : (
              <p className={operationalStyles.reportCardDescription}>기술지도 보고서를 선택해 주세요.</p>
            )}
            <div className={operationalStyles.reportActions}>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => setSourceModalOpen(true)}
              >
                {selectedSession ? '보고서 바꾸기' : '보고서 선택'}
              </button>
            </div>
          </>
        ) : (
          <div className={operationalStyles.emptyState}>
            등록된 기술지도 보고서가 아직 없습니다.
          </div>
        )}
      </article>

      <BadWorkplaceSourceSessionModal
        open={sourceModalOpen}
        siteSessions={siteSessions}
        selectedSessionId={selectedSession?.id ?? null}
        onClose={() => setSourceModalOpen(false)}
        onSelectSession={handleSourceSessionChange}
      />

      <article className={operationalStyles.reportCard}>
        <div className={operationalStyles.reportCardHeader}>
          <strong className={operationalStyles.reportCardTitle}>2. 가져올 지적사항 선택</strong>
        </div>
        <p className={operationalStyles.reportCardDescription}>
          선택한 보고서에서 신고 초안으로 이어받을 지적사항을 고르세요. 체크를 바꾸면 아래 위반 사항 표도 함께 갱신됩니다.
        </p>

        {selectedSession ? (
          <div className={operationalStyles.bannerInfo}>
            선택한 보고서 {getSessionTitle(selectedSession)} / 작성자 {selectedSession.meta.drafter || '-'}
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
                    법적 근거: {finding.legalReferenceTitle || finding.referenceMaterial2 || finding.referenceMaterial1 || '-'}
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
            선택한 보고서에 가져올 지적사항이 없습니다. 다른 보고서를 선택해 보세요.
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
          <span className={operationalStyles.summaryLabel}>진행률</span>
          <strong className={operationalStyles.summaryValue}>
            {selectedSession ? formatSessionProgressRateDisplay(selectedSession) : draft.progressRate || '-'}
          </strong>
        </article>
        <article className={operationalStyles.summaryCard}>
          <span className={operationalStyles.summaryLabel}>기술지도 실시 횟수</span>
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
          <span className={operationalStyles.fieldLabel}>수신처</span>
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
              <th>유해위험요인</th>
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
                <td colSpan={5}>선택한 지적사항이 없습니다.</td>
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

interface BadWorkplaceSourceSessionModalProps {
  open: boolean;
  siteSessions: InspectionSession[];
  selectedSessionId: string | null;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

function BadWorkplaceSourceSessionModal({
  open,
  siteSessions,
  selectedSessionId,
  onClose,
  onSelectSession,
}: BadWorkplaceSourceSessionModalProps) {
  return (
    <AppModal
      open={open}
      title="기술지도 보고서 선택"
      size="large"
      onClose={onClose}
      actions={
        <button type="button" className="app-button app-button-secondary" onClick={onClose}>
          닫기
        </button>
      }
    >
      <div className={operationalStyles.sourceList}>
        {siteSessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          const findingCount = countDocument7FindingsForDisplay(session);

          return (
            <article
              key={session.id}
              className={`${operationalStyles.sourceCard} ${isSelected ? operationalStyles.sourceCardActive : ''}`}
            >
              <div className={operationalStyles.sourceCardTop}>
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>{getSessionTitle(session)}</strong>
                  <span className={operationalStyles.sourceCardMeta}>
                    지도일 {getSessionGuidanceDate(session) || '-'} / 작성자 {session.meta.drafter || '-'} / 지적사항 {findingCount}건 / 진행률{' '}
                    {formatSessionProgressRateDisplay(session)}
                  </span>
                </div>
              </div>
              <div className={operationalStyles.sourceCardActions}>
                <button
                  type="button"
                  className={`app-button ${isSelected ? 'app-button-primary' : 'app-button-secondary'}`}
                  onClick={() => onSelectSession(session.id)}
                  disabled={isSelected}
                >
                  {isSelected ? '선택됨' : '이 보고서를 기준으로 불러오기'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppModal>
  );
}

