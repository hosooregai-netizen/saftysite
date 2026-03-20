'use client';

import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
} from '@/constants/inspectionSession';
import { CHECKLIST_RATING_OPTIONS, FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';
import { ChecklistTable } from '@/components/session/workspace/widgets';
import Doc7FindingCard from '@/components/session/workspace/Doc7FindingCard';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { ChecklistRating, InspectionSectionKey } from '@/types/inspectionSession';

const RATING_OPTIONS: Array<{ label: string; value: ChecklistRating }> = [
  ...CHECKLIST_RATING_OPTIONS,
];

export function renderDoc7(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, legalReferenceLibrary, session, withFileData } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1블록</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc7', 'manual', (current) => ({ ...current, document7Findings: [...current.document7Findings, createCurrentHazardFinding({ inspector: current.meta.drafter })] }))}>위험요인 추가</button>
      </div>
      {session.document7Findings.map((item, index) => (
        <Doc7FindingCard key={item.id} applyDocumentUpdate={applyDocumentUpdate} item={item} index={index} legalReferenceLibrary={legalReferenceLibrary} removable={session.document7Findings.length > 1} withFileData={withFileData} />
      ))}
    </div>
  );
}

export function renderDoc8(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, session } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1행</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()] }))}>행 추가</button>
      </div>
      <div className={styles.tableCard}>
        <div className={styles.futureTableHead}><span>향후 주요 작업공정</span><span>위험요인</span><span>안전대책</span><span>비고</span><span>작업</span></div>
        {session.document8Plans.map((item) => (
          <div key={item.id} className={styles.futureTableRow}>
            <input list="future-process-library" className="app-input" value={item.processName} onChange={(event) => { const matched = FUTURE_PROCESS_LIBRARY.find((libraryItem) => libraryItem.processName === event.target.value); applyDocumentUpdate('doc8', matched ? 'api' : 'manual', (current) => ({ ...current, document8Plans: current.document8Plans.map((plan) => plan.id === item.id ? { ...plan, processName: event.target.value, hazard: matched?.hazard ?? plan.hazard, countermeasure: matched?.countermeasure ?? plan.countermeasure, source: matched ? 'api' : 'manual' } : plan) })); }} />
            {(['hazard', 'countermeasure', 'note'] as const).map((field) => <textarea key={field} className={`${styles.tableTextarea} app-textarea`} value={item[field]} onChange={(event) => applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: current.document8Plans.map((plan) => plan.id === item.id ? { ...plan, [field]: event.target.value, source: 'manual' } : plan) }))} />)}
            <div className={styles.rowActions}>
              <span className="app-chip">{item.source === 'api' ? '자동채움' : '수동'}</span>
              {session.document8Plans.length > 1 ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: current.document8Plans.filter((plan) => plan.id !== item.id) }))}>삭제</button> : null}
            </div>
          </div>
        ))}
        <datalist id="future-process-library">{FUTURE_PROCESS_LIBRARY.map((item) => <option key={item.processName} value={item.processName} />)}</datalist>
      </div>
    </div>
  );
}

export function renderDoc9(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, legalReferenceLibrary, session } = props;
  return (
    <div className={styles.sectionStack}>
      <ChecklistTable title="TBM 체크" items={session.document9SafetyChecks.tbm} ratingOptions={RATING_OPTIONS} onChange={(itemId, patch) => applyDocumentUpdate('doc9', 'manual', (current) => ({ ...current, document9SafetyChecks: { ...current.document9SafetyChecks, tbm: current.document9SafetyChecks.tbm.map((item) => item.id === itemId ? { ...item, ...patch } : item) } }))} />
      <ChecklistTable title="위험성평가 체크" items={session.document9SafetyChecks.riskAssessment} ratingOptions={RATING_OPTIONS} onChange={(itemId, patch) => applyDocumentUpdate('doc9', 'manual', (current) => ({ ...current, document9SafetyChecks: { ...current.document9SafetyChecks, riskAssessment: current.document9SafetyChecks.riskAssessment.map((item) => item.id === itemId ? { ...item, ...patch } : item) } }))} />
      <section className={styles.readonlyLegalCard}>
        <h3 className={styles.matrixTitle}>법령 본문</h3>
        <div className={styles.legalTextList}>
          {legalReferenceLibrary.map((item) => <article key={item.id} className={styles.legalTextItem}><strong>{item.title}</strong><p>{item.body}</p></article>)}
        </div>
      </section>
    </div>
  );
}

export function renderDoc10(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, session } = props;
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 3행</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: [...current.document10Measurements, createMeasurementCheckItem()] }))}>행 추가</button>
      </div>
      <div className={styles.tableCard}>
        <div className={styles.measurementHead}><span>측정위치</span><span>측정치</span><span>안전기준</span><span>조치여부</span><span>작업</span></div>
        {session.document10Measurements.map((item) => (
          <div key={item.id} className={styles.measurementRow}>
            {(['measurementLocation', 'measuredValue'] as const).map((field) => <input key={field} type="text" className="app-input" value={item[field]} onChange={(event) => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: current.document10Measurements.map((measurement) => measurement.id === item.id ? { ...measurement, [field]: event.target.value } : measurement) }))} />)}
            <textarea className={`${styles.tableTextarea} app-textarea`} value={item.safetyCriteria} onChange={(event) => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: current.document10Measurements.map((measurement) => measurement.id === item.id ? { ...measurement, safetyCriteria: event.target.value } : measurement) }))} />
            <input type="text" className="app-input" value={item.actionTaken} onChange={(event) => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: current.document10Measurements.map((measurement) => measurement.id === item.id ? { ...measurement, actionTaken: event.target.value } : measurement) }))} />
            <div className={styles.rowActions}>
              <span className="app-chip">{item.instrumentType}</span>
              {session.document10Measurements.length > 3 ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: current.document10Measurements.filter((measurement) => measurement.id !== item.id) }))}>삭제</button> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function renderDoc7To10(section: InspectionSectionKey, props: HazardStatsSectionProps) {
  if (section === 'doc7') return renderDoc7(props);
  if (section === 'doc8') return renderDoc8(props);
  if (section === 'doc9') return renderDoc9(props);
  if (section === 'doc10') return renderDoc10(props);
  return null;
}
