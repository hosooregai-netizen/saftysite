import { ChartCard } from '@/components/session/workspace/widgets';
import operationalStyles from '@/components/site/OperationalReports.module.css';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { QuarterlySectionHeader } from './QuarterlySectionHeader';

export function QuarterlyStatsSection(props: { draft: QuarterlySummaryReport }) {
  return (
    <article className={operationalStyles.reportCard}>
      <QuarterlySectionHeader title="2. 재해유형 분석" />
      <div className={operationalStyles.cardGrid}>
        <ChartCard title="재해유형별 종합" entries={props.draft.accidentStats} />
        <ChartCard title="기인물별 종합" entries={props.draft.causativeStats} />
      </div>
    </article>
  );
}
