'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { calculateRiskAssessmentResult } from '@/lib/riskAssessment';
import type { HazardReportItem } from '@/types/hazard';
import styles from '@/components/HazardReportTable.module.css';
import HazardPhotoField from './HazardPhotoField';
import {
  isHidden,
  isReadOnly,
  type HazardFieldKey,
  type HazardReportTableText,
} from './shared';

interface HazardReportContentProps {
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  data: HazardReportItem;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  handlePhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePhoto: () => void;
  hiddenFields?: Partial<Record<HazardFieldKey, boolean>>;
  implementationPeriodOptions?: Array<{ value: string; label?: string }>;
  index: number;
  isPhotoLoading: boolean;
  mergedText: Required<HazardReportTableText>;
  onChange: (patch: Partial<HazardReportItem>) => void;
  openPicker: () => void;
  photoError: string | null;
  photoGroupExtraContent?: React.ReactNode;
  photoMode: 'analyze' | 'upload' | 'readonly';
  pickerModal: React.ReactNode;
  readOnlyFields?: Partial<Record<HazardFieldKey, boolean>>;
  topGridExtraContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  extraContent?: React.ReactNode;
}

function joinClassNames(...values: unknown[]) {
  return values.filter(Boolean).join(' ');
}

export default function HazardReportContent({
  cameraInputRef,
  data,
  galleryInputRef,
  handlePhotoChange,
  handleRemovePhoto,
  hiddenFields,
  implementationPeriodOptions,
  index,
  isPhotoLoading,
  mergedText,
  onChange,
  openPicker,
  photoError,
  photoGroupExtraContent,
  photoMode,
  pickerModal,
  readOnlyFields,
  topGridExtraContent,
  headerActions,
  extraContent,
}: HazardReportContentProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { ref: hazardFactorsRef, resize: resizeHazard } = useAutoResizeTextarea(data.hazardFactors, 72);
  const { ref: improvementItemsRef, resize: resizeImprovement } = useAutoResizeTextarea(data.improvementItems, 72);
  const { ref: legalInfoRef, resize: resizeLegal } = useAutoResizeTextarea(data.legalInfo, 72);
  const riskAssessmentResult = calculateRiskAssessmentResult(data.likelihood, data.severity);
  const showsImplementationField = !isHidden(hiddenFields, 'implementationPeriod');

  const syncPhotoMaxHeight = useCallback(() => {
    const container = containerRef.current;
    const improvementTextarea = improvementItemsRef.current;
    if (!container || !improvementTextarea) return;
    container.style.setProperty(
      '--hazard-photo-max-height',
      `${Math.max(improvementTextarea.getBoundingClientRect().height, 120)}px`
    );
  }, [improvementItemsRef]);

  const syncBottomPairHeight = useCallback(() => {
    const hazardTextarea = hazardFactorsRef.current;
    const legalTextarea = legalInfoRef.current;
    if (!hazardTextarea || !legalTextarea) return;
    const nextHeight = Math.max(
      hazardTextarea.getBoundingClientRect().height,
      legalTextarea.getBoundingClientRect().height,
      120
    );
    hazardTextarea.style.height = `${nextHeight}px`;
    legalTextarea.style.height = `${nextHeight}px`;
  }, [hazardFactorsRef, legalInfoRef]);

  useLayoutEffect(() => {
    syncPhotoMaxHeight();
    syncBottomPairHeight();
  }, [data.hazardFactors, data.improvementItems, data.legalInfo, syncBottomPairHeight, syncPhotoMaxHeight]);

  return (
    <section ref={containerRef} className={styles.container}>
      {isPhotoLoading ? (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingPanel}>
            <div className={styles.loadingSpinner} aria-hidden="true" />
            <p className={styles.loadingTitle}>이미지를 분석하고 있습니다.</p>
          </div>
        </div>
      ) : null}

      <div className={joinClassNames(styles.contentShell, isPhotoLoading && styles.contentShellLoading)}>
        {photoError ? <p className={styles.photoError}>{photoError}</p> : null}
        <div className={styles.layout}>
        <div className={joinClassNames(styles.topGrid, topGridExtraContent && styles.topGridExtended)}>
          {headerActions ? <div className={styles.topGridActions}>{headerActions}</div> : null}
          <div className={`${styles.formField} ${styles.locationField}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-location-${index}`}>{mergedText.locationDetailLabel}</label>
            <input id={`hazard-location-${index}`} type="text" value={data.locationDetail} onChange={(event) => onChange({ locationDetail: event.target.value })} className="app-input" placeholder={mergedText.locationDetailPlaceholder} readOnly={isReadOnly(readOnlyFields, 'locationDetail')} />
          </div>
          {topGridExtraContent}
          <div className={`${styles.formField} ${styles.metricField}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-likelihood-${index}`}>{mergedText.likelihoodLabel}</label>
            <input id={`hazard-likelihood-${index}`} type="text" value={data.likelihood ?? ''} onChange={(event) => onChange({ likelihood: event.target.value })} className="app-input" placeholder={mergedText.likelihoodPlaceholder} readOnly={isReadOnly(readOnlyFields, 'likelihood')} />
          </div>
          <div className={`${styles.formField} ${styles.metricField}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-severity-${index}`}>{mergedText.severityLabel}</label>
            <input id={`hazard-severity-${index}`} type="text" value={data.severity ?? ''} onChange={(event) => onChange({ severity: event.target.value })} className="app-input" placeholder={mergedText.severityPlaceholder} readOnly={isReadOnly(readOnlyFields, 'severity')} />
          </div>
          <div className={`${styles.formField} ${styles.resultField}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-risk-result-${index}`}>{mergedText.riskAssessmentResultLabel}</label>
            <input id={`hazard-risk-result-${index}`} type="text" value={riskAssessmentResult} readOnly className="app-input" />
          </div>
        </div>

        <div className={joinClassNames(styles.pairedGrid, photoGroupExtraContent && styles.pairedGridWide)}>
          <HazardPhotoField
            cameraInputRef={cameraInputRef}
            galleryInputRef={galleryInputRef}
            index={index}
            isPhotoLoading={isPhotoLoading}
            mergedText={mergedText}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={handleRemovePhoto}
            openPicker={openPicker}
            photoGroupExtraContent={photoGroupExtraContent}
            photoMode={photoMode}
            report={data}
          />
          <div className={`${styles.formField} ${styles.textColumn}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-improvement-${index}`}>{mergedText.improvementItemsLabel}</label>
            <textarea id={`hazard-improvement-${index}`} ref={improvementItemsRef} value={data.improvementItems} onChange={(event) => { onChange({ improvementItems: event.target.value }); requestAnimationFrame(() => { resizeImprovement(); syncPhotoMaxHeight(); }); }} className={`app-textarea ${styles.editorTextarea}`} placeholder={mergedText.improvementItemsPlaceholder} rows={4} readOnly={isReadOnly(readOnlyFields, 'improvementItems')} />
          </div>
        </div>

        <div className={styles.pairedGrid}>
          <div className={`${styles.formField} ${styles.textColumn}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-factors-${index}`}>{mergedText.hazardFactorsLabel}</label>
            <textarea id={`hazard-factors-${index}`} ref={hazardFactorsRef} value={data.hazardFactors} onChange={(event) => { onChange({ hazardFactors: event.target.value }); requestAnimationFrame(() => { resizeHazard(); syncBottomPairHeight(); }); }} className={`app-textarea ${styles.editorTextarea}`} placeholder={mergedText.hazardFactorsPlaceholder} rows={4} readOnly={isReadOnly(readOnlyFields, 'hazardFactors')} />
          </div>
          <div className={`${styles.formField} ${styles.textColumn}`}>
            <label className={styles.fieldLabel} htmlFor={`hazard-legal-${index}`}>{mergedText.legalInfoLabel}</label>
            <textarea id={`hazard-legal-${index}`} ref={legalInfoRef} value={data.legalInfo} onChange={(event) => { onChange({ legalInfo: event.target.value }); requestAnimationFrame(() => { resizeLegal(); syncBottomPairHeight(); }); }} className={`app-textarea ${styles.editorTextarea}`} placeholder={mergedText.legalInfoPlaceholder} rows={4} readOnly={isReadOnly(readOnlyFields, 'legalInfo')} />
          </div>
        </div>

        {showsImplementationField ? (
          <div className={styles.footerField}>
            <label className={styles.fieldLabel} htmlFor={`hazard-period-${index}`}>{mergedText.implementationPeriodLabel}</label>
            {implementationPeriodOptions?.length ? (
              <select id={`hazard-period-${index}`} value={data.implementationPeriod} onChange={(event) => onChange({ implementationPeriod: event.target.value })} className="app-select" disabled={isReadOnly(readOnlyFields, 'implementationPeriod')}>
                {implementationPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                ))}
              </select>
            ) : (
              <input id={`hazard-period-${index}`} type="text" value={data.implementationPeriod} onChange={(event) => onChange({ implementationPeriod: event.target.value })} className="app-input" placeholder={mergedText.implementationPeriodPlaceholder} readOnly={isReadOnly(readOnlyFields, 'implementationPeriod')} />
            )}
          </div>
        ) : null}

          {extraContent}
        </div>
      </div>
      {pickerModal}
    </section>
  );
}
