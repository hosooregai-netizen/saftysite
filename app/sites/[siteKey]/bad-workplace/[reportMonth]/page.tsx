'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import { AdminMenuDrawer, AdminMenuPanel } from '@/components/admin/AdminMenu';
import LoginPanel from '@/components/auth/LoginPanel';
import { PageBackControl } from '@/components/navigation/PageBackControl';
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
import { fetchBadWorkplaceHwpxDocument, saveBlobAsFile } from '@/lib/api';
import {
  BAD_WORKPLACE_NOTICE_SUBTITLE,
  BAD_WORKPLACE_NOTICE_TITLE,
  buildInitialBadWorkplaceReport,
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
  getBadWorkplaceFollowUpForFinding,
  getBadWorkplaceSelectableFindings,
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';
import { buildSitePhotoAlbumHref } from '@/features/home/lib/siteEntry';
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
  const photoAlbumHref = currentSite
    ? buildSitePhotoAlbumHref(currentSite.id, {
        backHref: `/sites/${encodeURIComponent(currentSite.id)}/bad-workplace/${encodeURIComponent(decodedReportMonth)}`,
        backLabel: '불량사업장 신고로 돌아가기',
        reportTitle: initialDraft?.title || '',
      })
    : null;

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
            brandHref={isAdminView ? '/admin' : '/'}
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
                  <PageBackControl
                    href={backHref}
                    label={backLabel}
                    ariaLabel="이전 화면으로 돌아가기"
                  />
                  <div className={shellStyles.heroMain}>
                    <h1 className={shellStyles.heroTitle}>{initialDraft.title}</h1>
                    {photoAlbumHref ? (
                      <Link href={photoAlbumHref} className="app-button app-button-secondary">
                        사진첩 열기
                      </Link>
                    ) : null}
                  </div>
                </div>
              </header>

              <div className={shellStyles.pageGrid}>
                <BadWorkplaceReportEditor
                  key={`${initialDraft.id}:${initialDraft.updatedAt}`}
                  site={currentSite}
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
  site: InspectionSite;
  siteSessions: InspectionSession[];
  initialDraft: BadWorkplaceReport;
  isSaving: boolean;
  error: string | null;
  onSave: (report: BadWorkplaceReport) => Promise<void>;
}

function getReportStatusLabel(status: BadWorkplaceReport['status']) {
  return status === 'completed' ? '완료' : '작성 중';
}

