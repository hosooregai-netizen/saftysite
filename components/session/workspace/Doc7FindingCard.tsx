'use client';

import { ACCIDENT_TYPE_OPTIONS, CAUSATIVE_AGENT_LABELS, RISK_SCALE_OPTIONS } from '@/components/session/workspace/constants';
import type { ApplyDocumentUpdate, WithFileData } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';
import { CAUSATIVE_AGENT_OPTIONS } from '@/components/session/workspace/constants';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

interface Doc7FindingCardProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  item: CurrentHazardFinding;
  index: number;
  legalReferenceLibrary: Array<{
    id: string;
    title: string;
    body: string;
    referenceMaterial1: string;
    referenceMaterial2: string;
  }>;
  removable: boolean;
  withFileData: WithFileData;
}

export default function Doc7FindingCard({
  applyDocumentUpdate,
  item,
  index,
  legalReferenceLibrary,
  removable,
  withFileData,
}: Doc7FindingCardProps) {
  const updateFinding = (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) =>
    applyDocumentUpdate('doc7', 'manual', (current) => ({
      ...current,
      document7Findings: current.document7Findings.map((finding) =>
        finding.id === item.id ? updater(finding) : finding
      ),
    }));

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div><div className={styles.cardEyebrow}>반복 카드</div><h3 className={styles.cardTitle}>{`위험요인 ${index + 1}`}</h3></div>
        {removable ? <button type="button" className="app-button app-button-danger" onClick={() => applyDocumentUpdate('doc7', 'manual', (current) => ({ ...current, document7Findings: current.document7Findings.filter((finding) => finding.id !== item.id) }))}>삭제</button> : null}
      </div>
      <div className={styles.findingGrid}>
        <UploadBox id={`finding-photo-${item.id}`} label="현장 사진" value={item.photoUrl} onClear={() => updateFinding((finding) => ({ ...finding, photoUrl: '' }))} onSelect={async (file) => withFileData(file, (dataUrl) => updateFinding((finding) => ({ ...finding, photoUrl: dataUrl })))} />
        <div className={styles.sectionStack}>
          <div className={styles.formGrid}>
            <label className={styles.field}><span className={styles.fieldLabel}>유해·위험장소</span><input type="text" className="app-input" value={item.location} onChange={(event) => updateFinding((finding) => ({ ...finding, location: event.target.value }))} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>가능성</span><select className="app-select" value={item.likelihood} onChange={(event) => updateFinding((finding) => ({ ...finding, likelihood: event.target.value, riskLevel: calculateRiskAssessmentResult(event.target.value, finding.severity) }))}>{RISK_SCALE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>중대성</span><select className="app-select" value={item.severity} onChange={(event) => updateFinding((finding) => ({ ...finding, severity: event.target.value, riskLevel: calculateRiskAssessmentResult(finding.likelihood, event.target.value) }))}>{RISK_SCALE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>위험도 결과</span><input type="text" className="app-input" value={item.riskLevel} readOnly /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>재해유형</span><select className="app-select" value={item.accidentType} onChange={(event) => updateFinding((finding) => ({ ...finding, accidentType: event.target.value }))}><option value="">선택</option>{ACCIDENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>기인물</span><select className="app-select" value={item.causativeAgentKey} onChange={(event) => updateFinding((finding) => ({ ...finding, causativeAgentKey: event.target.value as CausativeAgentKey | '' }))}><option value="">선택</option>{CAUSATIVE_AGENT_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.number}. {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>지도요원</span><input type="text" className="app-input" value={item.inspector} onChange={(event) => updateFinding((finding) => ({ ...finding, inspector: event.target.value }))} /></label>
          </div>
          <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>강조사항</span><textarea className="app-textarea" value={item.emphasis} onChange={(event) => updateFinding((finding) => ({ ...finding, emphasis: event.target.value }))} /></label>
            <label className={`${styles.field} ${styles.fieldWide}`}><span className={styles.fieldLabel}>개선대책</span><textarea className="app-textarea" value={item.improvementPlan} onChange={(event) => updateFinding((finding) => ({ ...finding, improvementPlan: event.target.value }))} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>관계법령 선택</span><select className="app-select" value={item.legalReferenceId} onChange={(event) => { const reference = legalReferenceLibrary.find((libraryItem) => libraryItem.id === event.target.value); updateFinding((finding) => ({ ...finding, legalReferenceId: event.target.value, legalReferenceTitle: reference?.title ?? '', referenceMaterial1: reference?.referenceMaterial1 ?? '', referenceMaterial2: reference?.referenceMaterial2 ?? '' })); }}><option value="">선택</option>{legalReferenceLibrary.map((libraryItem) => <option key={libraryItem.id} value={libraryItem.id}>{libraryItem.title}</option>)}</select></label>
            <label className={styles.field}><span className={styles.fieldLabel}>선택 법령</span><input type="text" className="app-input" value={item.legalReferenceTitle} readOnly /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>참고자료 1</span><input type="text" className="app-input" value={item.referenceMaterial1} onChange={(event) => updateFinding((finding) => ({ ...finding, referenceMaterial1: event.target.value }))} /></label>
            <label className={styles.field}><span className={styles.fieldLabel}>참고자료 2</span><input type="text" className="app-input" value={item.referenceMaterial2} onChange={(event) => updateFinding((finding) => ({ ...finding, referenceMaterial2: event.target.value }))} /></label>
            <label className={styles.checkboxField}><input type="checkbox" className="app-checkbox" checked={item.carryForward} onChange={(event) => updateFinding((finding) => ({ ...finding, carryForward: event.target.checked }))} /><span>이전 기술지도 후속조치 대상에 이관</span></label>
          </div>
        </div>
      </div>
    </article>
  );
}
