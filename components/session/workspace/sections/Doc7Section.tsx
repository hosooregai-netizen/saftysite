import { createCurrentHazardFinding } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import Doc7FindingCard from '@/components/session/workspace/Doc7FindingCard';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';

export default function Doc7Section(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, legalReferenceLibrary, session, withFileData } = props;

  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionToolbar}>
        <span className="app-chip">기본 1블록</span>
        <button type="button" className="app-button app-button-secondary" onClick={() => applyDocumentUpdate('doc7', 'manual', (current) => ({ ...current, document7Findings: [...current.document7Findings, createCurrentHazardFinding({ inspector: current.meta.drafter })] }))}>
          위험요인 추가
        </button>
      </div>
      {session.document7Findings.map((item, index) => (
        <Doc7FindingCard key={item.id} applyDocumentUpdate={applyDocumentUpdate} item={item} index={index} legalReferenceLibrary={legalReferenceLibrary} removable={session.document7Findings.length > 1} withFileData={withFileData} />
      ))}
    </div>
  );
}
