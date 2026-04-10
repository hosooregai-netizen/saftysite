'use client';

import { useEffect, useMemo, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import AppModal from '@/components/ui/AppModal';
import {
  getSessionGuidanceDate,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { createTimestamp } from '@/constants/inspectionSession/shared';
import {
  buildMobileSiteHomeHref,
  buildSiteBadWorkplaceHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from '@/features/mobile/components/MobileShell';
import { MobileTabBar } from '@/features/mobile/components/MobileTabBar';
import { buildSiteTabs } from '@/features/mobile/lib/buildSiteTabs';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import {
  fetchBadWorkplaceHwpxDocumentByReportKey,
  fetchBadWorkplacePdfDocumentByReportKeyWithFallback,
  saveBlobAsFile,
} from '@/lib/api';
import {
  BAD_WORKPLACE_NOTICE_TITLE,
  buildInitialBadWorkplaceReport,
  countDocument7FindingsForDisplay,
  formatSessionProgressRateDisplay,
  getBadWorkplaceSourceSessions,
  syncBadWorkplaceReportSource,
} from '@/lib/erpReports/badWorkplace';
import { mapSafetyReportToBadWorkplaceReport } from '@/lib/erpReports/mappers';
import {
  buildBadWorkplaceReportKey,
  formatReportMonthLabel,
} from '@/lib/erpReports/shared';
import {
  fetchSafetyReportByKey,
  readSafetyAuthToken,
  SafetyApiError,
} from '@/lib/safetyApi';
import type { BadWorkplaceReport } from '@/types/erpReports';
import type { InspectionSession } from '@/types/inspectionSession';
import styles from './MobileShell.module.css';

interface MobileBadWorkplaceReportScreenProps {
  reportMonth: string;
  siteKey: string;
}

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDateTimeLabel(value: string | null | undefined) {
  if (!value?.trim()) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

function formatMobileReportMonth(reportMonth: string) {
  const matched = reportMonth.match(/^(\d{4})-(\d{2})$/);
  if (!matched) return reportMonth;

  return `${matched[1].slice(-2)}년 ${matched[2]}월`;
}

function getSourceSessionDisplay(session: InspectionSession | null) {
  if (!session) {
    return '-';
  }

  return getSessionTitle(session);
}

function EditableField(props: {
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
  wide?: boolean;
}) {
  return (
    <label
      className={`${styles.mobileEditorFieldGroup} ${
        props.wide ? styles.mobileImplementationFieldWide : ''
      }`}
    >
      <span className={styles.mobileEditorFieldLabel}>{props.label}</span>
      {props.multiline ? (
        <textarea
          className={`app-textarea ${styles.mobileEditorTextareaCompact}`}
          rows={props.rows ?? 3}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(event) => props.onChange(event.target.value)}
        />
      ) : (
        <input
          className="app-input"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(event) => props.onChange(event.target.value)}
        />
      )}
    </label>
  );
}

export function MobileBadWorkplaceReportScreen({
  reportMonth,
  siteKey,
}: MobileBadWorkplaceReportScreenProps) {
  const decodedSiteKey = decodeURIComponent(siteKey);
  const decodedReportMonth = decodeURIComponent(reportMonth);
  const [draft, setDraft] = useState<BadWorkplaceReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentInfoOpen, setDocumentInfoOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const {
    authError,
    currentUser,
    ensureSiteReportsLoaded,
    getSessionsBySiteId,
    isAuthenticated,
    isReady,
    login,
    logout,
    sites,
  } = useInspectionSessions();
  const currentSite = useMemo(
    () => sites.find((site) => site.id === decodedSiteKey) ?? null,
    [decodedSiteKey, sites],
  );
  const siteSessions = useMemo(
    () =>
      currentSite
        ? getBadWorkplaceSourceSessions(getSessionsBySiteId(currentSite.id))
        : [],
    [currentSite, getSessionsBySiteId],
  );
  const reportKey =
    currentSite && currentUser?.id
      ? buildBadWorkplaceReportKey(
          currentSite.id,
          decodedReportMonth,
          currentUser.id,
        )
      : '';
  const {
    error: mutationError,
    isSaving,
    saveBadWorkplaceReport,
  } = useSiteOperationalReportMutations(currentSite);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;

    void ensureSiteReportsLoaded(currentSite.id).catch(() => undefined);
  }, [currentSite, ensureSiteReportsLoaded, isAuthenticated, isReady]);

  useEffect(() => {
    if (!currentSite || !isAuthenticated || !isReady) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);
      const token = readSafetyAuthToken();
      if (!token) {
        setLoadError('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        setIsLoading(false);
        return;
      }

      try {
        let existingReport: BadWorkplaceReport | null = null;

        if (reportKey) {
          try {
            const report = await fetchSafetyReportByKey(token, reportKey);
            const mapped = mapSafetyReportToBadWorkplaceReport(report);
            if (!mapped || mapped.siteId !== currentSite.id) {
              throw new Error('불량사업장 신고서를 찾을 수 없습니다.');
            }
            existingReport = mapped;
          } catch (error) {
            if (!(error instanceof SafetyApiError && error.status === 404)) {
              throw error;
            }
          }
        }

        const nextDraft = buildInitialBadWorkplaceReport(
          currentSite,
          siteSessions,
          currentUser,
          decodedReportMonth,
          existingReport,
        );

        if (!cancelled) {
          setDraft(nextDraft);
          setNotice(
            existingReport ? null : '이번 달 불량사업장 신고 초안을 만들었습니다.',
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            getMessage(error, '불량사업장 신고서를 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentSite,
    currentUser,
    decodedReportMonth,
    isAuthenticated,
    isReady,
    reportKey,
    siteSessions,
  ]);

  const selectedSession = useMemo(
    () =>
      siteSessions.find((session) => session.id === draft?.sourceSessionId) ??
      siteSessions[0] ??
      null,
    [draft?.sourceSessionId, siteSessions],
  );

  const updateDraft = (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => {
    setNotice(null);
    setDocumentError(null);
    setDraft((current) => (current ? updater(current) : current));
  };

  const updateSiteSnapshot = (
    key: keyof BadWorkplaceReport['siteSnapshot'],
    value: string,
  ) => {
    updateDraft((current) => ({
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
    updateDraft((current) => ({
      ...current,
      violations: current.violations.map((violation) =>
        violation.id === violationId ? { ...violation, ...patch } : violation,
      ),
    }));
  };

  const handleSourceSessionChange = (sessionId: string) => {
    const nextSession =
      siteSessions.find((session) => session.id === sessionId) ?? null;
    updateDraft((current) => syncBadWorkplaceReportSource(current, nextSession));
    setNotice(
      nextSession
        ? `${getSessionGuidanceDate(nextSession) || '-'} 기술지도 보고서를 원본으로 반영했습니다.`
        : null,
    );
    setSourceModalOpen(false);
  };

  const handleSave = async () => {
    if (!draft || !currentSite) return null;

    const nextDraft = {
      ...draft,
      updatedAt: createTimestamp(),
    };
    await saveBadWorkplaceReport(nextDraft);
    setDraft(nextDraft);
    setNotice('저장되었습니다.');
    return nextDraft;
  };

  const handleDownloadHwpx = async () => {
    const saved = await handleSave().catch((error) => {
      setDocumentError(getMessage(error, '저장하지 못했습니다.'));
      return null;
    });
    if (!saved) return;

    setIsGeneratingHwpx(true);
    try {
      const result = await fetchBadWorkplaceHwpxDocumentByReportKey(
        saved.id,
        readSafetyAuthToken(),
      );
      saveBlobAsFile(result.blob, result.filename);
      setNotice('한글 문서를 다운로드했습니다.');
    } catch (error) {
      setDocumentError(getMessage(error, '문서를 내려받지 못했습니다.'));
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  const handleDownloadPdf = async () => {
    const saved = await handleSave().catch((error) => {
      setDocumentError(getMessage(error, '저장하지 못했습니다.'));
      return null;
    });
    if (!saved) return;

    setIsGeneratingPdf(true);
    try {
      const result = await fetchBadWorkplacePdfDocumentByReportKeyWithFallback(
        saved.id,
        readSafetyAuthToken(),
      );
      saveBlobAsFile(result.blob, result.filename);
      setNotice(
        result.fallbackToHwpx
          ? `PDF 대신 ${result.filename}을(를) 내려받았습니다.`
          : 'PDF 문서를 다운로드했습니다.',
      );
    } catch (error) {
      setDocumentError(getMessage(error, '문서를 내려받지 못했습니다.'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>
                불량사업장 신고서를 준비하고 있습니다.
              </h1>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="모바일 불량사업장 신고 로그인"
        description="모바일에서 원본 보고서를 선택하고 불량사업장 신고서를 작성할 수 있습니다."
      />
    );
  }

  if (!currentSite || (isLoading && !draft) || !draft) {
    return (
      <main className="app-page">
        <div className={styles.pageShell}>
          <div className={styles.content}>
            <section className={styles.stateCard}>
              <h1 className={styles.sectionTitle}>
                {!currentSite
                  ? '현장을 찾을 수 없습니다.'
                  : isLoading
                    ? '불량사업장 신고서를 불러오는 중입니다.'
                    : '불량사업장 신고서를 열 수 없습니다.'}
              </h1>
              {loadError ? (
                <p className={styles.inlineNotice}>{loadError}</p>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <MobileShell
        backHref={buildMobileSiteHomeHref(currentSite.id)}
        backLabel="현장 메인"
        currentUserName={currentUser?.name}
        fullHeight
        onLogout={logout}
        tabBar={<MobileTabBar tabs={buildSiteTabs(currentSite.id, 'bad-workplace')} />}
        title={draft.title || `${formatReportMonthLabel(decodedReportMonth)} 불량사업장 신고`}
        webHref={buildSiteBadWorkplaceHref(
          currentSite.id,
          draft.reportMonth || decodedReportMonth,
        )}
      >
        <section
          className={`${styles.sectionCard} ${styles.mobileSummarySection}`}
          style={{
            marginBottom: 0,
            borderRadius: '0 0 8px 8px',
            borderBottom: 'none',
            flexShrink: 0,
          }}
        >
          <div className={`${styles.statGrid} ${styles.mobileSummaryGrid}`}>
            <article className={`${styles.statCard} ${styles.mobileSummaryCard}`}>
              <span className={`${styles.statLabel} ${styles.mobileSummaryLabel}`}>신고월</span>
              <strong className={`${styles.statValue} ${styles.mobileSummaryValue}`}>
                {formatMobileReportMonth(draft.reportMonth)}
              </strong>
            </article>
            <div className={styles.mobileSummaryActionStack}>
              <button
                type="button"
                className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
                onClick={() => setDocumentInfoOpen(true)}
              >
                문서정보
              </button>
              <div className={styles.mobileSummaryExportStack}>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
                  disabled={isGeneratingHwpx || isGeneratingPdf}
                  onClick={() => void handleDownloadHwpx()}
                >
                  {isGeneratingHwpx ? '한글...' : '한글'}
                </button>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${styles.mobileSummaryMiniButton}`}
                  disabled={isGeneratingHwpx || isGeneratingPdf}
                  onClick={() => void handleDownloadPdf()}
                >
                  {isGeneratingPdf ? 'PDF...' : 'PDF'}
                </button>
              </div>
            </div>
            <button
              type="button"
              className={`app-button app-button-secondary ${styles.mobileSummaryTallButton}`}
              disabled={isSaving || isGeneratingHwpx || isGeneratingPdf}
              onClick={() =>
                void handleSave().catch((error) =>
                  setLoadError(getMessage(error, '저장하지 못했습니다.')),
                )
              }
            >
              {isSaving ? '저장 중' : '저장'}
            </button>
          </div>
        </section>

        <div className={styles.mobileScreenScrollBody}>
          <div style={{ display: 'grid', gap: '14px', padding: '14px' }}>
            {loadError ? <div className={styles.errorNotice}>{loadError}</div> : null}
            {mutationError ? <div className={styles.errorNotice}>{mutationError}</div> : null}
            {documentError ? <div className={styles.errorNotice}>{documentError}</div> : null}
            {notice ? <div className={styles.inlineNotice}>{notice}</div> : null}

            <section className={styles.mobileEditorCard}>
              <div className={styles.mobileImplementationListHeader}>
                <div className={styles.mobileImplementationListTitle}>1. 원본 보고서 선택</div>
                {siteSessions.length > 0 ? (
                  <button
                    type="button"
                    className={`app-button app-button-primary ${styles.mobileImplementationAddButton}`}
                    onClick={() => setSourceModalOpen(true)}
                  >
                    보고서 선택
                  </button>
                ) : null}
              </div>

              {selectedSession ? (
                <article className={styles.reportCard} style={{ padding: '12px' }}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong className={styles.cardTitle} style={{ fontSize: '15px' }}>
                      {getSessionTitle(selectedSession)}
                    </strong>
                    <div
                      style={{
                        color: '#475569',
                        display: 'flex',
                        flexWrap: 'wrap',
                        fontSize: '13px',
                        gap: '10px',
                      }}
                    >
                      <span>{getSessionGuidanceDate(selectedSession) || '-'}</span>
                      <span>작성 {selectedSession.meta.drafter || '-'}</span>
                      <span>지적 {countDocument7FindingsForDisplay(selectedSession)}건</span>
                      <span>공정률 {formatSessionProgressRateDisplay(selectedSession)}</span>
                    </div>
                  </div>
                </article>
              ) : (
                <div className={styles.mobileImplementationEmpty}>
                  원본으로 사용할 기술지도 보고서가 없습니다.
                </div>
              )}
            </section>

            <section className={styles.mobileEditorCard}>
            <div className={styles.mobileImplementationListHeader}>
              <div className={styles.mobileImplementationListTitle}>2. 현장 / 본사 기본정보</div>
            </div>

            <div className={styles.inlineNotice}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>
                {BAD_WORKPLACE_NOTICE_TITLE}
              </strong>
            </div>

            <div className={styles.mobileImplementationList}>
              <article className={styles.mobileImplementationItem}>
                <div className={styles.mobileEditorCardTitle}>현장</div>
                <div className={styles.mobileImplementationFieldGrid}>
                  <EditableField
                    label="현장명"
                    value={draft.siteSnapshot.siteName}
                    onChange={(value) => updateSiteSnapshot('siteName', value)}
                  />
                  <EditableField
                    label="사업개시번호"
                    value={draft.siteSnapshot.businessStartNumber}
                    onChange={(value) => updateSiteSnapshot('businessStartNumber', value)}
                  />
                  <EditableField
                    label="공사기간"
                    value={draft.siteSnapshot.constructionPeriod}
                    onChange={(value) => updateSiteSnapshot('constructionPeriod', value)}
                  />
                  <EditableField
                    label="공정률"
                    value={draft.progressRate}
                    onChange={(value) =>
                      updateDraft((current) => ({ ...current, progressRate: value }))
                    }
                  />
                  <EditableField
                    label="공사금액"
                    value={draft.siteSnapshot.constructionAmount}
                    onChange={(value) => updateSiteSnapshot('constructionAmount', value)}
                  />
                  <EditableField
                    label="현장소장"
                    value={draft.siteSnapshot.siteManagerName}
                    onChange={(value) => updateSiteSnapshot('siteManagerName', value)}
                  />
                  <EditableField
                    label="현장 연락처"
                    value={draft.siteSnapshot.siteManagerPhone}
                    onChange={(value) => updateSiteSnapshot('siteManagerPhone', value)}
                  />
                  <EditableField
                    label="현장 주소"
                    value={draft.siteSnapshot.siteAddress}
                    wide
                    onChange={(value) => updateSiteSnapshot('siteAddress', value)}
                  />
                </div>
              </article>

              <article className={styles.mobileImplementationItem}>
                <div className={styles.mobileEditorCardTitle}>본사</div>
                <div className={styles.mobileImplementationFieldGrid}>
                  <EditableField
                    label="회사명"
                    value={draft.siteSnapshot.companyName}
                    onChange={(value) => updateSiteSnapshot('companyName', value)}
                  />
                  <EditableField
                    label="면허번호"
                    value={draft.siteSnapshot.licenseNumber}
                    onChange={(value) => updateSiteSnapshot('licenseNumber', value)}
                  />
                  <EditableField
                    label="사업자등록번호"
                    value={draft.siteSnapshot.businessRegistrationNumber}
                    onChange={(value) =>
                      updateSiteSnapshot('businessRegistrationNumber', value)
                    }
                  />
                  <EditableField
                    label="사업장관리번호"
                    value={draft.siteSnapshot.siteManagementNumber}
                    onChange={(value) => updateSiteSnapshot('siteManagementNumber', value)}
                  />
                  <EditableField
                    label="본사 주소"
                    value={draft.siteSnapshot.headquartersAddress}
                    wide
                    onChange={(value) => updateSiteSnapshot('headquartersAddress', value)}
                  />
                </div>
              </article>
            </div>
            </section>

            <section className={styles.mobileEditorCard}>
            <div className={styles.mobileImplementationListHeader}>
              <div className={styles.mobileImplementationListTitle}>3. 통보 정보</div>
            </div>

            <div className={styles.mobileImplementationFieldGrid}>
              <EditableField
                label="개선 지시일"
                value={draft.guidanceDate}
                placeholder="YYYY-MM-DD"
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    guidanceDate: value,
                  }))
                }
              />
              <EditableField
                label="이행 확인일"
                value={draft.confirmationDate}
                placeholder="YYYY-MM-DD"
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    confirmationDate: value,
                  }))
                }
              />
              <EditableField
                label="담당 요원"
                value={draft.reporterName}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    reporterName: value,
                  }))
                }
              />
              <EditableField
                label="연락처"
                value={draft.assigneeContact}
                placeholder="연락처를 입력해 주세요."
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    assigneeContact: value,
                  }))
                }
              />
              <EditableField
                label="통보일"
                value={draft.notificationDate}
                placeholder="YYYY-MM-DD"
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    notificationDate: value,
                  }))
                }
              />
              <EditableField
                label="지방노동청(지청)"
                value={draft.recipientOfficeName}
                placeholder="관할 지방노동청(지청)을 입력해 주세요."
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    recipientOfficeName: value,
                  }))
                }
              />
              <EditableField
                label="대리자"
                value={draft.agencyRepresentative}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    agencyRepresentative: value,
                  }))
                }
              />
              <EditableField
                label="첨부 서류"
                value={draft.attachmentDescription}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    attachmentDescription: value,
                  }))
                }
              />
            </div>
            </section>

            <section className={styles.mobileEditorCard}>
            <div className={styles.mobileImplementationListHeader}>
              <div className={styles.mobileImplementationListTitle}>4. 위반사항</div>
            </div>

            {draft.violations.length > 0 ? (
              <div className={styles.mobileFuturePlanCardList}>
                {draft.violations.map((item, index) => (
                  <article key={item.id} className={styles.mobileFuturePlanCard}>
                    <div className={styles.mobileImplementationItemTop}>
                      <span className={styles.mobileImplementationItemBadge}>
                        {`위반사항 ${index + 1}`}
                      </span>
                    </div>
                    <div className={styles.mobileImplementationFieldGrid}>
                      <EditableField
                        label="관련 법령"
                        multiline
                        rows={3}
                        value={item.legalReference}
                        onChange={(value) =>
                          updateViolation(item.id, {
                            legalReference: value,
                          })
                        }
                      />
                      <EditableField
                        label="유해위험요인"
                        multiline
                        rows={4}
                        value={item.hazardFactor}
                        onChange={(value) =>
                          updateViolation(item.id, {
                            hazardFactor: value,
                          })
                        }
                      />
                      <EditableField
                        label="개선지시사항"
                        multiline
                        rows={4}
                        wide
                        value={item.improvementMeasure}
                        onChange={(value) =>
                          updateViolation(item.id, {
                            improvementMeasure: value,
                          })
                        }
                      />
                      <EditableField
                        label="지시일"
                        value={item.guidanceDate}
                        placeholder="YYYY-MM-DD"
                        onChange={(value) =>
                          updateViolation(item.id, {
                            guidanceDate: value,
                          })
                        }
                      />
                      <EditableField
                        label="불이행 사항"
                        multiline
                        rows={4}
                        wide
                        value={item.nonCompliance}
                        onChange={(value) =>
                          updateViolation(item.id, {
                            nonCompliance: value,
                          })
                        }
                      />
                      <EditableField
                        label="확인일"
                        value={item.confirmationDate}
                        placeholder="YYYY-MM-DD"
                        onChange={(value) =>
                          updateViolation(item.id, {
                            confirmationDate: value,
                          })
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.mobileImplementationEmpty}>
                선택된 지적사항이 없습니다.
              </div>
            )}
            </section>
          </div>
        </div>
      </MobileShell>

      <AppModal
        open={documentInfoOpen}
        title="문서정보 확인"
        onClose={() => setDocumentInfoOpen(false)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setDocumentInfoOpen(false)}
            >
              닫기
            </button>
          </>
        }
      >
        <div className={styles.infoList}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>문서명</span>
            <span className={styles.infoValue}>{draft.title || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>신고월</span>
            <span className={styles.infoValue}>
              {formatMobileReportMonth(draft.reportMonth)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>원본 보고서</span>
            <span className={styles.infoValue}>
              {getSourceSessionDisplay(selectedSession)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>작성자</span>
            <span className={styles.infoValue}>{draft.reporterName || '-'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>최종 수정</span>
            <span className={styles.infoValue}>
              {formatDateTimeLabel(draft.updatedAt)}
            </span>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={sourceModalOpen}
        title="원본 기술지도 보고서 선택"
        size="large"
        onClose={() => setSourceModalOpen(false)}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setSourceModalOpen(false)}
            >
              닫기
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '10px' }}>
          {siteSessions.length > 0 ? (
            siteSessions.map((session) => {
              const isSelected = session.id === selectedSession?.id;

              return (
                <article
                  key={session.id}
                  className={styles.reportCard}
                  style={{ padding: '14px' }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <strong className={styles.cardTitle}>
                        {getSessionTitle(session)}
                      </strong>
                      <div
                        style={{
                          color: '#475569',
                          display: 'flex',
                          flexWrap: 'wrap',
                          fontSize: '13px',
                          gap: '10px',
                        }}
                      >
                        <span>{getSessionGuidanceDate(session) || '-'}</span>
                        <span>{`작성 ${session.meta.drafter || '-'}`}</span>
                        <span>{`지적 ${countDocument7FindingsForDisplay(session)}건`}</span>
                        <span>{`공정률 ${formatSessionProgressRateDisplay(session)}`}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`app-button ${
                        isSelected ? 'app-button-primary' : 'app-button-secondary'
                      }`}
                      disabled={isSelected}
                      onClick={() => handleSourceSessionChange(session.id)}
                    >
                      {isSelected ? '선택됨' : '불러오기'}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.mobileImplementationEmpty}>
              선택할 수 있는 기술지도 보고서가 없습니다.
            </div>
          )}
        </div>
      </AppModal>
    </>
  );
}
