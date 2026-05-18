'use client';

import { useCallback, useState } from 'react';
import type {
  ApplyDocumentUpdate,
  InspectionPhotoAlbumContext,
  WithFileData,
} from '@/components/session/workspace/types';
import {
  assetUrlToFile,
  buildHazardFindingAutoFill,
  isFindingEmptyForAiAutofill,
} from '@/components/session/workspace/doc7Ai';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { Doc7FindingFields } from '@/features/inspection-session/workspace/sections/doc7/Doc7FindingFields';
import { Doc7FindingPhotoPanel } from '@/features/inspection-session/workspace/sections/doc7/Doc7FindingPhotoPanel';
import type {
  SafetyDoc7ReferenceMaterialCatalogItem,
  SafetyHazardCountermeasureCatalogItem,
} from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { PhotoAlbumItem } from '@/types/photos';
import type { CausativeAgentKey } from '@/types/siteOverview';

function selectValueForRiskLevel(stored: string): string {
  if (stored === '상' || stored === '중' || stored === '하') return stored;
  if (stored.includes('높음')) return '상';
  if (stored.includes('보통')) return '중';
  if (stored.includes('낮음')) return '하';
  return '';
}

interface Doc7FindingCardProps {
  applyDocumentUpdate: ApplyDocumentUpdate;
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  item: CurrentHazardFinding;
  index: number;
  photoAlbumContext?: InspectionPhotoAlbumContext | null;
  removable: boolean;
  withFileData: WithFileData;
}

export default function Doc7FindingCard({
  applyDocumentUpdate,
  doc7ReferenceMaterials,
  hazardCountermeasureCatalog,
  item,
  index,
  photoAlbumContext,
  removable,
  withFileData,
}: Doc7FindingCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  const updateFinding = useCallback(
    (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) =>
      applyDocumentUpdate('doc7', 'manual', (current) => ({
        ...current,
        document7Findings: current.document7Findings.map((finding) =>
          finding.id === item.id ? updater(finding) : finding,
        ),
      })),
    [applyDocumentUpdate, item.id],
  );

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
    const assetUrl = await withFileData(file);
    if (!assetUrl) return;

    if (slot === 1) {
      const isFirstSitePhoto = !item.photoUrl?.trim();
      const shouldRunAi = isFirstSitePhoto && isFindingEmptyForAiAutofill(item);

      updateFinding((finding) => ({ ...finding, photoUrl: assetUrl }));
      if (shouldRunAi) {
        await runAiAutofill(file);
      } else {
        setAiError('');
      }
      return;
    }

    updateFinding((finding) => ({ ...finding, photoUrl2: assetUrl }));
  };

  const handlePhotoAlbumSelect = async (slot: 1 | 2, albumItem: PhotoAlbumItem) => {
    const assetUrl = albumItem.originalUrl || albumItem.previewUrl;
    if (!assetUrl) return;

    if (slot === 1) {
      const isFirstSitePhoto = !item.photoUrl?.trim();
      const shouldRunAi = isFirstSitePhoto && isFindingEmptyForAiAutofill(item);

      updateFinding((finding) => ({ ...finding, photoUrl: assetUrl }));
      if (!shouldRunAi) {
        setAiError('');
        return;
      }

      try {
        const file = await assetUrlToFile(
          albumItem.previewUrl || albumItem.originalUrl,
          albumItem.fileName || `finding-${item.id}.jpg`,
        );
        await runAiAutofill(file);
      } catch (error) {
        setAiError(
          error instanceof Error
            ? error.message
            : 'AI 자동채움을 위해 사진을 다시 불러오지 못했습니다.',
        );
      }
      return;
    }

    updateFinding((finding) => ({ ...finding, photoUrl2: assetUrl }));
  };

  const handleAiRetry = async () => {
    if (!item.photoUrl) return;

    setAiError('');
    const file = await assetUrlToFile(item.photoUrl, `finding-${item.id}.jpg`);
    await runAiAutofill(file);
  };

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
          doc7ReferenceMaterials={doc7ReferenceMaterials}
          hazardCountermeasureCatalog={hazardCountermeasureCatalog}
          item={item}
          selectValueForRiskLevel={selectValueForRiskLevel}
          updateFinding={updateFinding}
          onAccidentTypeChange={(value) =>
            updateFinding((finding) => ({
              ...finding,
              accidentType: value,
            }))
          }
          onCausativeAgentChange={(value) =>
            updateFinding((finding) => ({
              ...finding,
              causativeAgentKey: value as CausativeAgentKey | '',
            }))
          }
        />
        <Doc7FindingPhotoPanel
          aiError={aiError}
          isAnalyzing={isAnalyzing}
          item={item}
          photoAlbumContext={photoAlbumContext}
          onAiRetry={handleAiRetry}
          onAlbumSelect={handlePhotoAlbumSelect}
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