function BadWorkplaceReportEditor({
  site,
  siteSessions,
  initialDraft,
  isSaving,
  error,
  onSave,
}: BadWorkplaceReportEditorProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  const selectedSession = useMemo(
    () => siteSessions.find((session) => session.id === draft.sourceSessionId) || siteSessions[0] || null,
    [draft.sourceSessionId, siteSessions],
  );
  const availableFindings = useMemo(
    () => getBadWorkplaceSelectableFindings(selectedSession),
    [selectedSession],
  );
  const findingFollowUpNotes = useMemo(
    () =>
      new Map(
        availableFindings.map((finding) => {
          const followUp = getBadWorkplaceFollowUpForFinding(selectedSession, finding.id);
          return [
            finding.id,
            followUp
              ? `후속조치: ${followUp.result.trim() || '결과 미입력'} / 확인일 ${followUp.confirmationDate.trim() || '-'}`
              : '후속조치: 확인 내역 없음',
          ];
        }),
      ),
    [availableFindings, selectedSession],
  );
  const confirmationDates = useMemo(
    () =>
      [...new Set(draft.violations.map((item) => item.confirmationDate.trim()).filter(Boolean))],
    [draft.violations],
  );
  const reviewMessages = useMemo(
    () =>
      [
        confirmationDates.length > 1
          ? "선택한 항목의 확인일이 서로 달라 상단 '이행 확인일'은 직접 검토해야 합니다."
          : null,
        draft.assigneeContact.trim()
          ? null
          : '담당 요원 연락처는 자동 근거가 없어 비워 두었습니다. 원본 작성자 연락처를 확인해 입력해 주세요.',
      ].filter(Boolean),
    [confirmationDates.length, draft.assigneeContact],
  );

  const updateSiteSnapshot = (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      receiverName: key === 'siteManagerName' ? value : current.receiverName,
      siteSnapshot: {
        ...current.siteSnapshot,
        [key]: value,
      },
    }));
  };

  const updateViolation = (
    violationId: string,
    patch: Partial<BadWorkplaceReport['violations'][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      violations: current.violations.map((violation) =>
        violation.id === violationId ? { ...violation, ...patch } : violation,
      ),
    }));
  };

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession = siteSessions.find((session) => session.id === sessionId) || null;
    setDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
    setNotice(
      nextSession
        ? `${getSessionGuidanceDate(nextSession) || '-'} 기술지도 보고서를 원본으로 선택했습니다.`
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

  const handleDownloadHwpx = async () => {
    try {
      setDocumentError(null);
      setNotice(null);
      setIsGeneratingHwpx(true);
      const { blob, filename } = await fetchBadWorkplaceHwpxDocument(draft, site);
      saveBlobAsFile(blob, filename);
      setNotice('불량사업장 신고서 HWPX를 다운로드했습니다.');
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error
          ? nextError.message
          : '문서를 다운로드하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  return (
    <section className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}>
      <div className={operationalStyles.toolbar}>
        <div>
          <h1 className={operationalStyles.sectionTitle} style={{ marginTop: 14 }}>
            {draft.title}
          </h1>
          <p className={operationalStyles.sectionDescription}>
            실제 통보서 순서대로 현장·본사·통보 정보를 정리합니다. 자동으로 채워지는 값과 직접 검토해야 하는 값을 구분해 문서형으로 맞춥니다.
          </p>
        </div>
        <div className={operationalStyles.toolbarActions}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void handleDownloadHwpx()}
            disabled={isGeneratingHwpx}
          >
            {isGeneratingHwpx ? 'HWPX 생성 중...' : '문서 다운로드 (.hwpx)'}
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
        <SectionHeader
          title="1. 원본 기술지도 보고서 선택"
          chips={[getReportStatusLabel(draft.status)]}
          description="불량사업장 신고 초안의 기준이 되는 기술지도 보고서를 먼저 고릅니다. 선택한 보고서의 지적사항을 다음 단계에서 문서 표로 이어받습니다."
        />

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
                {selectedSession ? '원본 보고서 바꾸기' : '원본 보고서 선택'}
              </button>
            </div>
          </>
        ) : (
          <div className={operationalStyles.emptyState}>
            원본으로 사용할 기술지도 보고서가 아직 없습니다.
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
        <SectionHeader
          title="2. 취약 사항으로 가져올 지적사항 선택"
          description="선택한 보고서의 지적사항 중 이번 통보서 표에 반영할 항목만 고르세요. 후속조치 결과와 확인일을 함께 보고 문서에 들어갈 항목만 남기면 아래 표가 즉시 다시 구성됩니다."
        />

        {selectedSession ? (
          <div className={operationalStyles.bannerInfo}>
            선택한 원본 보고서: {getSessionTitle(selectedSession)} / 작성자 {selectedSession.meta.drafter || '-'}
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
                  <strong>
                    {finding.location ||
                      finding.hazardDescription ||
                      finding.emphasis ||
                      '지적사항'}
                  </strong>
                  <span className={operationalStyles.muted}>
                    관련 법규: {finding.legalReferenceTitle || finding.referenceMaterial2 || finding.referenceMaterial1 || '-'}
                  </span>
                  <span className={operationalStyles.muted}>
                    개선지도 사항: {finding.improvementRequest || finding.improvementPlan || '-'}
                  </span>
                  <span className={operationalStyles.muted}>
                    {findingFollowUpNotes.get(finding.id) || '후속조치: 확인 내역 없음'}
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

      <article className={operationalStyles.reportCard}>
        <SectionHeader
          title="3. 통보서 기본 정보"
          description="아래 입력 순서는 실제 HWP 통보서 상단 구조를 그대로 따릅니다. 자동 반영값과 수동 확인값을 구분해 문서 상단 메타데이터를 정리합니다."
        />

        <div className={operationalStyles.documentHeading}>
          <strong className={operationalStyles.documentTitle}>{BAD_WORKPLACE_NOTICE_TITLE}</strong>
          <span className={operationalStyles.documentSubtitle}>{BAD_WORKPLACE_NOTICE_SUBTITLE}</span>
        </div>

        <div className={operationalStyles.reviewGrid}>
          <section className={operationalStyles.reviewCard}>
            <div className={operationalStyles.reviewCardHeader}>
              <strong className={operationalStyles.reviewCardTitle}>자동 반영</strong>
              <span
                className={`${operationalStyles.reviewBadge} ${operationalStyles.reviewBadgeAuto}`}
              >
                자동
              </span>
            </div>
            <div className={operationalStyles.reviewCardItems}>
              <span>현장·본사 마스터 정보</span>
              <span>개선 지도일, 첨부서류</span>
              <span>취약 사항 표의 법규·위험요인·개선지도 내용</span>
            </div>
          </section>

          <section className={operationalStyles.reviewCard}>
            <div className={operationalStyles.reviewCardHeader}>
              <strong className={operationalStyles.reviewCardTitle}>검토 후 유지</strong>
              <span
                className={`${operationalStyles.reviewBadge} ${operationalStyles.reviewBadgeReview}`}
              >
                검토
              </span>
            </div>
            <div className={operationalStyles.reviewCardItems}>
              <span>공정률은 원본 값이 비면 계산 진행률로 채웁니다.</span>
              <span>담당 요원은 원본 기술지도 보고서 작성자를 우선 사용합니다.</span>
              <span>이행 확인일은 행별 확인일이 하나로 맞을 때만 상단에 반영합니다.</span>
            </div>
          </section>

          <section className={operationalStyles.reviewCard}>
            <div className={operationalStyles.reviewCardHeader}>
              <strong className={operationalStyles.reviewCardTitle}>수동 입력</strong>
              <span
                className={`${operationalStyles.reviewBadge} ${operationalStyles.reviewBadgeManual}`}
              >
                수동
              </span>
            </div>
            <div className={operationalStyles.reviewCardItems}>
              <span>담당 요원 연락처는 작성자 연락처를 확정할 수 없으면 직접 입력합니다.</span>
              <span>대표자</span>
              <span>지방노동청(지청)장</span>
            </div>
          </section>
        </div>

        {reviewMessages.length > 0 ? (
          <div className={operationalStyles.bannerInfo}>{reviewMessages.join(' ')}</div>
        ) : null}

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
                      onChange={(value) => updateSiteSnapshot('siteName', value)}
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      사업장개시번호
                    </th>
                    <SnapshotInputCell
                      label="사업장개시번호"
                      value={draft.siteSnapshot.businessStartNumber}
                      onChange={(value) => updateSiteSnapshot('businessStartNumber', value)}
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      공사기간
                    </th>
                    <SnapshotInputCell
                      label="공사기간"
                      value={draft.siteSnapshot.constructionPeriod}
                      onChange={(value) => updateSiteSnapshot('constructionPeriod', value)}
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      공정률
                    </th>
                    <SnapshotInputCell
                      label="공정률"
                      value={draft.progressRate}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, progressRate: value }))
                      }
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      공사금액
                    </th>
                    <SnapshotInputCell
                      label="공사금액"
                      value={draft.siteSnapshot.constructionAmount}
                      onChange={(value) => updateSiteSnapshot('constructionAmount', value)}
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      책임자(연락처)
                    </th>
                    <SnapshotDualInputCell
                      labels={['책임자', '연락처']}
                      values={[draft.siteSnapshot.siteManagerName, draft.siteSnapshot.siteManagerPhone]}
                      onChange={[
                        (value) => updateSiteSnapshot('siteManagerName', value),
                        (value) => updateSiteSnapshot('siteManagerPhone', value),
                      ]}
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      주소
                    </th>
                    <SnapshotInputCell
                      label="현장 주소"
                      value={draft.siteSnapshot.siteAddress}
                      onChange={(value) => updateSiteSnapshot('siteAddress', value)}
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
                      onChange={(value) => updateSiteSnapshot('companyName', value)}
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      면허번호
                    </th>
                    <SnapshotInputCell
                      label="면허번호"
                      value={draft.siteSnapshot.licenseNumber}
                      onChange={(value) => updateSiteSnapshot('licenseNumber', value)}
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      사업자등록번호
                    </th>
                    <SnapshotInputCell
                      label="사업자등록번호"
                      value={draft.siteSnapshot.businessRegistrationNumber}
                      onChange={(value) => updateSiteSnapshot('businessRegistrationNumber', value)}
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      사업장관리번호
                    </th>
                    <SnapshotInputCell
                      label="사업장관리번호"
                      value={draft.siteSnapshot.siteManagementNumber}
                      onChange={(value) => updateSiteSnapshot('siteManagementNumber', value)}
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      주소
                    </th>
                    <SnapshotInputCell
                      label="본사 주소"
                      value={draft.siteSnapshot.headquartersAddress}
                      onChange={(value) => updateSiteSnapshot('headquartersAddress', value)}
                      colSpan={3}
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className={operationalStyles.snapshotPanel}>
            <h3 className={operationalStyles.snapshotPanelTitle}>통보 정보</h3>
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
                      개선 지도일
                    </th>
                    <SnapshotInputCell
                      label="개선 지도일"
                      value={draft.guidanceDate}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, guidanceDate: value }))
                      }
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      이행 확인일
                    </th>
                    <SnapshotInputCell
                      label="이행 확인일"
                      value={draft.confirmationDate}
                      placeholder={
                        confirmationDates.length > 1
                          ? '행별 확인일을 보고 직접 입력'
                          : '행별 확인일이 하나면 자동 반영'
                      }
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, confirmationDate: value }))
                      }
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      담당 요원
                    </th>
                    <SnapshotInputCell
                      label="담당 요원"
                      value={draft.reporterName}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, reporterName: value }))
                      }
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      연락처
                    </th>
                    <SnapshotInputCell
                      label="담당 요원 연락처"
                      value={draft.assigneeContact}
                      placeholder="원본 작성자 연락처를 확인해 입력"
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, assigneeContact: value }))
                      }
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      통보일
                    </th>
                    <SnapshotInputCell
                      label="통보일"
                      value={draft.notificationDate}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, notificationDate: value }))
                      }
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      지방노동청(지청)장
                    </th>
                    <SnapshotInputCell
                      label="지방노동청(지청)장"
                      value={draft.recipientOfficeName}
                      placeholder="관할 지방노동청(지청)장을 입력"
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, recipientOfficeName: value }))
                      }
                    />
                  </tr>
                  <tr>
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      대표자
                    </th>
                    <SnapshotInputCell
                      label="대표자"
                      value={draft.agencyRepresentative}
                      placeholder="기관 대표자명을 입력"
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, agencyRepresentative: value }))
                      }
                    />
                    <th scope="row" className={operationalStyles.snapshotLabelCell}>
                      첨부서류
                    </th>
                    <SnapshotInputCell
                      label="첨부서류"
                      value={draft.attachmentDescription}
                      onChange={(value) =>
                        setDraft((current) => ({ ...current, attachmentDescription: value }))
                      }
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className={operationalStyles.bannerInfo}>
          「산업안전보건법」 제73조제2항 및 같은 법 시행령 제60조에 따른 확인 결과를 붙임과 같이 송부합니다.
        </div>
      </article>

      <article className={operationalStyles.reportCard}>
        <SectionHeader
          title="4. 기술지도 미이행 등 사망사고 고위험 취약 사항"
          description="실제 첨부 표와 동일하게 관련 법규, 유해·위험요인, 개선지도 사항(지도일), 불이행 사항(확인일) 4열로 정리합니다. 후속조치 확인 결과가 있으면 확인일과 불이행 문구를 우선 반영합니다."
        />

        <div className={operationalStyles.tableWrap}>
          <table className={operationalStyles.table}>
            <thead>
              <tr>
                <th>관련 법규</th>
                <th>유해·위험요인</th>
                <th>개선지도 사항(지도일)</th>
                <th>불이행 사항(확인일)</th>
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
                          updateViolation(item.id, { legalReference: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className="app-textarea"
                        value={item.hazardFactor}
                        onChange={(event) =>
                          updateViolation(item.id, { hazardFactor: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div className={operationalStyles.tableCellStack}>
                        <textarea
                          className="app-textarea"
                          value={item.improvementMeasure}
                          onChange={(event) =>
                            updateViolation(item.id, { improvementMeasure: event.target.value })
                          }
                        />
                        <label className={operationalStyles.tableDateField}>
                          <span className={operationalStyles.tableDateLabel}>지도일</span>
                          <input
                            className={`app-input ${operationalStyles.tableDateInput}`}
                            value={item.guidanceDate}
                            onChange={(event) =>
                              updateViolation(item.id, { guidanceDate: event.target.value })
                            }
                          />
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className={operationalStyles.tableCellStack}>
                        <textarea
                          className="app-textarea"
                          value={item.nonCompliance}
                          onChange={(event) =>
                            updateViolation(item.id, { nonCompliance: event.target.value })
                          }
                        />
                        <label className={operationalStyles.tableDateField}>
                          <span className={operationalStyles.tableDateLabel}>확인일</span>
                          <input
                            className={`app-input ${operationalStyles.tableDateInput}`}
                            value={item.confirmationDate}
                            onChange={(event) =>
                              updateViolation(item.id, { confirmationDate: event.target.value })
                            }
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>선택한 지적사항이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className={operationalStyles.reportCard}>
        <SectionHeader
          title="5. 증빙자료 메모"
          description="문서 하단의 붙임 증빙자료를 준비할 때 참고할 내부 메모가 있으면 남겨 두세요."
        />
        <label className={`${operationalStyles.field} ${operationalStyles.fieldWide}`}>
          <span className={operationalStyles.fieldLabel}>증빙자료 메모</span>
          <textarea
            className="app-textarea"
            value={draft.note}
            onChange={(event) =>
              setDraft((current) => ({ ...current, note: event.target.value }))
            }
          />
        </label>
      </article>
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

function SnapshotInputCell(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colSpan?: number;
  placeholder?: string;
}) {
  return (
    <td className={operationalStyles.snapshotValueCell} colSpan={props.colSpan}>
      <input
        aria-label={props.label}
        className={`app-input ${operationalStyles.snapshotControl}`}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </td>
  );
}

function SnapshotDualInputCell(props: {
  labels: [string, string];
  values: [string, string];
  onChange: [(value: string) => void, (value: string) => void];
}) {
  return (
    <td className={operationalStyles.snapshotValueCell}>
      <div className={operationalStyles.snapshotDualInput}>
        <input
          aria-label={props.labels[0]}
          className={`app-input ${operationalStyles.snapshotControl}`}
          value={props.values[0]}
          onChange={(event) => props.onChange[0](event.target.value)}
        />
        <input
          aria-label={props.labels[1]}
          className={`app-input ${operationalStyles.snapshotControl}`}
          value={props.values[1]}
          onChange={(event) => props.onChange[1](event.target.value)}
        />
      </div>
    </td>
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
