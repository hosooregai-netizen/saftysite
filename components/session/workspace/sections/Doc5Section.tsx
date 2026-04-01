'use client';

import { useState } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { ChartEntry } from '@/components/session/workspace/utils';
import { hasFindingContent } from '@/components/session/workspace/utils';
import { ChartCard } from '@/components/session/workspace/widgets';
import { buildLocalDoc5SummaryDraft } from '@/lib/openai/doc5SummaryLocalDraft';
import { generateDoc5Summary } from '@/lib/safetyApi/ai';

export default function Doc5Section(props: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  currentAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  session: OverviewSectionProps['session'];
}) {
  const {
    applyDocumentUpdate,
    currentAccidentEntries,
    currentAgentEntries,
    cumulativeAccidentEntries,
    cumulativeAgentEntries,
    session,
  } = props;

  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const applySummary = (text: string) => {
    applyDocumentUpdate('doc5', 'derived', (current) => ({
      ...current,
      document5Summary: { ...current.document5Summary, summaryText: text },
    }));
  };

  const handleGenerateDraft = async () => {
    setDraftError(null);
    setDraftNotice(null);

    const findings = session.document7Findings.filter(hasFindingContent);
    if (findings.length === 0) {
      applySummary('문서 7 분석 위험요인이 아직 없어 기술지도 총평 초안을 만들 수 없습니다.');
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
      setDraftNotice('AI 생성에 실패해 규칙 기반 초안으로 대체했습니다.');
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className={styles.sectionStack}>
      <div className={styles.chartGrid}>
        <ChartCard title="지적유형 통계 금회" entries={currentAccidentEntries} />
        <ChartCard title="지적유형 통계 누적" entries={cumulativeAccidentEntries} />
        <ChartCard title="기인물 통계 금회" entries={currentAgentEntries} />
        <ChartCard title="기인물 통계 누적" entries={cumulativeAgentEntries} />
      </div>
      <label className={styles.field}>
        <div className={styles.doc5SummaryFieldHeader}>
          <span className={styles.fieldLabel}>기술지도 총평</span>
          {draftLoading ? (
            <span className={styles.doc3AiInline} role="status" aria-live="polite">
              <span className={styles.doc3AiSpinner} aria-hidden />
              <span className={styles.doc3AiCaption}>(ai 생성중)</span>
            </span>
          ) : null}
          <button
            type="button"
            className={styles.doc5SummaryDraftBtn}
            disabled={draftLoading}
            onClick={() => void handleGenerateDraft()}
          >
            총평 초안 생성
          </button>
        </div>
        {draftError ? <p className={styles.fieldAssistError}>{draftError}</p> : null}
        {draftNotice ? <p className={styles.fieldAssist}>{draftNotice}</p> : null}
        <textarea
          className="app-textarea"
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
      </label>
    </div>
  );
}
