import { createFutureProcessRiskPlan } from '@/constants/inspectionSession';
import { FUTURE_PROCESS_LIBRARY } from '@/components/session/workspace/constants';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';

export default function Doc8Section({
  applyDocumentUpdate,
  session,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'session'>) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1행</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc8', 'manual', (current) => ({ ...current, document8Plans: [...current.document8Plans, createFutureProcessRiskPlan()] }))}>
          행 추가
        </button>
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
