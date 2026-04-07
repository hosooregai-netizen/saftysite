'use client';

import { useState } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { ChartEntry } from '@/components/session/workspace/utils';
import { hasFindingContent } from '@/components/session/workspace/utils';
import { ChartCard } from '@/components/session/workspace/widgets';
import { buildLocalDoc5SummaryDraft } from '@/lib/openai/doc5SummaryLocalDraft';
import { generateDoc5Summary } from '@/lib/safetyApi/ai';

interface Doc5SectionProps {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  currentAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  isRelationHydrating: boolean;
  isRelationReady: boolean;
  relationStatus: OverviewSectionProps['relationStatus'];
  session: OverviewSectionProps['session'];
}

function RelationChartPlaceholder({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <article className={styles.doc5ChartPanel}>
      <h3 className={styles.doc5ChartPanelTitle}>{title}</h3>
      <div className={styles.doc5ChartPanelBody}>
        <div className={styles.relationNotice}>{message}</div>
      </div>
    </article>
  );
}

export default function Doc5Section(props: Doc5SectionProps) {
  const {
    applyDocumentUpdate,
    currentAccidentEntries,
    currentAgentEntries,
    cumulativeAccidentEntries,
    cumulativeAgentEntries,
    isRelationHydrating,
    isRelationReady,
    relationStatus,
    session,
  } = props;

  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const showRelationSkeleton = relationStatus === 'loading' && !isRelationReady;
  const showRelationError = relationStatus === 'error' && !isRelationReady;
  const showRelationEmpty =
    !isRelationReady && !showRelationSkeleton && !showRelationError;

  const applySummary = (text: string) => {
    applyDocumentUpdate('doc5', 'derived', (current) => ({
      ...current,
      document5Summary: { ...current.document5Summary, summaryText: text },
    }));
  };

  const handleGenerateDraft = async () => {
    setDraftError(null);
    setDraftNotice(null);

    if (!isRelationReady) {
      setDraftNotice(
        relationStatus === 'loading'
          ? '누적 통계 계산이 끝난 뒤 초안 생성이 가능합니다.'
          : relationStatus === 'error'
            ? '누적 통계를 불러오지 못해 초안 생성을 잠시 사용할 수 없습니다.'
            : '이전 보고서가 없어 누적 통계가 없습니다.',
      );
      return;
    }

    const findings = session.document7Findings.filter(hasFindingContent);
    if (findings.length === 0) {
      applySummary(
        '문서 7 분석 위험요인이 아직 없어 기술지도 총평 초안을 만들 수 없습니다.',
      );
      return;
    }

    setDraftLoading(true);
    try {
      const text = await generateDoc5Summary({
        currentAccidentEntries,
        cumulativeAccidentEntries,
        currentAgentEntries,
        cumulativeAgentEntries,
        findings,
      });
      applySummary(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDraftError(message);
      applySummary(
        buildLocalDoc5SummaryDraft(
          session,
          currentAccidentEntries,
          currentAgentEntries,
        ),
      );
      setDraftNotice('AI 생성이 실패해 규칙 기반 초안으로 대체했습니다.');
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.doc5StatsGrid}>
        <ChartCard title="지적유형별 통계 금회" entries={currentAccidentEntries} variant="erp" />
        <ChartCard title="기인물별 통계 금회" entries={currentAgentEntries} variant="erp" />
        {isRelationReady ? (
          <>
            <ChartCard
              title="지적유형별 통계 누적"
              entries={cumulativeAccidentEntries}
              variant="erp"
            />
            <ChartCard
              title="기인물별 통계 누적"
              entries={cumulativeAgentEntries}
              variant="erp"
            />
          </>
        ) : showRelationSkeleton ? (
          <>
            <RelationChartPlaceholder
              title="지적유형별 통계 누적"
              message="누적 통계를 계산 중입니다."
            />
            <RelationChartPlaceholder
              title="기인물별 통계 누적"
              message="누적 통계를 계산 중입니다."
            />
          </>
        ) : showRelationError ? (
          <>
            <RelationChartPlaceholder
              title="지적유형별 통계 누적"
              message="누적 통계를 아직 불러오지 못했습니다."
            />
            <RelationChartPlaceholder
              title="기인물별 통계 누적"
              message="누적 통계를 아직 불러오지 못했습니다."
            />
          </>
        ) : (
          <>
            <RelationChartPlaceholder
              title="지적유형별 통계 누적"
              message="이전 보고서가 없어 누적 통계가 없습니다."
            />
            <RelationChartPlaceholder
              title="기인물별 통계 누적"
              message="이전 보고서가 없어 누적 통계가 없습니다."
            />
          </>
        )}
      </div>

      <div className={styles.doc5SummaryTableWrap}>
        <div className={styles.doc5SummaryTableRow}>
          <div className={styles.doc5SummaryLabelCell}>기술지도 총평</div>
          <div className={styles.doc5SummaryValueCell}>
            <div className={styles.doc5SummaryEditorCell}>
              {draftError ? <p className={styles.fieldAssistError}>{draftError}</p> : null}
              {draftNotice ? <p className={styles.fieldAssist}>{draftNotice}</p> : null}
              {isRelationHydrating ? (
                <p className={styles.fieldAssist}>
                  누적 통계 계산이 끝나면 초안 생성이 활성화됩니다.
                </p>
              ) : null}
              {showRelationEmpty ? (
                <p className={styles.fieldAssist}>
                  첫 보고서라면 누적 통계 없이 현재 지적사항만 먼저 작성하면 됩니다.
                </p>
              ) : null}
              <textarea
                className={`app-textarea ${styles.doc5SummaryTextarea}`}
                value={session.document5Summary.summaryText}
                onChange={(event) =>
                  applyDocumentUpdate('doc5', 'manual', (current) => ({
                    ...current,
                    document5Summary: {
                      ...current.document5Summary,
                      summaryText: event.target.value,
                    },
                  }))
                }
              />
              <div className={styles.doc5SummaryActionRow}>
                {draftLoading ? (
                  <span className={styles.doc3AiInline} role="status" aria-live="polite">
                    <span className={styles.doc3AiSpinner} aria-hidden />
                    <span className={styles.doc3AiCaption}>AI 생성 중</span>
                  </span>
                ) : null}
                <button
                  type="button"
                  className={styles.doc5SummaryDraftBtn}
                  disabled={draftLoading || !isRelationReady}
                  onClick={() => void handleGenerateDraft()}
                >
                  총평 초안 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
