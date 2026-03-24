import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { ChartEntry } from '@/components/session/workspace/utils';
import { ChartCard } from '@/components/session/workspace/widgets';

function buildDoc5SummaryDraft(
  session: OverviewSectionProps['session'],
  currentAccidentEntries: ChartEntry[],
  currentAgentEntries: ChartEntry[]
) {
  const findings = session.document7Findings.filter((item) => item.location || item.accidentType || item.emphasis || item.improvementPlan);
  if (findings.length === 0) return '문서 7에 분석된 위험요인이 아직 없어 기술지도 총평 초안을 만들 수 없습니다.';

  const topAccidents = currentAccidentEntries.filter((item) => item.count > 0).slice(0, 2);
  const topAgents = currentAgentEntries.filter((item) => item.count > 0).slice(0, 2);
  const focusLines = findings.slice(0, 2).map((item) => {
    const location = item.location || '주요 작업구간';
    const hazard = item.emphasis || item.accidentType || '위험요인';
    const action = item.improvementPlan || '즉시 시정과 보호조치 강화가 필요합니다';
    return `${location}에서는 ${hazard}가 확인되어 ${action}`;
  });

  return [`금회 기술지도에서는 총 ${findings.length}건의 주요 위험요인이 확인되었습니다.`, topAccidents.length > 0 ? `주요 재해유형은 ${topAccidents.map((item) => `${item.label} ${item.count}건`).join(', ')}입니다.` : '', topAgents.length > 0 ? `기인물은 ${topAgents.map((item) => `${item.label} ${item.count}건`).join(', ')} 중심으로 확인되었습니다.` : '', `${focusLines.join(' 또한 ')}.`, '따라서 작업 전 위험성평가, 보호구 착용 확인, 작업구간 정리정돈과 즉시 시정조치를 병행하는 현장 관리가 필요합니다.'].filter(Boolean).join(' ');
}

export default function Doc5Section(props: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  currentAccidentEntries: ChartEntry[];
  currentAgentEntries: ChartEntry[];
  cumulativeAccidentEntries: ChartEntry[];
  cumulativeAgentEntries: ChartEntry[];
  session: OverviewSectionProps['session'];
}) {
  const { applyDocumentUpdate, currentAccidentEntries, currentAgentEntries, cumulativeAccidentEntries, cumulativeAgentEntries, session } = props;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.chartGrid}>
        <ChartCard title="지적유형별 금회" entries={currentAccidentEntries} />
        <ChartCard title="지적유형별 누적" entries={cumulativeAccidentEntries} />
        <ChartCard title="기인물별 금회" entries={currentAgentEntries} />
        <ChartCard title="기인물별 누적" entries={cumulativeAgentEntries} />
      </div>
      <label className={styles.field}>
        <div className={styles.doc5SummaryFieldHeader}>
          <span className={styles.fieldLabel}>기술지도 총평</span>
          <button
            type="button"
            className={styles.doc5SummaryDraftBtn}
            onClick={() => applyDocumentUpdate('doc5', 'derived', (current) => ({ ...current, document5Summary: { ...current.document5Summary, summaryText: buildDoc5SummaryDraft(current, currentAccidentEntries, currentAgentEntries) } }))}
          >
            총평 초안 생성
          </button>
        </div>
        <textarea className="app-textarea" value={session.document5Summary.summaryText} onChange={(event) => applyDocumentUpdate('doc5', 'manual', (current) => ({ ...current, document5Summary: { ...current.document5Summary, summaryText: event.target.value } }))} />
      </label>
    </div>
  );
}
