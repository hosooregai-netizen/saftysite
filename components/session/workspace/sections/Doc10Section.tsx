import { createMeasurementCheckItem } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';

export default function Doc10Section({
  applyDocumentUpdate,
  session,
}: Pick<HazardStatsSectionProps, 'applyDocumentUpdate' | 'session'>) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 3행</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc10', 'manual', (current) => ({ ...current, document10Measurements: [...current.document10Measurements, createMeasurementCheckItem()] }))}>
          행 추가
        </button>
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
