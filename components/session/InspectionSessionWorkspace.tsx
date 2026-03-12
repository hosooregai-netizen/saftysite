'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useMemo, useState } from 'react';
import {
  INSPECTION_SECTIONS,
  createFutureProcessRiskItem,
  createInspectionHazardItem,
  createPreviousGuidanceItem,
  getSectionCompletion,
  getSessionProgress,
  getSessionSiteKey,
  getSessionTitle,
  touchUpdatedAt,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { HazardReportItem } from '@/types/hazard';
import type {
  DraftState,
  FutureProcessRiskItem,
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
  clonePreviousGuidanceItem,
  hasGuidanceContent,
  readFileAsDataUrl,
  toInspectionHazardItem,
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
  const [activeHazardId, setActiveHazardId] = useState<string | null>(null);

  const progress = session ? getSessionProgress(session) : null;
  const currentSectionIndex = session
    ? INSPECTION_SECTIONS.findIndex((section) => section.key === session.currentSection)
    : -1;
  const effectiveActiveHazardId =
    session?.currentHazards.some((item) => item.id === activeHazardId)
      ? activeHazardId
      : session?.currentHazards[0]?.id ?? null;

  const selectedHazard = useMemo(() => {
    if (!session || session.currentHazards.length === 0) return null;

    return (
      session.currentHazards.find((item) => item.id === effectiveActiveHazardId) ||
      session.currentHazards[0]
    );
  }, [effectiveActiveHazardId, session]);

  const relatedSessions = useMemo(() => {
    if (!session) return [];

    const currentSiteKey = getSessionSiteKey(session);

    return sessions.filter(
      (item) =>
        item.id !== session.id &&
        getSessionSiteKey(item) === currentSiteKey &&
        item.previousGuidanceItems.some(hasGuidanceContent)
    );
  }, [session, sessions]);

  const siteTitle = session
    ? getSiteById(getSessionSiteKey(session))?.title ||
      session.cover.businessName ||
      '이름 없는 현장'
    : '';

  const handleSessionChange = (updater: Parameters<typeof updateSession>[1]) => {
    updateSession(sessionId, updater);
  };

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

  const handleAddPreviousGuidance = () => {
    const item = createPreviousGuidanceItem();
    handleSessionChange((current) => ({
      ...current,
      previousGuidanceItems: [...current.previousGuidanceItems, item],
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
    field: 'previousPhotoUrl' | 'currentPhotoUrl',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    handlePreviousGuidanceChange(itemId, { [field]: dataUrl });
    event.target.value = '';
  };

  const handleRemovePreviousGuidance = (itemId: string) => {
    handleSessionChange((current) => ({
      ...current,
      previousGuidanceItems: current.previousGuidanceItems.filter(
        (item) => item.id !== itemId
      ),
    }));
  };

  const handleImportLatestGuidance = () => {
    const latestRelatedSession = relatedSessions[0];
    if (!latestRelatedSession) return;

    const importedItems = latestRelatedSession.previousGuidanceItems
      .filter(hasGuidanceContent)
      .map(clonePreviousGuidanceItem);

    if (importedItems.length === 0) return;

    handleSessionChange((current) => ({
      ...current,
      previousGuidanceItems: current.previousGuidanceItems.some(hasGuidanceContent)
        ? [...current.previousGuidanceItems, ...importedItems]
        : importedItems,
    }));
  };

  const handleHazardUploadSuccess = (reports: HazardReportItem[]) => {
    const nextItems = reports.map(toInspectionHazardItem);
    handleSessionChange((current) => ({
      ...current,
      currentHazards: [...current.currentHazards, ...nextItems],
    }));

    if (nextItems[0]) {
      setActiveHazardId(nextItems[0].id);
      handleSectionChange('currentHazards');
    }
  };

  const handleAddHazard = () => {
    const item = createInspectionHazardItem();
    handleSessionChange((current) => ({
      ...current,
      currentHazards: [...current.currentHazards, item],
    }));
    setActiveHazardId(item.id);
  };

  const handleHazardChange = (itemId: string, data: HazardReportItem) => {
    handleSessionChange((current) => ({
      ...current,
      currentHazards: current.currentHazards.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, ...data }) : item
      ),
    }));
  };

  const handleHazardStatusChange = (itemId: string, status: DraftState) => {
    handleSessionChange((current) => ({
      ...current,
      currentHazards: current.currentHazards.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, status }) : item
      ),
    }));
  };

  const handleRemoveHazard = (itemId: string) => {
    if (!session) return;

    const currentIndex = session.currentHazards.findIndex((item) => item.id === itemId);
    const nextSelected =
      session.currentHazards[currentIndex + 1] ||
      session.currentHazards[currentIndex - 1] ||
      null;

    handleSessionChange((current) => ({
      ...current,
      currentHazards: current.currentHazards.filter((item) => item.id !== itemId),
    }));
    setActiveHazardId(nextSelected?.id ?? null);
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
    patch: Partial<FutureProcessRiskItem>
  ) => {
    handleSessionChange((current) => ({
      ...current,
      futureProcessRisks: current.futureProcessRisks.map((item) =>
        item.id === itemId ? touchUpdatedAt({ ...item, ...patch }) : item
      ),
    }));
  };

  const handleRemoveFutureRisk = (itemId: string) => {
    handleSessionChange((current) => ({
      ...current,
      futureProcessRisks: current.futureProcessRisks.filter((item) => item.id !== itemId),
    }));
  };

  const handleFutureRiskStatusChange = (itemId: string, status: DraftState) => {
    handleFutureRiskChange(itemId, { status });
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
                  현장 목록으로
                </Link>
                <span className={styles.headerLabel}>현장 보고서</span>
                <div className={styles.headerIntro}>
                  <h1 className={styles.headerTitle}>{siteTitle}</h1>
                  <p className={styles.headerReportTitle}>{getSessionTitle(session)}</p>
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
                    className="app-button app-button-secondary"
                  >
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="app-button app-button-accent"
                  >
                    출력
                  </button>
                </div>
              </div>
            </header>

            <nav className={styles.sectionNav} aria-label="보고서 섹션">
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
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className={styles.content}>
              {INSPECTION_SECTIONS.map((section, index) => {
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
                      <p className={styles.sectionKicker}>Section {index + 1}</p>
                      <h2 className={styles.sectionTitle}>{section.label}</h2>
                      <p className={styles.sectionDescription}>{section.description}</p>
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
                          relatedSessionsCount={relatedSessions.length}
                          canImport={Boolean(relatedSessions[0])}
                          onImportLatest={handleImportLatestGuidance}
                          onAdd={handleAddPreviousGuidance}
                          onChange={handlePreviousGuidanceChange}
                          onPhotoChange={handlePreviousGuidancePhoto}
                          onRemove={handleRemovePreviousGuidance}
                        />
                      )}

                      {section.key === 'currentHazards' && (
                        <SessionCurrentHazardsSection
                          items={session.currentHazards}
                          selectedItem={selectedHazard}
                          onSelect={setActiveHazardId}
                          onUploadSuccess={handleHazardUploadSuccess}
                          onAdd={handleAddHazard}
                          onRemove={handleRemoveHazard}
                          onChange={handleHazardChange}
                          onStatusChange={handleHazardStatusChange}
                        />
                      )}

                      {section.key === 'futureRisks' && (
                        <SessionFutureRisksSection
                          items={session.futureProcessRisks}
                          onAdd={handleAddFutureRisk}
                          onChange={handleFutureRiskChange}
                          onRemove={handleRemoveFutureRisk}
                          onStatusChange={handleFutureRiskStatusChange}
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
                현재 {currentSectionIndex + 1} / {INSPECTION_SECTIONS.length} 섹션 작성 중
              </p>

              <div className={styles.bottomActions}>
                <Link href={siteHref} className="app-button app-button-secondary">
                  현장으로
                </Link>
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
                  이전 섹션
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(1)}
                  disabled={currentSectionIndex >= INSPECTION_SECTIONS.length - 1}
                  className="app-button app-button-primary"
                >
                  다음 섹션
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
