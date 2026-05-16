'use client';

import { useMemo, useState, type FocusEvent } from 'react';
import AppModal from '@/components/ui/AppModal';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { ACCIDENT_TYPE_OPTIONS, CAUSATIVE_AGENT_LABELS, CAUSATIVE_AGENT_OPTIONS } from '@/constants/inspectionSession/doc7Catalog';
import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import { isImageValue } from '@/components/session/workspace/utils';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import styles from '@/features/mobile/components/MobileShell.module.css';
import {
  applyHazardCountermeasureSelectionToFinding,
  clearHazardCountermeasureSelectionFromFinding,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';
import {
  applyDoc7ReferenceMaterialSelection,
  buildDoc7ReferenceMaterialLabel,
  clearDoc7ReferenceMaterialSelection,
} from '@/lib/doc7ReferenceMaterials';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';
import { Doc7ReferenceMaterialPickerModal } from '@/features/inspection-session/workspace/sections/doc7/Doc7ReferenceMaterialPickerModal';

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

function buildReferenceDisplayLabel(
  finding: InspectionSessionDraft['document7Findings'][number],
  hasSelectedReference: boolean,
): string {
  const accidentType = finding.referenceCatalogAccidentType.trim();
  const causative = finding.referenceCatalogCausativeAgentKey.trim();

  if (!accidentType) {
    return hasSelectedReference ? '기존 참고자료' : '선택된 참고자료가 없습니다.';
  }

  return buildDoc7ReferenceMaterialLabel({
    accidentType,
    causativeAgentKey: causative || '일반',
  });
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hazardCountermeasureCatalog = screen.derivedData.hazardCountermeasureCatalog;
  const referenceImageValue = finding.referenceMaterialImage || finding.referenceMaterial1;
  const referenceDescriptionValue =
    finding.referenceMaterialDescription || finding.referenceMaterial2;
  const hasSelectedReference = Boolean(
    referenceImageValue.trim() || referenceDescriptionValue.trim(),
  );
  const referenceDisplayLabel = useMemo(
    () => buildReferenceDisplayLabel(finding, hasSelectedReference),
    [finding, hasSelectedReference],
  );

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
      onAlbumSelected: (albumItem) => updateFinding({ [key]: albumItem.originalUrl || albumItem.previewUrl }),
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
    <>
      <article style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>지적사항 {index + 1}</span>
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
                // eslint-disable-next-line @next/next/no-img-element
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
                // eslint-disable-next-line @next/next/no-img-element
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
            <span className={styles.mobileEditorFieldLabel}>재해위험요인</span>
            <textarea className={`app-input ${styles.mobileEditorTextareaCompact}`} value={finding.hazardDescription || ''} onChange={(event) => updateFinding({ hazardDescription: event.target.value })} placeholder="재해위험요인 설명" style={{ width: '100%' }} />
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
            <span className={styles.mobileEditorFieldLabel}>중점관리 위험요인 및 관리대책</span>
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
                placeholder="중점관리 위험요인 및 관리대책"
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
          <div className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>관련 중대재해 사례 및 예방대책</span>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setIsPickerOpen(true)}
              >
                참고자료 선택
              </button>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(215, 224, 235, 0.96)',
                  borderRadius: '10px',
                  background: '#fff',
                  color: hasSelectedReference ? '#0f172a' : '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'left',
                }}
                onClick={() => setIsPreviewOpen(true)}
                disabled={!hasSelectedReference}
              >
                {referenceDisplayLabel}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                disabled={!hasSelectedReference}
                onClick={() =>
                  updateFinding({
                    ...clearDoc7ReferenceMaterialSelection(finding),
                    referenceCatalogAccidentType: '',
                    referenceCatalogCausativeAgentKey: '',
                  })
                }
              >
                해제
              </button>
            </div>
          </div>
        </div>
      </article>

      <AppModal
        open={isPreviewOpen}
        title={hasSelectedReference ? referenceDisplayLabel : '표시할 참고자료가 없습니다.'}
        size="large"
        onClose={() => setIsPreviewOpen(false)}
        actions={
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => setIsPreviewOpen(false)}
          >
            닫기
          </button>
        }
      >
        <div className={workspaceStyles.doc7ReferencePreviewModal}>
          {referenceImageValue.trim() ? (
            isImageValue(referenceImageValue) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={referenceImageValue}
                alt={referenceDisplayLabel}
                className={workspaceStyles.doc7ReferencePreviewImage}
              />
            ) : (
              <div className={workspaceStyles.doc7ReferencePreviewText}>
                {referenceImageValue}
              </div>
            )
          ) : null}
          <div className={workspaceStyles.doc7ReferencePreviewText}>
            {referenceDescriptionValue || '표시할 참고자료가 없습니다.'}
          </div>
        </div>
      </AppModal>

      <Doc7ReferenceMaterialPickerModal
        items={screen.derivedData.doc7ReferenceMaterials}
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(referenceItem) =>
          updateFinding({
            ...applyDoc7ReferenceMaterialSelection(finding, referenceItem),
            referenceCatalogAccidentType: referenceItem.accidentType,
            referenceCatalogCausativeAgentKey: referenceItem.causativeAgentKey,
          })
        }
      />
    </>
  );
}
