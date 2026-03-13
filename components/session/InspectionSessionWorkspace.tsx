'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useCallback, useEffect, useMemo } from 'react';
import {
  INSPECTION_SECTIONS,
  createFutureProcessRiskItem,
  createInspectionHazardItem,
  getSectionCompletion,
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
  touchUpdatedAt,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { HazardReportItem } from '@/types/hazard';
import type {
  InspectionCover,
  InspectionSectionKey,
  PreviousGuidanceItem,
  SupportItems,
} from '@/types/inspectionSession';
import type { CausativeAgentKey, CausativeAgentReport } from '@/types/siteOverview';
import SessionCoverSection from './SessionCoverSection';
import SessionCurrentHazardsSection from './SessionCurrentHazardsSection';
import SessionFutureRisksSection from './SessionFutureRisksSection';
import SessionPreviousGuidanceSection from './SessionPreviousGuidanceSection';
import SessionSiteOverviewSection from './SessionSiteOverviewSection';
import SessionSupportSection from './SessionSupportSection';
import {
  arePreviousGuidanceItemsEqual,
  buildPreviousGuidanceItems,
  readFileAsDataUrl,
} from './sessionUtils';
import styles from './InspectionSessionWorkspace.module.css';

interface InspectionSessionWorkspaceProps {
  sessionId: string;
}

export default function InspectionSessionWorkspace({
  sessionId,
}: InspectionSessionWorkspaceProps) {
  const router = useRouter();
  const {
    getSiteById,
    sessions,
    isReady,
    updateSession,
    getSessionById,
    saveNow,
  } = useInspectionSessions();
  const session = getSessionById(sessionId);

  const progress = session ? getSessionProgress(session) : null;
  const currentSectionIndex = session
    ? INSPECTION_SECTIONS.findIndex((section) => section.key === session.currentSection)
    : -1;

  const derivedPreviousGuidanceItems = useMemo(() => {
    if (!session) return [];
    return buildPreviousGuidanceItems(session, sessions);
  }, [session, sessions]);

  const siteTitle = session
    ? getSiteById(getSessionSiteKey(session))?.title ||
      session.cover.businessName ||
      '이름 없는 현장'
    : '';

  const handleSessionChange = useCallback(
    (updater: Parameters<typeof updateSession>[1]) => {
      updateSession(sessionId, updater);
    },
    [sessionId, updateSession]
  );

  useEffect(() => {
    if (!session) return;
    if (
      arePreviousGuidanceItemsEqual(
        session.previousGuidanceItems,
        derivedPreviousGuidanceItems
      )
    ) {
      return;
    }

    handleSessionChange((current) => ({
      ...current,
      previousGuidanceItems: derivedPreviousGuidanceItems,
    }));
  }, [derivedPreviousGuidanceItems, handleSessionChange, session]);

  const handleSectionChange = (section: InspectionSectionKey) => {
    handleSessionChange((current) => ({
      ...current,
      currentSection: section,
    }));
  };

  const moveSection = (direction: -1 | 1) => {
    if (!session || currentSectionIndex < 0) return;

    const nextIndex = currentSectionIndex + direction;
    if (nextIndex < 0 || nextIndex >= INSPECTION_SECTIONS.length) return;

    handleSectionChange(INSPECTION_SECTIONS[nextIndex].key);
  };

  const handleCoverChange = (field: keyof InspectionCover, value: string) => {
    handleSessionChange((current) => ({
      ...current,
      cover: {
        ...current.cover,
        [field]: value,
      },
    }));
  };

  const handleSiteOverviewSuccess = (report: CausativeAgentReport) => {
    handleSessionChange((current) => ({
      ...current,
      siteOverview: report,
      siteOverviewStatus: 'draft',
    }));
  };

  const handleSiteOverviewToggle = (key: CausativeAgentKey, checked: boolean) => {
    handleSessionChange((current) => ({
      ...current,
      siteOverview: {
        ...current.siteOverview,
        agents: {
          ...current.siteOverview.agents,
          [key]: checked,
        },
      },
    }));
  };

  const handlePreviousGuidanceChange = (
    itemId: string,
    patch: Partial<PreviousGuidanceItem>
  ) => {
    handleSessionChange((current) => ({
      ...current,
      previousGuidanceItems: current.previousGuidanceItems.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, ...patch }) : item
      ),
    }));
  };

  const handlePreviousGuidancePhoto = async (
    itemId: string,
    field: 'currentPhotoUrl',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    handlePreviousGuidanceChange(itemId, { [field]: dataUrl });
    event.target.value = '';
  };

  const handleAddHazard = () => {
    const item = createInspectionHazardItem();
    handleSessionChange((current) => ({
      ...current,
      currentHazards: [...current.currentHazards, item],
    }));
  };

  const handleHazardChange = (itemId: string, data: HazardReportItem) => {
    handleSessionChange((current) => ({
      ...current,
      currentHazards: current.currentHazards.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, ...data }) : item
      ),
    }));
  };

  const handleRemoveHazard = (itemId: string) => {
    handleSessionChange((current) => ({
      ...current,
      currentHazards: current.currentHazards.filter((item) => item.id !== itemId),
    }));
  };

  const handleAddFutureRisk = () => {
    const item = createFutureProcessRiskItem();
    handleSessionChange((current) => ({
      ...current,
      futureProcessRisks: [...current.futureProcessRisks, item],
    }));
  };

  const handleFutureRiskChange = (
    itemId: string,
    data: HazardReportItem
  ) => {
    handleSessionChange((current) => ({
      ...current,
      futureProcessRisks: current.futureProcessRisks.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, ...data }) : item
      ),
    }));
  };

  const handleRemoveFutureRisk = (itemId: string) => {
    handleSessionChange((current) => ({
      ...current,
      futureProcessRisks: current.futureProcessRisks.filter((item) => item.id !== itemId),
    }));
  };

  const handleSupportChange = <T extends keyof SupportItems>(
    field: T,
    value: SupportItems[T]
  ) => {
    handleSessionChange((current) => ({
      ...current,
      supportItems: {
        ...current.supportItems,
        [field]: value,
      },
    }));
  };

  if (!isReady) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.loadingState}>세션 정보를 불러오는 중입니다.</div>
          </section>
        </div>
      </main>
    );
  }

  if (!session || !progress) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.notFoundState}>
              <p>요청한 보고서를 찾을 수 없습니다.</p>
              <div className={styles.bottomActions}>
                <Link href="/" className="app-button app-button-secondary">
                  현장 목록으로
                </Link>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="app-button app-button-primary"
                >
                  처음으로
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const siteHref = `/sites/${encodeURIComponent(getSessionSiteKey(session))}`;

  return (
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.page}>
            <header className={styles.header}>
              <div className={styles.headerMain}>
                <Link href={siteHref} className={styles.backLink}>
                  보고서 목록으로
                </Link>
                <div className={styles.headerMetaSpacer} aria-hidden="true" />
                <div className={styles.headerTitleRow}>
                  <h1 className={styles.headerTitle}>{siteTitle}</h1>
                  <p className={styles.headerReportTitle}>
                    <span className={styles.headerTitleDivider}>-</span>
                    {getSessionTitle(session)}
                  </p>
                </div>
              </div>

              <div className={styles.headerSide}>
                <div className={styles.headerProgress}>
                  <div className={styles.headerProgressMeta}>
                    <span className={styles.headerProgressLabel}>진행률</span>
                    <span className={styles.headerProgressValue}>
                      {progress.completed}/{progress.total} 완료
                    </span>
                  </div>
                  <div className={styles.headerProgressTrack} aria-hidden="true">
                    <span
                      className={styles.headerProgressFill}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>

                <div className={styles.headerActions}>
                  <button
                    type="button"
                    onClick={() => saveNow()}
                    className={`${styles.heroSaveButton} app-button app-button-secondary`}
                  >
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="app-button app-button-accent"
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </header>

            <nav className={styles.sectionNav} aria-label="보고서 단계">
              <div className={styles.sectionNavList}>
                {INSPECTION_SECTIONS.map((section, index) => {
                  const isActive = section.key === session.currentSection;
                  const className = [
                    styles.sectionTab,
                    isActive ? styles.sectionTabActive : '',
                    getSectionCompletion(session, section.key)
                      ? styles.sectionTabCompleted
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => handleSectionChange(section.key)}
                      className={className}
                    >
                      <span className={styles.sectionTabIndex}>{index + 1}</span>
                      <span className={styles.sectionTabText}>
                        <span className={styles.sectionTabLabel}>{section.shortLabel}</span>
                        <span className={styles.sectionTabLabelCompact}>
                          {section.compactLabel}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className={styles.content}>
              {INSPECTION_SECTIONS.map((section) => {
                const isActive = section.key === session.currentSection;
                const className = [
                  styles.sectionCard,
                  isActive ? styles.sectionCardActive : styles.sectionCardInactive,
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <section key={section.key} className={className}>
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>{section.label}</h2>
                      {section.key === 'currentHazards' ? (
                        <button
                          type="button"
                          onClick={handleAddHazard}
                          className="app-button app-button-primary"
                        >
                          항목 추가
                        </button>
                      ) : null}
                      {section.key === 'futureRisks' ? (
                        <button
                          type="button"
                          onClick={handleAddFutureRisk}
                          className="app-button app-button-primary"
                        >
                          항목 추가
                        </button>
                      ) : null}
                    </div>

                    <div className={styles.sectionBody}>
                      {section.key === 'cover' && (
                        <SessionCoverSection
                          cover={session.cover}
                          onChange={handleCoverChange}
                        />
                      )}

                      {section.key === 'siteOverview' && (
                        <SessionSiteOverviewSection
                          report={session.siteOverview}
                          onSuccess={handleSiteOverviewSuccess}
                          onToggle={handleSiteOverviewToggle}
                        />
                      )}

                      {section.key === 'previousGuidance' && (
                        <SessionPreviousGuidanceSection
                          items={session.previousGuidanceItems}
                          onChange={handlePreviousGuidanceChange}
                          onPhotoChange={handlePreviousGuidancePhoto}
                        />
                      )}

                      {section.key === 'currentHazards' && (
                        <SessionCurrentHazardsSection
                          items={session.currentHazards}
                          onAdd={handleAddHazard}
                          onRemove={handleRemoveHazard}
                          onChange={handleHazardChange}
                        />
                      )}

                      {section.key === 'futureRisks' && (
                        <SessionFutureRisksSection
                          items={session.futureProcessRisks}
                          onAdd={handleAddFutureRisk}
                          onChange={handleFutureRiskChange}
                          onRemove={handleRemoveFutureRisk}
                        />
                      )}

                      {section.key === 'support' && (
                        <SessionSupportSection
                          items={session.supportItems}
                          onChange={handleSupportChange}
                        />
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className={styles.bottomBar}>
              <p className={styles.bottomMeta}>
                현재 {currentSectionIndex + 1} / {INSPECTION_SECTIONS.length} 단계 작성 중
              </p>

              <div className={styles.bottomActions}>
                <button
                  type="button"
                  onClick={() => saveNow()}
                  className="app-button app-button-secondary"
                >
                  임시저장
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(-1)}
                  disabled={currentSectionIndex <= 0}
                  className="app-button app-button-secondary"
                >
                  이전 단계
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(1)}
                  disabled={currentSectionIndex >= INSPECTION_SECTIONS.length - 1}
                  className="app-button app-button-primary"
                >
                  다음 단계
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
