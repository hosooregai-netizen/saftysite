'use client';

import { useState } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { ChartEntry } from '@/components/session/workspace/utils';
import { hasFindingContent } from '@/components/session/workspace/utils';
import { ChartCard } from '@/components/session/workspace/widgets';
import {
  buildDoc5StructuredSummaryPayload,
  buildLocalDoc5SummaryDraft,
} from '@/lib/openai/doc5SummaryLocalDraft';

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

async function generateStructuredDoc5Summary(
  payload: ReturnType<typeof buildDoc5StructuredSummaryPayload>,
) {
  const response = await fetch('/api/ai/doc5-structured-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!response.ok || !result.text?.trim()) {
    throw new Error(result.error?.trim() || '총평 AI 생성에 실패했습니다.');
  }

  return result.text.trim();
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
    setDraftNotice(
      !isRelationReady
        ? '누적 통계가 없거나 아직 준비되지 않아 현재 보고서 중심으로 총평을 생성합니다.'
        : null,
    );

    const findings = session.document7Findings.filter(hasFindingContent);
    if (findings.length === 0) {
      applySummary(
        buildLocalDoc5SummaryDraft(
          session,
          currentAccidentEntries,
          currentAgentEntries,
          cumulativeAccidentEntries,
          cumulativeAgentEntries,
        ),
      );
      setDraftNotice('문서7 지적사항이 적어 로컬 규칙 기반 총평으로 먼저 채웠습니다.');
      return;
    }

    setDraftLoading(true);
    try {
      const text = await generateStructuredDoc5Summary(
        buildDoc5StructuredSummaryPayload(
          session,
          currentAccidentEntries,
          currentAgentEntries,
          cumulativeAccidentEntries,
          cumulativeAgentEntries,
        ),
      );
      applySummary(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDraftError(message);
      applySummary(
        buildLocalDoc5SummaryDraft(
          session,
          currentAccidentEntries,
          currentAgentEntries,
          cumulativeAccidentEntries,
          cumulativeAgentEntries,
        ),
      );
      setDraftNotice('AI 생성이 실패해 5줄 구조의 로컬 총평으로 대체했습니다.');
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.doc5StatsGrid}>
        <ChartCard title="지적유형 통계 금회" entries={currentAccidentEntries} variant="erp" />
        <ChartCard title="기인물 통계 금회" entries={currentAgentEntries} variant="erp" />
        {isRelationReady ? (
          <>
            <ChartCard
              title="지적유형 통계 누적"
              entries={cumulativeAccidentEntries}
              variant="erp"
            />
            <ChartCard
              title="기인물 통계 누적"
              entries={cumulativeAgentEntries}
              variant="erp"
            />
          </>
        ) : showRelationSkeleton ? (
          <>
            <RelationChartPlaceholder
              title="지적유형 통계 누적"
              message="누적 통계를 계산하고 있습니다."
            />
            <RelationChartPlaceholder
              title="기인물 통계 누적"
              message="누적 통계를 계산하고 있습니다."
            />
          </>
        ) : showRelationError ? (
          <>
            <RelationChartPlaceholder
              title="지적유형 통계 누적"
              message="누적 통계를 아직 불러오지 못했습니다."
            />
            <RelationChartPlaceholder
              title="기인물 통계 누적"
              message="누적 통계를 아직 불러오지 못했습니다."
            />
          </>
        ) : (
          <>
            <RelationChartPlaceholder
              title="지적유형 통계 누적"
              message="이전 보고서가 없어 누적 통계가 없습니다."
            />
            <RelationChartPlaceholder
              title="기인물 통계 누적"
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
                  누적 통계 계산이 끝나면 다음 생성부터 추세 문장이 더 풍부해집니다.
                </p>
              ) : null}
              {showRelationEmpty ? (
                <p className={styles.fieldAssist}>
                  첫 보고서여도 현재 보고서 기준 5줄 총평 생성은 가능합니다.
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
                  disabled={draftLoading}
                  onClick={() => void handleGenerateDraft()}
                >
                  총평 AI 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
