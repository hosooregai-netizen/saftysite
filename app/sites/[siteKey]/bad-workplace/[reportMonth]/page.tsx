"use client";

import { use, useEffect, useMemo, useState } from "react";
import { AdminMenuDrawer, AdminMenuPanel } from "@/components/admin/AdminMenu";
import LoginPanel from "@/components/auth/LoginPanel";
import { PageBackControl } from "@/components/navigation/PageBackControl";
import operationalStyles from "@/components/site/OperationalReports.module.css";
import AppModal from "@/components/ui/AppModal";
import WorkerAppHeader from "@/components/worker/WorkerAppHeader";
import WorkerMenuSidebar from "@/components/worker/WorkerMenuSidebar";
import WorkerShellBody from "@/components/worker/WorkerShellBody";
import {
  WorkerMenuDrawer,
  WorkerMenuPanel,
} from "@/components/worker/WorkerMenu";
import {
  getSessionGuidanceDate,
  getSessionTitle,
} from "@/constants/inspectionSession";
import { createTimestamp } from "@/constants/inspectionSession/shared";
import { useInspectionSessions } from "@/hooks/useInspectionSessions";
import { useSiteOperationalReportMutations } from "@/hooks/useSiteOperationalReportMutations";
import { getAdminSectionHref, isAdminUserRole } from "@/lib/admin";
import {
  fetchBadWorkplaceHwpxDocumentByReportKey,
  saveBlobAsFile,
} from "@/lib/api";
import {
  BAD_WORKPLACE_NOTICE_TITLE,
  buildInitialBadWorkplaceReport,
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from "@/lib/erpReports/badWorkplace";
import { mapSafetyReportToBadWorkplaceReport } from "@/lib/erpReports/mappers";
import { buildBadWorkplaceReportKey } from "@/lib/erpReports/shared";
import shellStyles from "@/features/site-reports/components/SiteReportsScreen.module.css";
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from "@/lib/safetyApi";
import type { BadWorkplaceReport } from "@/types/erpReports";
import type {
  InspectionSession,
  InspectionSite,
} from "@/types/inspectionSession";

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
      ? getAdminSectionHref("headquarters", {
          headquarterId: currentSite.headquarterId,
          siteId: currentSite.id,
        })
      : `/sites/${encodeURIComponent(currentSite.id)}/entry?entry=bad-workplace`
    : isAdminView
      ? getAdminSectionHref("headquarters")
      : "/";
  const backLabel = isAdminView ? "현장 메인" : "현장 메뉴";
  const siteSessions = useMemo(
    () =>
      getBadWorkplaceSourceSessions(
        sessions.filter((session) => session.siteKey === decodedSiteKey),
      ),
    [decodedSiteKey, sessions],
  );
  const { isSaving, error, saveBadWorkplaceReport } =
    useSiteOperationalReportMutations(currentSite);
  const [existingReport, setExistingReport] =
    useState<BadWorkplaceReport | null>(null);
  const [existingReportLoading, setExistingReportLoading] = useState(false);
  const [existingReportError, setExistingReportError] = useState<string | null>(
    null,
  );
  const reportKey =
    currentSite && currentUser?.id
      ? buildBadWorkplaceReportKey(
          currentSite.id,
          decodedReportMonth,
          currentUser.id,
        )
      : "";

  useEffect(() => {
    let cancelled = false;

    if (
      !isReady ||
      !isAuthenticated ||
      !currentSite ||
      !currentUser?.id ||
      !reportKey
    ) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError(null);
      });

      return () => {
        cancelled = true;
      };
    }

    const token = readSafetyAuthToken();
    if (!token) {
      queueMicrotask(() => {
        if (cancelled) {
          return;
        }

        setExistingReport(null);
        setExistingReportLoading(false);
        setExistingReportError(
          "로그인이 만료되었습니다. 다시 로그인해 주세요.",
        );
      });

      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setExistingReportLoading(true);
      setExistingReportError(null);
    });

    void fetchSafetyReportByKey(token, reportKey)
      .then((report) => {
        if (cancelled) {
          return;
        }

        const mappedReport = mapSafetyReportToBadWorkplaceReport(report);
        setExistingReport(
          mappedReport && mappedReport.siteId === currentSite.id
            ? mappedReport
            : null,
        );
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        if (nextError instanceof SafetyApiError && nextError.status === 404) {
          setExistingReport(null);
          setExistingReportError(null);
          return;
        }

        setExistingReport(null);
        setExistingReportError(
          nextError instanceof Error
            ? nextError.message
            : "불량사업장 신고서를 불러오는 중 오류가 발생했습니다.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setExistingReportLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentSite, currentUser?.id, isAuthenticated, isReady, reportKey]);
  const initialDraft = useMemo(() => {
    if (!currentSite || existingReportLoading || existingReportError)
      return null;
    return buildInitialBadWorkplaceReport(
      currentSite,
      siteSessions,
      currentUser,
      decodedReportMonth,
      existingReport,
    );
  }, [
    currentSite,
    currentUser,
    decodedReportMonth,
    existingReport,
    existingReportError,
    existingReportLoading,
    siteSessions,
  ]);

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
      />
    );
  }

  if (existingReportLoading) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            불량사업장 신고서를 불러오는 중입니다.
          </section>
        </div>
      </main>
    );
  }

  if (existingReportError) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className={operationalStyles.sectionCard}>
            {existingReportError}
          </section>
        </div>
      </main>
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
        <section className={`app-shell ${shellStyles.shell}`}>
          <WorkerAppHeader
            brandHref={isAdminView ? "/admin" : "/"}
            currentUserName={currentUser?.name}
            onLogout={logout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          <WorkerShellBody>
            <WorkerMenuSidebar>
              {isAdminView ? (
                <AdminMenuPanel
                  activeSection="headquarters"
                  currentSiteKey={currentSite.id}
                />
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
                    <h1 className={shellStyles.heroTitle}>
                      {initialDraft.title}
                    </h1>
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

function BadWorkplaceReportEditor({
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
    () =>
      siteSessions.find((session) => session.id === draft.sourceSessionId) ||
      siteSessions[0] ||
      null,
    [draft.sourceSessionId, siteSessions],
  );

  const updateSiteSnapshot = (
    key: keyof BadWorkplaceReport["siteSnapshot"],
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      receiverName: key === "siteManagerName" ? value : current.receiverName,
      siteSnapshot: {
        ...current.siteSnapshot,
        [key]: value,
      },
    }));
  };

  const updateViolation = (
    violationId: string,
    patch: Partial<BadWorkplaceReport["violations"][number]>,
  ) => {
    setDraft((current) => ({
      ...current,
      violations: current.violations.map((violation) =>
        violation.id === violationId ? { ...violation, ...patch } : violation,
      ),
    }));
  };

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession =
      siteSessions.find((session) => session.id === sessionId) || null;
    setDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
    setNotice(
      nextSession
        ? `${getSessionGuidanceDate(nextSession) || "-"} 기술지도 보고서를 원본으로 선택했습니다.`
        : null,
    );
    setSourceModalOpen(false);
  };

  const handleSourceModeChange = (sourceMode: BadWorkplaceReport["sourceMode"]) => {
    setDraft((current) =>
      syncBadWorkplaceReportSource(
        {
          ...current,
          sourceMode,
        },
        selectedSession,
        current.sourceFindingIds,
      ),
    );
    setNotice(
      sourceMode === "current_new_hazard"
        ? "당회차 신규 위험 기준으로 신고 초안을 전환했습니다."
        : "이전 지적사항 미이행 기준으로 신고 초안을 전환했습니다.",
    );
  };

  const handleSave = async () => {
    const nextDraft = { ...draft, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);
    setNotice("불량사업장 신고서를 저장했습니다.");
  };

  const persistDraftForDocumentExport = async () => {
    const authToken = readSafetyAuthToken();
    if (authToken == null || authToken.trim().length === 0) {
      throw new Error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
    }

    const nextDraft = { ...draft, updatedAt: createTimestamp() };
    setDraft(nextDraft);
    await onSave(nextDraft);

    return {
      authToken,
      reportKey: nextDraft.id,
    };
  };

  const handleDownloadHwpx = async () => {
    try {
      setDocumentError(null);
      setNotice(null);
      setIsGeneratingHwpx(true);
      const { authToken, reportKey } = await persistDraftForDocumentExport();
      const { blob, filename } = await fetchBadWorkplaceHwpxDocumentByReportKey(
        reportKey,
        authToken,
      );
      saveBlobAsFile(blob, filename);
      setNotice("불량사업장 신고서 HWPX를 다운로드했습니다.");
    } catch (nextError) {
      setDocumentError(
        nextError instanceof Error
          ? nextError.message
          : "문서를 다운로드하는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  return (
    <section
      className={`${operationalStyles.sectionCard} ${operationalStyles.editorShell}`}
    >
      <div className={operationalStyles.toolbar}>
        <div className={operationalStyles.toolbarHeading}>
          <div>
            <h1 className={operationalStyles.sectionTitle}>{draft.title}</h1>
          </div>
        </div>
        <div className={operationalStyles.toolbarActions}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={() => void handleDownloadHwpx()}
            disabled={isGeneratingHwpx}
          >
            {isGeneratingHwpx ? "HWPX 생성 중..." : "문서 다운로드 (.hwpx)"}
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {error ? (
        <div className={operationalStyles.bannerError}>{error}</div>
      ) : null}
      {documentError ? (
        <div className={operationalStyles.bannerError}>{documentError}</div>
      ) : null}
      {notice ? (
        <div className={operationalStyles.bannerInfo}>{notice}</div>
      ) : null}
      <p className={operationalStyles.reportCardDescription}>
        현재 초안 기준은 {draft.sourceMode === "current_new_hazard" ? "당회차 신규 위험" : "이전 지적사항 미이행"}입니다.
      </p>

      <article className={operationalStyles.reportCard}>
        <div className={operationalStyles.reportCardHeader}>
          <strong className={operationalStyles.reportCardTitle}>
            1. 원본 보고서 선택
          </strong>
          {siteSessions.length > 0 ? (
            <div className={operationalStyles.reportActions}>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={() => setSourceModalOpen(true)}
              >
                보고서 선택
              </button>
            </div>
          ) : null}
        </div>

        {siteSessions.length > 0 ? (
          <>
            {selectedSession ? (
              <div className={operationalStyles.bannerInfo}>
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>
                    {getSessionTitle(selectedSession)}
                  </strong>
                  <span className={operationalStyles.sourceCardMeta}>
                    지도일 {getSessionGuidanceDate(selectedSession) || "-"} /
                    작성자 {selectedSession.meta.drafter || "-"} / 지적사항{" "}
                    {countDocument7FindingsForDisplay(selectedSession)}건 /
                    진행률 {formatSessionProgressRateDisplay(selectedSession)}
                  </span>
                </div>
              </div>
            ) : null}
            <div className={operationalStyles.reportActions}>
              <button
                type="button"
                className={
                  draft.sourceMode === "previous_unresolved"
                    ? "app-button app-button-primary"
                    : "app-button app-button-secondary"
                }
                onClick={() => handleSourceModeChange("previous_unresolved")}
              >
                이전 지적사항 미이행
              </button>
              <button
                type="button"
                className={
                  draft.sourceMode === "current_new_hazard"
                    ? "app-button app-button-primary"
                    : "app-button app-button-secondary"
                }
                onClick={() => handleSourceModeChange("current_new_hazard")}
              >
                당회차 신규 위험
              </button>
            </div>
            <p className={operationalStyles.reportCardDescription}>
              현재 기준: {draft.sourceMode === "current_new_hazard" ? "당회차 신규 위험" : "이전 지적사항 미이행"}
            </p>
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
        <SectionHeader title="2. 통보서 기본 정보" />

        <div className={operationalStyles.documentHeading}>
          <strong className={operationalStyles.documentTitle}>
            {BAD_WORKPLACE_NOTICE_TITLE}
          </strong>
        </div>

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
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      현장명
                    </th>
                    <SnapshotInputCell
                      label="현장명"
                      value={draft.siteSnapshot.siteName}
                      onChange={(value) =>
                        updateSiteSnapshot("siteName", value)
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      사업장개시번호
                    </th>
                    <SnapshotInputCell
                      label="사업장개시번호"
                      value={draft.siteSnapshot.businessStartNumber}
                      onChange={(value) =>
                        updateSiteSnapshot("businessStartNumber", value)
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      공사기간
                    </th>
                    <SnapshotInputCell
                      label="공사기간"
                      value={draft.siteSnapshot.constructionPeriod}
                      onChange={(value) =>
                        updateSiteSnapshot("constructionPeriod", value)
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      공정률
                    </th>
                    <SnapshotInputCell
                      label="공정률"
                      value={draft.progressRate}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          progressRate: value,
                        }))
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      공사금액
                    </th>
                    <SnapshotInputCell
                      label="공사금액"
                      value={draft.siteSnapshot.constructionAmount}
                      onChange={(value) =>
                        updateSiteSnapshot("constructionAmount", value)
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      책임자(연락처)
                    </th>
                    <SnapshotDualInputCell
                      labels={["책임자", "연락처"]}
                      values={[
                        draft.siteSnapshot.siteManagerName,
                        draft.siteSnapshot.siteManagerPhone,
                      ]}
                      onChange={[
                        (value) => updateSiteSnapshot("siteManagerName", value),
                        (value) =>
                          updateSiteSnapshot("siteManagerPhone", value),
                      ]}
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      주소
                    </th>
                    <SnapshotInputCell
                      label="현장 주소"
                      value={draft.siteSnapshot.siteAddress}
                      onChange={(value) =>
                        updateSiteSnapshot("siteAddress", value)
                      }
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
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      회사명
                    </th>
                    <SnapshotInputCell
                      label="회사명"
                      value={draft.siteSnapshot.companyName}
                      onChange={(value) =>
                        updateSiteSnapshot("companyName", value)
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      면허번호
                    </th>
                    <SnapshotInputCell
                      label="면허번호"
                      value={draft.siteSnapshot.licenseNumber}
                      onChange={(value) =>
                        updateSiteSnapshot("licenseNumber", value)
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      사업자등록번호
                    </th>
                    <SnapshotInputCell
                      label="사업자등록번호"
                      value={draft.siteSnapshot.businessRegistrationNumber}
                      onChange={(value) =>
                        updateSiteSnapshot("businessRegistrationNumber", value)
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      사업장관리번호
                    </th>
                    <SnapshotInputCell
                      label="사업장관리번호"
                      value={draft.siteSnapshot.siteManagementNumber}
                      onChange={(value) =>
                        updateSiteSnapshot("siteManagementNumber", value)
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      주소
                    </th>
                    <SnapshotInputCell
                      label="본사 주소"
                      value={draft.siteSnapshot.headquartersAddress}
                      onChange={(value) =>
                        updateSiteSnapshot("headquartersAddress", value)
                      }
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
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      개선 지도일
                    </th>
                    <SnapshotInputCell
                      label="개선 지도일"
                      value={draft.guidanceDate}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          guidanceDate: value,
                        }))
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      이행 확인일
                    </th>
                    <SnapshotInputCell
                      label="이행 확인일"
                      value={draft.confirmationDate}
                      placeholder="오늘 날짜가 기본 입력됩니다"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          confirmationDate: value,
                        }))
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      담당 요원
                    </th>
                    <SnapshotInputCell
                      label="담당 요원"
                      value={draft.reporterName}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          reporterName: value,
                        }))
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      연락처
                    </th>
                    <SnapshotInputCell
                      label="담당 요원 연락처"
                      value={draft.assigneeContact}
                      placeholder="원본 작성자 연락처를 확인해 입력"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          assigneeContact: value,
                        }))
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      통보일
                    </th>
                    <SnapshotInputCell
                      label="통보일"
                      value={draft.notificationDate}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          notificationDate: value,
                        }))
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      지방노동청(지청)장
                    </th>
                    <SnapshotInputCell
                      label="지방노동청(지청)장"
                      value={draft.recipientOfficeName}
                      placeholder="관할 지방노동청(지청)장을 입력"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          recipientOfficeName: value,
                        }))
                      }
                    />
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      대표자
                    </th>
                    <SnapshotInputCell
                      label="대표자"
                      value={draft.agencyRepresentative}
                      placeholder="기관 대표자명을 입력"
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          agencyRepresentative: value,
                        }))
                      }
                    />
                    <th
                      scope="row"
                      className={operationalStyles.snapshotLabelCell}
                    >
                      첨부서류
                    </th>
                    <SnapshotInputCell
                      label="첨부서류"
                      value={draft.attachmentDescription}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          attachmentDescription: value,
                        }))
                      }
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </article>

      <article className={operationalStyles.reportCard}>
        <SectionHeader title="3. 기술지도 미이행 등 사망사고 고위험 취약 사항" />

        <div
          className={`${operationalStyles.tableWrap} ${operationalStyles.violationTableWrap}`}
        >
          <table
            className={`${operationalStyles.table} ${operationalStyles.violationTable}`}
          >
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
                    <td data-label="관련 법규">
                      <textarea
                        className={`app-textarea ${operationalStyles.violationEditor}`}
                        value={item.legalReference}
                        onChange={(event) =>
                          updateViolation(item.id, {
                            legalReference: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td data-label="유해·위험요인">
                      <textarea
                        className={`app-textarea ${operationalStyles.violationEditor}`}
                        value={item.hazardFactor}
                        onChange={(event) =>
                          updateViolation(item.id, {
                            hazardFactor: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td data-label="개선지도 사항">
                      <div className={operationalStyles.tableCellStack}>
                        <textarea
                          className={`app-textarea ${operationalStyles.violationEditor}`}
                          value={item.improvementMeasure}
                          onChange={(event) =>
                            updateViolation(item.id, {
                              improvementMeasure: event.target.value,
                            })
                          }
                        />
                        <label className={operationalStyles.tableDateField}>
                          <span className={operationalStyles.tableDateLabel}>
                            지도일
                          </span>
                          <input
                            className={`app-input ${operationalStyles.tableDateInput} ${operationalStyles.violationEditorInput}`}
                            value={item.guidanceDate}
                            onChange={(event) =>
                              updateViolation(item.id, {
                                guidanceDate: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    </td>
                    <td data-label="불이행 사항">
                      <div className={operationalStyles.tableCellStack}>
                        <textarea
                          className={`app-textarea ${operationalStyles.violationEditor}`}
                          value={item.nonCompliance}
                          onChange={(event) =>
                            updateViolation(item.id, {
                              nonCompliance: event.target.value,
                            })
                          }
                        />
                        <label className={operationalStyles.tableDateField}>
                          <span className={operationalStyles.tableDateLabel}>
                            확인일
                          </span>
                          <input
                            className={`app-input ${operationalStyles.tableDateInput} ${operationalStyles.violationEditorInput}`}
                            value={item.confirmationDate}
                            onChange={(event) =>
                              updateViolation(item.id, {
                                confirmationDate: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className={operationalStyles.violationEmptyRow}>
                  <td colSpan={4}>선택한 지적사항이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function SectionHeader(props: { title: string; chips?: string[] }) {
  return (
    <>
      <div className={operationalStyles.reportCardHeader}>
        <strong className={operationalStyles.reportCardTitle}>
          {props.title}
        </strong>
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
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={onClose}
        >
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
              className={`${operationalStyles.sourceCard} ${isSelected ? operationalStyles.sourceCardActive : ""}`}
            >
              <div className={operationalStyles.sourceCardTop}>
                <div className={operationalStyles.sourceCardBody}>
                  <strong className={operationalStyles.sourceCardTitle}>
                    {getSessionTitle(session)}
                  </strong>
                  <span className={operationalStyles.sourceCardMeta}>
                    지도일 {getSessionGuidanceDate(session) || "-"} / 작성자{" "}
                    {session.meta.drafter || "-"} / 지적사항 {findingCount}건 /
                    진행률 {formatSessionProgressRateDisplay(session)}
                  </span>
                </div>
              </div>
              <div className={operationalStyles.sourceCardActions}>
                <button
                  type="button"
                  className={`app-button ${isSelected ? "app-button-primary" : "app-button-secondary"}`}
                  onClick={() => onSelectSession(session.id)}
                  disabled={isSelected}
                >
                  {isSelected ? "선택됨" : "이 보고서를 기준으로 불러오기"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppModal>
  );
}
