'use client';

import { useState, type FocusEvent } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { ACCIDENT_TYPE_OPTIONS, CAUSATIVE_AGENT_LABELS, CAUSATIVE_AGENT_OPTIONS } from '@/constants/inspectionSession/doc7Catalog';
import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import styles from '@/features/mobile/components/MobileShell.module.css';
import {
  applyHazardCountermeasureSelectionToFinding,
  clearHazardCountermeasureSelectionFromFinding,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;
type Doc7MatchField = Extract<
  HazardCountermeasureCatalogMatchField,
  'expectedRisk' | 'countermeasure' | 'legalReference'
>;

interface MobileInspectionSessionStep7FindingCardProps {
  doc7AiError?: string;
  finding: InspectionSessionDraft['document7Findings'][number];
  index: number;
  isAiLoading: boolean;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  onRefill: (findingId: string, photoUrl: string) => Promise<void>;
  screen: InspectionScreenController;
}

export function MobileInspectionSessionStep7FindingCard({
  doc7AiError,
  finding,
  index,
  isAiLoading,
  openPhotoSourcePicker,
  onRefill,
  screen,
}: MobileInspectionSessionStep7FindingCardProps) {
  const [activeField, setActiveField] = useState<Doc7MatchField | null>(null);
  const hazardCountermeasureCatalog = screen.derivedData.hazardCountermeasureCatalog;
  const updateFinding = (patch: Partial<InspectionSessionDraft['document7Findings'][number]>) => {
    screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
      ...current,
      document7Findings: current.document7Findings.map((item) =>
        item.id === finding.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const openFindingPhotoPicker = (
    fieldLabel: string,
    key: 'photoUrl' | 'photoUrl2',
  ) =>
    openPhotoSourcePicker({
      fieldLabel,
      onAlbumSelected: (albumItem) => updateFinding({ [key]: albumItem.previewUrl }),
      onFileSelected: async (file) => {
        await screen.withFileData(file, (value) => updateFinding({ [key]: value }));
      },
    });

  const recommendations =
    activeField === null
      ? []
      : getHazardCountermeasureRecommendations(
          hazardCountermeasureCatalog,
          activeField === 'expectedRisk'
            ? finding.improvementRequest || finding.improvementPlan || ''
            : activeField === 'countermeasure'
              ? finding.emphasis
              : finding.legalReferenceTitle,
          activeField,
          { excludeId: finding.hazardCountermeasureItemId },
        );

  const handleBlur = (field: Doc7MatchField, event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveField((current) => (current === field ? null : current));
    }
  };

  const selectRecommendation = (
    item: InspectionScreenController['derivedData']['hazardCountermeasureCatalog'][number],
  ) => {
    updateFinding(applyHazardCountermeasureSelectionToFinding(finding, item));
    setActiveField(null);
  };

  const buildRecommendationLabel = (
    item: InspectionScreenController['derivedData']['hazardCountermeasureCatalog'][number],
    field: Doc7MatchField,
  ) => {
    const primary =
      getHazardCountermeasureFieldText(item, field).trim() ||
      item.title.trim() ||
      item.expectedRisk.trim() ||
      item.countermeasure.trim() ||
      item.legalReference.trim();
    const title = item.title.trim();
    return title && primary !== title ? `${primary} (${title})` : primary;
  };

  return (
    <article style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>지적 사항 {index + 1}</span>
          <button
            type="button"
            className={workspaceStyles.doc5SummaryDraftBtn}
            disabled={!finding.photoUrl || isAiLoading}
            onClick={() => void onRefill(finding.id, finding.photoUrl || '')}
          >
            {isAiLoading ? 'AI 채우는 중' : 'AI 다시 채우기'}
          </button>
        </div>
        <button
          type="button"
          className={styles.mobileEditorCardAction}
          onClick={() => {
            screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
              ...current,
              document7Findings: current.document7Findings.filter((item) => item.id !== finding.id),
            }));
          }}
        >
          삭제
        </button>
      </div>
      <div className={styles.mobileEditorFieldStack}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              flex: 1,
              height: '120px',
              backgroundColor: '#f8fafc',
              border: '1px solid rgba(215, 224, 235, 0.88)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => openFindingPhotoPicker('지적 사진 1', 'photoUrl')}
          >
            {finding.photoUrl ? (
              <img src={finding.photoUrl} alt="지적 사진 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                사진 1 추가
              </div>
            )}
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              height: '120px',
              backgroundColor: '#f8fafc',
              border: '1px solid rgba(215, 224, 235, 0.88)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => openFindingPhotoPicker('지적 사진 2', 'photoUrl2')}
          >
            {finding.photoUrl2 ? (
              <img src={finding.photoUrl2} alt="지적 사진 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                사진 2 추가
              </div>
            )}
          </button>
        </div>
        {doc7AiError ? <p className={styles.errorNotice} style={{ margin: 0 }}>{doc7AiError}</p> : null}
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>위치</span>
          <input className="app-input" value={finding.location} onChange={(event) => updateFinding({ location: event.target.value })} placeholder="위치 (예: A동 2층)" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          <div className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>사고유형</span>
            <select className="app-select" value={finding.accidentType} onChange={(event) => updateFinding({ accidentType: event.target.value })}>
              <option value="">선택</option>
              {ACCIDENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>위험도</span>
            <select className="app-select" value={finding.riskLevel} onChange={(event) => updateFinding({ riskLevel: event.target.value })}>
              {RISK_TRI_LEVEL_OPTIONS.map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>기인물</span>
          <select
            className="app-select"
            value={finding.causativeAgentKey}
            onChange={(event) => updateFinding({ causativeAgentKey: event.target.value as typeof finding.causativeAgentKey })}
          >
            <option value="">선택</option>
            {CAUSATIVE_AGENT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>유해위험요인</span>
          <textarea className={`app-input ${styles.mobileEditorTextareaCompact}`} value={finding.hazardDescription || ''} onChange={(event) => updateFinding({ hazardDescription: event.target.value })} placeholder="유해위험요인 설명" style={{ width: '100%' }} />
        </div>
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>개선요청사항</span>
          <div className={styles.mobileDoc8ProcessStack} onBlur={(event) => handleBlur('expectedRisk', event)}>
            <textarea
              className={`app-input ${styles.mobileEditorTextareaCompact}`}
              value={finding.improvementRequest || finding.improvementPlan || ''}
              onFocus={() => setActiveField('expectedRisk')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setActiveField((current) => (current === 'expectedRisk' ? null : current));
                }
              }}
              onChange={(event) =>
                updateFinding({
                  ...clearHazardCountermeasureSelectionFromFinding(finding),
                  improvementPlan: event.target.value,
                  improvementRequest: event.target.value,
                })
              }
              placeholder="개선요청사항"
              style={{ width: '100%' }}
            />
            {activeField === 'expectedRisk' && recommendations.length > 0 ? (
              <div
                id={`mobile-doc7-recommendations-${finding.id}-expectedRisk`}
                className={workspaceStyles.doc8RecommendationList}
                role="listbox"
                style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
              >
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className={workspaceStyles.doc8RecommendationButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectRecommendation(item)}
                  >
                    {buildRecommendationLabel(item, 'expectedRisk')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>중점관리 위험요인 및 관리방안</span>
          <div className={styles.mobileDoc8ProcessStack} onBlur={(event) => handleBlur('countermeasure', event)}>
            <textarea
              className={`app-input ${styles.mobileEditorTextareaCompact}`}
              value={finding.emphasis}
              onFocus={() => setActiveField('countermeasure')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setActiveField((current) => (current === 'countermeasure' ? null : current));
                }
              }}
              onChange={(event) =>
                updateFinding({
                  ...clearHazardCountermeasureSelectionFromFinding(finding),
                  emphasis: event.target.value,
                })
              }
              placeholder="중점관리 위험요인 및 관리방안"
              style={{ width: '100%' }}
            />
            {activeField === 'countermeasure' && recommendations.length > 0 ? (
              <div
                id={`mobile-doc7-recommendations-${finding.id}-countermeasure`}
                className={workspaceStyles.doc8RecommendationList}
                role="listbox"
                style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
              >
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className={workspaceStyles.doc8RecommendationButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectRecommendation(item)}
                  >
                    {buildRecommendationLabel(item, 'countermeasure')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>관련 법령</span>
          <div className={styles.mobileDoc8ProcessStack} onBlur={(event) => handleBlur('legalReference', event)}>
            <input
              className="app-input"
              value={finding.legalReferenceTitle}
              onFocus={() => setActiveField('legalReference')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setActiveField((current) => (current === 'legalReference' ? null : current));
                }
              }}
              onChange={(event) =>
                updateFinding({
                  ...clearHazardCountermeasureSelectionFromFinding(finding),
                  legalReferenceId: '',
                  legalReferenceTitle: event.target.value,
                  referenceLawTitles: event.target.value
                    .split(/[\n,]+/)
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                })
              }
              placeholder="관련 법령"
              style={{ width: '100%' }}
            />
            {activeField === 'legalReference' && recommendations.length > 0 ? (
              <div
                id={`mobile-doc7-recommendations-${finding.id}-legalReference`}
                className={workspaceStyles.doc8RecommendationList}
                role="listbox"
                style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
              >
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className={workspaceStyles.doc8RecommendationButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectRecommendation(item)}
                  >
                    {buildRecommendationLabel(item, 'legalReference')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
