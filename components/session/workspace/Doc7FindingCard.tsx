'use client';

import { useState } from 'react';
import type { ApplyDocumentUpdate, WithFileData } from '@/components/session/workspace/types';
import {
  buildHazardFindingAutoFill,
  dataUrlToFile,
  isFindingEmptyForAiAutofill,
} from '@/components/session/workspace/doc7Ai';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { Doc7FindingFields } from '@/features/inspection-session/workspace/sections/doc7/Doc7FindingFields';
import { Doc7FindingPhotoPanel } from '@/features/inspection-session/workspace/sections/doc7/Doc7FindingPhotoPanel';
import type { CurrentHazardFinding } from '@/types/inspectionSession';

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
        finding.id === item.id ? updater(finding) : finding,
      ),
    }));

  const applyLegalTitleInput = (raw: string) => {
    const reference = legalReferenceLibrary.find((library) => library.title === raw);

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
          : 'AI 초안을 만드는 중 문제가 발생했습니다.',
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
      return;
    }

    updateFinding((finding) => ({ ...finding, photoUrl2: dataUrl }));
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
        <div
          className={`${styles.doc7Eyebrow} ${
            removable ? styles.doc7EyebrowWithCardDelete : ''
          }`}
        >
          <span className={styles.cardEyebrow}>{`위험요인 ${index + 1}`}</span>
        </div>
        <Doc7FindingFields
          applyLegalTitleInput={applyLegalTitleInput}
          item={item}
          legalReferenceLibrary={legalReferenceLibrary}
          legalTitleListId={legalTitleListId}
          selectValueForRiskLevel={selectValueForRiskLevel}
          updateFinding={updateFinding}
        />
        <Doc7FindingPhotoPanel
          aiError={aiError}
          isAnalyzing={isAnalyzing}
          item={item}
          onAiRetry={handleAiRetry}
          onPhotoSelect={handlePhotoSelect}
          updateFinding={updateFinding}
        />
      </div>
      {removable ? (
        <button
          type="button"
          className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
          onClick={() =>
            applyDocumentUpdate('doc7', 'manual', (current) => ({
              ...current,
              document7Findings: current.document7Findings.filter(
                (finding) => finding.id !== item.id,
              ),
            }))
          }
        >
          삭제
        </button>
      ) : null}
    </article>
  );
}

