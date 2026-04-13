'use client';

import { ChartCard } from '@/components/session/workspace/widgets';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileQuarterlyAnalysisStepProps {
  draft: QuarterlySummaryReport;
}

export function MobileQuarterlyAnalysisStep({
  draft,
}: MobileQuarterlyAnalysisStepProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <ChartCard title="재해유형" entries={draft.accidentStats} variant="erp" />
      <ChartCard title="기인물" entries={draft.causativeStats} variant="erp" />
    </section>
  );
}
