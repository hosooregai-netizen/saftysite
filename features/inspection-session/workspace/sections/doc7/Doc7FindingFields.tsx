import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7FindingFieldsProps {
  applyLegalTitleInput: (raw: string) => void;
  item: CurrentHazardFinding;
  legalReferenceLibrary: Array<{
    id: string;
    title: string;
    body: string;
    referenceMaterial1: string;
    referenceMaterial2: string;
  }>;
  legalTitleListId: string;
  selectValueForRiskLevel: (stored: string) => string;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
}

export function Doc7FindingFields({
  applyLegalTitleInput,
  item,
  legalReferenceLibrary,
  legalTitleListId,
  selectValueForRiskLevel,
  updateFinding,
}: Doc7FindingFieldsProps) {
  return (
    <div className={styles.doc7FormColumn}>
      <div className={styles.doc7FieldStack}>
        <div className={styles.doc7PairRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>위치/위험요인</span>
            <input
              type="text"
              className="app-input"
              value={item.location}
              onChange={(event) =>
                updateFinding((finding) => ({ ...finding, location: event.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>위험도</span>
            <select
              className="app-select"
              value={selectValueForRiskLevel(item.riskLevel)}
              onChange={(event) =>
                updateFinding((finding) => ({ ...finding, riskLevel: event.target.value }))
              }
            >
              {RISK_TRI_LEVEL_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.doc7PairRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>기인물</span>
            <select
              className="app-select"
              value={item.causativeAgentKey}
              onChange={(event) =>
                updateFinding((finding) => ({
                  ...finding,
                  causativeAgentKey: event.target.value as CausativeAgentKey | '',
                }))
              }
            >
              <option value="">선택</option>
              {CAUSATIVE_AGENT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.number}. {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>재해유형</span>
            <select
              className="app-select"
              value={item.accidentType}
              onChange={(event) =>
                updateFinding((finding) => ({ ...finding, accidentType: event.target.value }))
              }
            >
              <option value="">선택</option>
              {ACCIDENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>강조사항</span>
          <textarea
            className="app-textarea"
            value={item.emphasis}
            onChange={(event) =>
              updateFinding((finding) => ({ ...finding, emphasis: event.target.value }))
            }
          />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>개선대책</span>
          <textarea
            className="app-textarea"
            value={item.improvementPlan}
            onChange={(event) =>
              updateFinding((finding) => ({ ...finding, improvementPlan: event.target.value }))
            }
          />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>관련법령</span>
          <input
            type="text"
            className="app-input"
            value={item.legalReferenceTitle}
            onChange={(event) => applyLegalTitleInput(event.target.value)}
            list={legalTitleListId}
            autoComplete="off"
          />
          <datalist id={legalTitleListId}>
            {legalReferenceLibrary.map((libraryItem) => (
              <option key={libraryItem.id} value={libraryItem.title} />
            ))}
          </datalist>
        </label>
        <div className={styles.doc7PairRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>참고자료 1</span>
            <input
              type="text"
              className="app-input"
              value={item.referenceMaterial1}
              onChange={(event) =>
                updateFinding((finding) => ({
                  ...finding,
                  referenceMaterial1: event.target.value,
                }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>참고자료 2</span>
            <input
              type="text"
              className="app-input"
              value={item.referenceMaterial2}
              onChange={(event) =>
                updateFinding((finding) => ({
                  ...finding,
                  referenceMaterial2: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

