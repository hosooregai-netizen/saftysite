'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import {
  getInspectionSectionContent,
  getInspectionSectionToolbar,
} from '@/features/inspection-session/workspace/sectionRegistry';
import { INSPECTION_WORKSPACE_SECTIONS } from '@/features/inspection-session/workspace/workspaceSections';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import type { InspectionDocumentStatus, InspectionSectionKey } from '@/types/inspectionSession';
import { formatDateTime } from '@/lib/formatDateTime';
import { MobileShell } from './MobileShell';
import styles from './MobileShell.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

const MOBILE_SECTION_KEYS: InspectionSectionKey[] = ['doc1', 'doc3', 'doc4', 'doc7', 'doc9'];

function getSectionStatusLabel(status: InspectionDocumentStatus | undefined) {
  if (status === 'completed') {
    return '완료';
  }

  if (status === 'in_progress') {
    return '작성 중';
  }

  return '미작성';
}

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function StandaloneState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>모바일 보고서</span>
              <h1 className={styles.sectionTitle}>{title}</h1>
            </div>
            {description ? <p className={styles.inlineNotice}>{description}</p> : null}
            {action}
          </section>
        </div>
      </div>
    </main>
  );
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;

  if (!screen.isReady) {
    return <StandaloneState title="보고서를 준비하는 중입니다." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="모바일 보고서 로그인"
        description="핵심 섹션 중심으로 기술지도 보고서를 이어서 작성합니다."
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <StandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <StandaloneState
        title="보고서를 찾을 수 없습니다."
        description="보고서가 아직 동기화되지 않았거나 접근 가능한 범위를 벗어났습니다."
        action={
          <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
            현장 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  const hasLoadedSessionPayload = Boolean(screen.sectionSession);
  const allowedSections = INSPECTION_WORKSPACE_SECTIONS.filter((section) =>
    MOBILE_SECTION_KEYS.includes(section.key),
  );
  const activeSection = MOBILE_SECTION_KEYS.includes(screen.currentSection)
    ? screen.currentSection
    : 'doc1';
  const activeSectionInfo =
    allowedSections.find((section) => section.key === activeSection) ?? allowedSections[0];
  const sectionProps = hasLoadedSessionPayload
    ? {
        applyDocumentUpdate: screen.applyDocumentUpdate,
        currentAccidentEntries: screen.derivedData.currentAccidentEntries,
        currentAgentEntries: screen.derivedData.currentAgentEntries,
        currentSection: activeSection,
        cumulativeAccidentEntries: screen.derivedData.cumulativeAccidentEntries,
        cumulativeAgentEntries: screen.derivedData.cumulativeAgentEntries,
        doc7ReferenceMaterials: screen.derivedData.doc7ReferenceMaterials,
        isRelationHydrating: screen.isRelationHydrating,
        isRelationReady: screen.isRelationReady,
        measurementTemplates: screen.derivedData.measurementTemplates,
        relationStatus: screen.relationStatus,
        session: screen.sectionSession!,
        withFileData: screen.withFileData,
      }
    : null;
  const errors = [screen.uploadError, screen.syncError, screen.documentError].filter(
    (message): message is string => Boolean(message),
  );
  const mobileReportsHref = buildMobileSiteReportsHref(displaySession.siteKey);
  const sectionStatusLabel = getSectionStatusLabel(
    displaySession.documentsMeta[activeSection]?.status,
  );
  const saveStatusLabel = screen.isSaving
    ? '자동 저장 중'
    : hasLoadedSessionPayload
      ? '저장됨'
      : '본문 동기화 중';
  const editorBody =
    hasLoadedSessionPayload && sectionProps ? (
      getInspectionSectionContent(sectionProps)
    ) : (
      <p className={styles.inlineNotice}>
        보고서 본문을 동기화하는 중입니다. 잠시 후 핵심 섹션 편집이 가능합니다.
      </p>
    );
  const sectionToolbar =
    hasLoadedSessionPayload && sectionProps
      ? getInspectionSectionToolbar(sectionProps)
      : null;

  return (
    <MobileShell
      backHref={mobileReportsHref}
      backLabel="보고서 목록"
      currentUserName={screen.currentUserName}
      footer={
        <>
          <Link
            href={`/sessions/${encodeURIComponent(sessionId)}`}
            className={`app-button app-button-primary ${styles.footerPrimary}`}
          >
            웹에서 전체 편집
          </Link>
          <Link
            href={mobileReportsHref}
            className={`app-button app-button-secondary ${styles.footerSecondary}`}
          >
            목록으로
          </Link>
        </>
      }
      kicker="기술지도 보고서"
      onLogout={screen.logout}
      subtitle={displaySession.meta.siteName || screen.site?.siteName || null}
      title={getSessionTitle(displaySession)}
      webHref={`/sessions/${encodeURIComponent(sessionId)}`}
      webLabel="웹에서 전체 편집"
    >
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>보고서 상태</span>
            <h2 className={styles.sectionTitle}>모바일 핵심 섹션 진행 현황</h2>
          </div>
          <span className={styles.sectionMeta}>{saveStatusLabel}</span>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>진행률</span>
            <strong className={styles.statValue}>{screen.displayProgress.percentage}%</strong>
            <span className={styles.statMeta}>
              {screen.displayProgress.completed}/{screen.displayProgress.total} 섹션 반영
            </span>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>지도일</span>
            <strong className={styles.statValue}>
              {formatCompactDate(getSessionGuidanceDate(displaySession))}
            </strong>
            <span className={styles.statMeta}>
              마지막 저장 {formatDateTime(displaySession.lastSavedAt || displaySession.updatedAt)}
            </span>
          </article>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>문서 전환</span>
            <h2 className={styles.sectionTitle}>모바일에서 편집 가능한 핵심 섹션</h2>
          </div>
        </div>

        <div className={styles.sectionRail} aria-label="핵심 섹션 선택">
          {allowedSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={[
                styles.sectionButton,
                activeSection === section.key ? styles.sectionButtonActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!hasLoadedSessionPayload}
              onClick={() => screen.selectSection(section.key)}
            >
              <span className={styles.sectionButtonTitle}>
                {section.compactLabel}. {section.shortLabel}
              </span>
              <span className={styles.sectionButtonMeta}>
                {getSectionStatusLabel(displaySession.documentsMeta[section.key]?.status)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.editorHeader}>
          <div className={styles.sectionTitleWrap}>
            <span className={styles.sectionEyebrow}>현재 편집</span>
            <h2 className={styles.editorTitle}>
              {activeSectionInfo.compactLabel}. {activeSectionInfo.shortLabel}
            </h2>
            <span className={styles.editorMeta}>
              모바일 v1은 대상사업장, 사진, 이전 조치, 위험요인, 체크리스트만 제공합니다.
            </span>
          </div>
          <span className={styles.statusPill}>
            {sectionStatusLabel} / {saveStatusLabel}
          </span>
        </div>

        {sectionToolbar ? <div className={styles.editorToolbar}>{sectionToolbar}</div> : null}
        {screen.relationNotice ? <p className={styles.inlineNotice}>{screen.relationNotice}</p> : null}
        {errors.map((message) => (
          <p key={message} className={styles.errorNotice}>
            {message}
          </p>
        ))}

        <div className={styles.editorBody}>{editorBody}</div>
      </section>
    </MobileShell>
  );
}
