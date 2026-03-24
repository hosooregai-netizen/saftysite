'use client';

import { useState } from 'react';

import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
  RISK_TRI_LEVEL_OPTIONS,
} from '@/components/session/workspace/constants';
import type { ApplyDocumentUpdate, WithFileData } from '@/components/session/workspace/types';
import { buildHazardFindingAutoFill, dataUrlToFile, isFindingEmptyForAiAutofill } from '@/components/session/workspace/doc7Ai';
import { UploadBox } from '@/components/session/workspace/widgets';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

function selectValueForRiskLevel(stored: string): string {
  if (stored === '상' || stored === '중' || stored === '하') return stored;
  if (stored.includes('높음')) return '상';
  if (stored.includes('보통')) return '중';
  if (stored.includes('낮음')) return '하';
  return '';
}

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  const updateFinding = (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) =>
    applyDocumentUpdate('doc7', 'manual', (current) => ({
      ...current,
      document7Findings: current.document7Findings.map((finding) =>
        finding.id === item.id ? updater(finding) : finding
      ),
    }));

  const applyLegalTitleInput = (raw: string) => {
    const reference = legalReferenceLibrary.find((lib) => lib.title === raw);
    updateFinding((finding) => ({
      ...finding,
      legalReferenceTitle: raw,
      legalReferenceId: reference?.id ?? '',
      ...(reference
        ? {
            referenceMaterial1: reference.referenceMaterial1,
            referenceMaterial2: reference.referenceMaterial2,
          }
        : {}),
    }));
  };

  const runAiAutofill = async (file: File) => {
    setIsAnalyzing(true);
    setAiError('');
    try {
      const patch = await buildHazardFindingAutoFill(file);
      updateFinding((finding) => ({ ...finding, ...patch }));
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : 'AI 초안을 만드는 중 문제가 발생했습니다.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoSelect = async (slot: 1 | 2, file: File) => {
    const dataUrl = await withFileData(file);
    if (!dataUrl) return;
    if (slot === 1) {
      const isFirstSitePhoto = !item.photoUrl?.trim();
      const shouldRunAi = isFirstSitePhoto && isFindingEmptyForAiAutofill(item);
      updateFinding((finding) => ({ ...finding, photoUrl: dataUrl }));
      if (shouldRunAi) {
        await runAiAutofill(file);
      } else {
        setAiError('');
      }
    } else {
      updateFinding((finding) => ({ ...finding, photoUrl2: dataUrl }));
    }
  };

  const handleAiRetry = async () => {
    if (!item.photoUrl) return;
    setAiError('');
    const file = await dataUrlToFile(item.photoUrl, `finding-${item.id}.jpg`);
    await runAiAutofill(file);
  };

  const legalTitleListId = `doc7-legal-title-${item.id}`;

  return (
    <article className={`${styles.card} ${styles.doc4Card}`}>
      <div className={styles.doc7CardInner}>
        <div className={`${styles.doc7Eyebrow} ${removable ? styles.doc7EyebrowWithCardDelete : ''}`}>
          <span className={styles.cardEyebrow}>{`위험요인 ${index + 1}`}</span>
        </div>
        <div className={styles.doc7FormColumn}>
          <div className={styles.doc7FieldStack}>
            <div className={styles.doc7PairRow}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>유해·위험요인</span>
                <input
                  type="text"
                  className="app-input"
                  value={item.location}
                  onChange={(event) => updateFinding((finding) => ({ ...finding, location: event.target.value }))}
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
              <span className={styles.fieldLabel}>관계법령</span>
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
                    updateFinding((finding) => ({ ...finding, referenceMaterial1: event.target.value }))
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
                    updateFinding((finding) => ({ ...finding, referenceMaterial2: event.target.value }))
                  }
                />
              </label>
            </div>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                className="app-checkbox"
                checked={item.carryForward}
                onChange={(event) =>
                  updateFinding((finding) => ({ ...finding, carryForward: event.target.checked }))
                }
              />
              <span>이전 기술지도 후속조치 대상에 이관</span>
            </label>
          </div>
        </div>
        <div className={styles.doc7PhotoColumn}>
          <div className={styles.doc7ScenePhotoRow}>
            <UploadBox
              id={`finding-photo-1-${item.id}`}
              label="현장 사진 1"
              labelLayout="field"
              fieldClearOverlay
              value={item.photoUrl}
              onClear={() => updateFinding((finding) => ({ ...finding, photoUrl: '' }))}
              onSelect={async (file) => handlePhotoSelect(1, file)}
            />
            <UploadBox
              id={`finding-photo-2-${item.id}`}
              label="현장 사진 2"
              labelLayout="field"
              fieldClearOverlay
              value={item.photoUrl2 ?? ''}
              onClear={() => updateFinding((finding) => ({ ...finding, photoUrl2: '' }))}
              onSelect={async (file) => handlePhotoSelect(2, file)}
            />
          </div>
          {isAnalyzing ? (
            <p className={styles.fieldAssist}>
              사진을 분석해 위험장소, 위험도, 재해유형, 기인물, 개선대책 초안을 자동으로 채우는 중입니다.
            </p>
          ) : null}
          {aiError ? <p className={styles.fieldAssistError}>{aiError}</p> : null}
          <div className={styles.doc7AiActions}>
            {item.photoUrl ? (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleAiRetry()}
                disabled={isAnalyzing}
              >
                AI 다시 채우기
              </button>
            ) : null}
            {isAnalyzing ? <span className="app-chip">AI 초안 생성 중</span> : null}
          </div>
        </div>
      </div>
      {removable ? (
        <button
          type="button"
          className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
          onClick={() =>
            applyDocumentUpdate('doc7', 'manual', (current) => ({
              ...current,
              document7Findings: current.document7Findings.filter((finding) => finding.id !== item.id),
            }))
          }
        >
          삭제
        </button>
      ) : null}
    </article>
  );
}
