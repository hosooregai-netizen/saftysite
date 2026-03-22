'use client';

import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import { createPreviousGuidanceFollowUpItem } from '@/constants/inspectionSession';
import type { InspectionSectionKey } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import type { ChartEntry } from '@/components/session/workspace/utils';
import { ChartCard, UploadBox } from '@/components/session/workspace/widgets';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

function buildDoc5SummaryDraft(
  session: OverviewSectionProps['session'],
  currentAccidentEntries: Array<{ count: number; label: string }>,
  currentAgentEntries: Array<{ count: number; label: string }>
) {
  const findings = session.document7Findings.filter(
    (item) => item.location || item.accidentType || item.emphasis || item.improvementPlan
  );
  if (findings.length === 0) {
    return '문서 7에 분석된 위험요인이 아직 없어 기술지도 총평 초안을 만들 수 없습니다.';
  }

  const topAccidents = currentAccidentEntries.filter((item) => item.count > 0).slice(0, 2);
  const topAgents = currentAgentEntries.filter((item) => item.count > 0).slice(0, 2);
  const focusLines = findings.slice(0, 2).map((item) => {
    const location = item.location || '주요 작업구간';
    const hazard = item.emphasis || item.accidentType || '위험요인';
    const action = item.improvementPlan || '즉시 시정과 보호조치 강화가 필요합니다';
    return `${location}에서는 ${hazard}가 확인되어 ${action}`;
  });

  return [
    `금회 기술지도에서는 총 ${findings.length}건의 주요 위험요인이 확인되었습니다.`,
    topAccidents.length > 0
      ? `주요 재해유형은 ${topAccidents.map((item) => `${item.label} ${item.count}건`).join(', ')}입니다.`
      : '',
    topAgents.length > 0
      ? `기인물은 ${topAgents.map((item) => `${item.label} ${item.count}건`).join(', ')} 중심으로 확인되었습니다.`
      : '',
    `${focusLines.join(' 또한 ')}.`,
    '따라서 작업 전 위험성평가, 보호구 착용 확인, 작업구간 정리정돈과 즉시 시정조치를 병행하는 현장 관리가 필요합니다.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function renderDoc4(props: OverviewSectionProps) {
  const { applyDocumentUpdate, correctionResultOptions, session, withFileData } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 3블록</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: [...current.document4FollowUps, createPreviousGuidanceFollowUpItem({ confirmationDate: current.meta.reportDate })] }))}>블록 추가</button>
      </div>
      {session.document4FollowUps.map((item, index) => {
        const isDerived = Boolean(item.sourceSessionId && item.sourceFindingId);
        const canRemove = !isDerived && session.document4FollowUps.length > 3;
        const updateField = (key: 'location' | 'guidanceDate' | 'confirmationDate' | 'result' | 'beforePhotoUrl' | 'afterPhotoUrl', value: string) => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.map((followUp) => followUp.id === item.id ? { ...followUp, [key]: value } : followUp) }));

        return (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div><div className={styles.cardEyebrow}>{isDerived ? '이전 보고서 연동' : '수동 블록'}</div><h3 className={styles.cardTitle}>{`후속조치 ${index + 1}`}</h3></div>
              {canRemove ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc4', 'manual', (current) => ({ ...current, document4FollowUps: current.document4FollowUps.filter((followUp) => followUp.id !== item.id) }))}>삭제</button> : null}
            </div>
            <div className={styles.formGrid}>
              {[['유해·위험장소', item.location, 'location'], ['지도일', item.guidanceDate, 'guidanceDate'], ['확인일', item.confirmationDate, 'confirmationDate']].map(([label, value, key]) => (
                <label key={String(key)} className={styles.field}>
                  <span className={styles.fieldLabel}>{label}</span>
                  <input type={key === 'location' ? 'text' : 'date'} className="app-input" value={String(value)} readOnly={isDerived && key === 'guidanceDate'} onChange={(event) => updateField(key as 'location' | 'guidanceDate' | 'confirmationDate', event.target.value)} />
                </label>
              ))}
            </div>
            <div className={styles.dualUploadGrid}>
              <UploadBox id={`follow-up-before-${item.id}`} label="시정 전 사진" value={item.beforePhotoUrl} onClear={isDerived ? undefined : () => updateField('beforePhotoUrl', '')} onSelect={async (file) => { if (!isDerived) await withFileData(file, (dataUrl) => updateField('beforePhotoUrl', dataUrl)); }} />
              <UploadBox id={`follow-up-after-${item.id}`} label="시정 후 사진" value={item.afterPhotoUrl} onClear={() => updateField('afterPhotoUrl', '')} onSelect={async (file) => withFileData(file, (dataUrl) => updateField('afterPhotoUrl', dataUrl))} />
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>시정조치 결과</span>
              <input type="text" list={`correction-result-options-${item.id}`} className="app-input" value={item.result} onChange={(event) => updateField('result', event.target.value)} />
              {correctionResultOptions.length > 0 ? <datalist id={`correction-result-options-${item.id}`}>{correctionResultOptions.map((option) => <option key={option} value={option} />)}</datalist> : null}
            </label>
          </article>
        );
      })}
    </div>
  );
}

