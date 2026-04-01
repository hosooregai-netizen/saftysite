import { createCurrentHazardFinding } from '@/constants/inspectionSession';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import Doc7FindingCard from '@/components/session/workspace/Doc7FindingCard';
import type { HazardStatsSectionProps } from '@/components/session/workspace/types';

export default function Doc7Section(props: HazardStatsSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;

  const addFinding = () =>
    applyDocumentUpdate('doc7', 'manual', (current) => ({
      ...current,
      document7Findings: [...current.document7Findings, createCurrentHazardFinding({ inspector: current.meta.drafter })],
    }));

  return (
    <div className={`${styles.sectionStack} ${styles.doc4SectionStack}`}>
      {session.document7Findings.map((item, index) => (
        <Doc7FindingCard
          key={item.id}
          applyDocumentUpdate={applyDocumentUpdate}
          doc7ReferenceMaterials={props.doc7ReferenceMaterials}
          index={index}
          item={item}
          removable={session.document7Findings.length > 1}
          withFileData={withFileData}
        />
      ))}
      <div className={styles.doc7SectionAddFooter} role="region" aria-label="목록 하단에서 위험요인 추가">
        <button type="button" className={styles.doc7SectionAddFooterBtn} onClick={addFinding}>
          위험요인 추가
        </button>
      </div>
    </div>
  );
}

