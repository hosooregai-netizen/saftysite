'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { ChartCard } from '@/components/session/workspace/widgets';
import styles from '@/features/mobile/components/MobileShell.module.css';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep5Props {
  doc5DraftError: string | null;
  doc5DraftLoading: boolean;
  doc5DraftNotice: string | null;
  handleGenerateDoc5Draft: () => Promise<void>;
  screen: InspectionScreenController;
  session: InspectionSessionDraft;
}

export function MobileInspectionSessionStep5({
  doc5DraftError,
  doc5DraftLoading,
  doc5DraftNotice,
  handleGenerateDoc5Draft,
  screen,
  session,
}: MobileInspectionSessionStep5Props) {
  return (
    <section style={{ padding: '16px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrap}>
          <h2 className={styles.sectionTitle}>기술지도 총평</h2>
        </div>
      </div>
      <div className={styles.editorBody}>
        <div className={workspaceStyles.doc5StatsGrid} style={{ marginBottom: '12px' }}>
          <ChartCard title="사고유형 통계" entries={screen.derivedData.currentAccidentEntries} variant="erp" />
          <ChartCard title="기인물 통계" entries={screen.derivedData.currentAgentEntries} variant="erp" />
          {screen.isRelationReady ? (
            <>
              <ChartCard title="사고유형 누적" entries={screen.derivedData.cumulativeAccidentEntries} variant="erp" />
              <ChartCard title="기인물 누적" entries={screen.derivedData.cumulativeAgentEntries} variant="erp" />
            </>
          ) : (
            <>
              <article className={workspaceStyles.doc5ChartPanel}>
                <h3 className={workspaceStyles.doc5ChartPanelTitle}>사고유형 누적</h3>
                <div className={workspaceStyles.doc5ChartPanelBody}>
                  <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                    {screen.isRelationHydrating
                      ? '누적 통계를 계산하는 중입니다.'
                      : screen.relationStatus === 'error'
                        ? '누적 통계를 아직 불러오지 못했습니다.'
                        : '이전 보고서가 없어 누적 통계가 없습니다.'}
                  </div>
                </div>
              </article>
              <article className={workspaceStyles.doc5ChartPanel}>
                <h3 className={workspaceStyles.doc5ChartPanelTitle}>기인물 누적</h3>
                <div className={workspaceStyles.doc5ChartPanelBody}>
                  <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                    {screen.isRelationHydrating
                      ? '누적 통계를 계산하는 중입니다.'
                      : screen.relationStatus === 'error'
                        ? '누적 통계를 아직 불러오지 못했습니다.'
                        : '이전 보고서가 없어 누적 통계가 없습니다.'}
                  </div>
                </div>
              </article>
            </>
          )}
        </div>
        <div className={styles.mobileEditorFieldStack}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>총평 본문</div>
            <button
              type="button"
              className={workspaceStyles.doc5SummaryDraftBtn}
              disabled={doc5DraftLoading}
              onClick={() => void handleGenerateDoc5Draft()}
            >
              총평 AI 생성
            </button>
          </div>
          {doc5DraftLoading ? <span className={styles.inlineNotice}>AI가 총평을 정리하고 있습니다.</span> : null}
          {doc5DraftError ? <p className={styles.errorNotice} style={{ margin: 0 }}>{doc5DraftError}</p> : null}
          {doc5DraftNotice ? <p className={styles.inlineNotice} style={{ margin: 0 }}>{doc5DraftNotice}</p> : null}
          {screen.isRelationHydrating ? (
            <p className={styles.inlineNotice} style={{ margin: 0 }}>
              누적 통계를 계산하는 중입니다. 지금 생성하면 현재 보고서 기준으로 먼저 작성합니다.
            </p>
          ) : null}
          {screen.relationStatus === 'error' ? (
            <p className={styles.errorNotice} style={{ margin: 0 }}>
              누적 통계를 아직 불러오지 못했습니다. 총평은 현재 보고서 기준으로만 생성됩니다.
            </p>
          ) : null}
          <textarea
            className="app-input"
            value={session.document5Summary.summaryText}
            onChange={(event) => {
              const value = event.target.value;
              screen.applyDocumentUpdate('doc5', 'manual', (current) => ({
                ...current,
                document5Summary: { ...current.document5Summary, summaryText: value },
              }));
            }}
            placeholder="총평을 입력하세요"
            style={{ width: '100%', minHeight: '200px', resize: 'vertical' }}
          />
        </div>
      </div>
    </section>
  );
}