export function renderDoc5(props: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  currentAccidentEntries: Array<{ count: number; label: string }>;
  currentAgentEntries: Array<{ count: number; label: string }>;
  cumulativeAccidentEntries: Array<{ count: number; label: string }>;
  cumulativeAgentEntries: Array<{ count: number; label: string }>;
  session: OverviewSectionProps['session'];
}) {
  const { applyDocumentUpdate, currentAccidentEntries, currentAgentEntries, cumulativeAccidentEntries, cumulativeAgentEntries, session } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">문서 7 분석값 반영</span>
        <button
          type="button"
          className="app-button app-button-secondary"
          onClick={() =>
            applyDocumentUpdate('doc5', 'derived', (current) => ({
              ...current,
              document5Summary: {
                ...current.document5Summary,
                summaryText: buildDoc5SummaryDraft(
                  current,
                  currentAccidentEntries,
                  currentAgentEntries
                ),
              },
            }))
          }
        >
          총평 초안 생성
        </button>
      </div>
      <div className={styles.chartGrid}>
        <ChartCard title="지적유형별 금회" entries={currentAccidentEntries} />
        <ChartCard title="지적유형별 누적" entries={cumulativeAccidentEntries} />
        <ChartCard title="기인물별 금회" entries={currentAgentEntries} />
        <ChartCard title="기인물별 누적" entries={cumulativeAgentEntries} />
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>기술지도 총평</span>
        <textarea className="app-textarea" value={session.document5Summary.summaryText} onChange={(event) => applyDocumentUpdate('doc5', 'manual', (current) => ({ ...current, document5Summary: { ...current.document5Summary, summaryText: event.target.value } }))} />
      </label>
    </div>
  );
}

export function renderDoc6(props: {
  applyDocumentUpdate: OverviewSectionProps['applyDocumentUpdate'];
  recommendedAgentKeys: Set<string>;
  session: OverviewSectionProps['session'];
}) {
  const { applyDocumentUpdate, recommendedAgentKeys, session } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">추천 {recommendedAgentKeys.size}건</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc6', 'derived', (current) => ({ ...current, document6Measures: current.document6Measures.map((measure) => ({ ...measure, checked: recommendedAgentKeys.has(measure.key) })) }))}>추천값 다시 반영</button>
      </div>
      <div className={styles.measureTable}>
        {CAUSATIVE_AGENT_SECTIONS.flatMap((section) => section.rows).map((row) => (
          <div key={`${row.left.key}-${row.right.key}`} className={styles.measureRow}>
            {[row.left, row.right].map((item) => {
              const currentMeasure = session.document6Measures.find((measure) => measure.key === item.key);
              return (
                <label key={item.key} className={styles.measureCell}>
                  <div className={styles.measureMain}>
                    <input type="checkbox" className="app-checkbox" checked={currentMeasure?.checked ?? false} onChange={(event) => applyDocumentUpdate('doc6', 'manual', (current) => ({ ...current, document6Measures: current.document6Measures.map((measure) => measure.key === item.key ? { ...measure, checked: event.target.checked } : measure) }))} />
                    <div><div className={styles.measureTitle}><span className={styles.measureNumber}>{item.number}</span><span>{item.label}</span></div><p className={styles.measureText}>{item.guidance}</p></div>
                  </div>
                  {recommendedAgentKeys.has(item.key) ? <span className={styles.recommendBadge}>추천</span> : null}
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderDoc4To6(
  section: InspectionSectionKey,
  props: OverviewSectionProps & {
    currentAccidentEntries: ChartEntry[];
    currentAgentEntries: ChartEntry[];
    cumulativeAccidentEntries: ChartEntry[];
    cumulativeAgentEntries: ChartEntry[];
    recommendedAgentKeys: Set<CausativeAgentKey>;
  }
) {
  if (section === 'doc4') return renderDoc4(props);
  if (section === 'doc5') return renderDoc5(props);
  if (section === 'doc6') return renderDoc6(props);
  return null;
}
