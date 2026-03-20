'use client';

import styles from './SiteOverviewChecklist.module.css';

interface ChecklistReasoningCardProps {
  reasoning: string;
  expanded: boolean;
  onToggle: () => void;
}

function joinClassNames(...values: Array<string | false>) {
  return values.filter(Boolean).join(' ');
}

export default function ChecklistReasoningCard({
  reasoning,
  expanded,
  onToggle,
}: ChecklistReasoningCardProps) {
  const isLong = reasoning.length > 180 || reasoning.includes('\n');
  const bodyClassName = joinClassNames(
    styles.reasoningBody,
    isLong && !expanded && styles.reasoningBodyCollapsed
  );

  return (
    <div className={styles.reasoningCard}>
      <div className={styles.reasoningHeader}>
        <div className={styles.reasoningCopy}>
          <p className={styles.reasoningEyebrow}>AI 판단 근거</p>
        </div>
        {isLong ? (
          <button type="button" className={styles.reasoningToggle} onClick={onToggle}>
            {expanded ? '접기' : '전체 보기'}
          </button>
        ) : null}
      </div>
      <p className={bodyClassName}>{reasoning}</p>
    </div>
  );
}
