'use client';

import type { ChangeEvent, RefObject } from 'react';
import type { HazardReportItem } from '@/types/hazard';
import styles from '@/components/HazardReportTable.module.css';
import type { HazardReportTableText } from './shared';

interface HazardPhotoFieldProps {
  cameraInputRef: RefObject<HTMLInputElement | null>;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  index: number;
  isPhotoLoading: boolean;
  mergedText: Required<HazardReportTableText>;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  openPicker: () => void;
  photoGroupExtraContent?: React.ReactNode;
  photoMode: 'analyze' | 'upload' | 'readonly';
  report: HazardReportItem;
}

function renderPhotoBody({
  isPhotoLoading,
  mergedText,
  openPicker,
  onRemovePhoto,
  photoMode,
  report,
}: Omit<HazardPhotoFieldProps, 'cameraInputRef' | 'galleryInputRef' | 'index' | 'onPhotoChange' | 'photoGroupExtraContent'>) {
  if (report.photoUrl) {
    return (
      <div className={styles.photoPreviewWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={report.photoUrl} alt={mergedText.photoAlt} className={styles.photoPreview} />
        {photoMode !== 'readonly' ? (
          <div className={styles.photoActions}>
            <button type="button" onClick={openPicker} className={styles.photoAction} disabled={isPhotoLoading}>
              {mergedText.photoChangeLabel}
            </button>
            <button type="button" onClick={onRemovePhoto} className={styles.photoRemoveButton} disabled={isPhotoLoading}>
              {mergedText.photoRemoveLabel}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (photoMode === 'readonly') {
    return (
      <div className={styles.photoPlaceholder}>
        <span>{mergedText.photoEmptyHint}</span>
      </div>
    );
  }

  return (
    <button type="button" onClick={openPicker} className={`${styles.photoPlaceholder} ${styles.photoPlaceholderButton}`} disabled={isPhotoLoading}>
      <span>{mergedText.photoEmptyTitle}</span>
      <span className={styles.photoPlaceholderHint}>{mergedText.photoEmptyHint}</span>
    </button>
  );
}

export default function HazardPhotoField({
  cameraInputRef,
  galleryInputRef,
  index,
  isPhotoLoading,
  mergedText,
  onPhotoChange,
  onRemovePhoto,
  openPicker,
  photoGroupExtraContent,
  photoMode,
  report,
}: HazardPhotoFieldProps) {
  const photoColumn = (
    <div className={`${styles.formField} ${styles.photoColumn}`}>
      <label className={styles.fieldLabel} htmlFor={`hazard-photo-${index}`}>
        {mergedText.photoLabel}
      </label>
      <div className={styles.photoField}>
        {photoMode !== 'readonly' ? (
          <>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={onPhotoChange} className={styles.hiddenInput} id={`hazard-photo-gallery-${index}`} disabled={isPhotoLoading} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className={styles.hiddenInput} id={`hazard-photo-camera-${index}`} disabled={isPhotoLoading} />
          </>
        ) : null}
        {renderPhotoBody({
          isPhotoLoading,
          mergedText,
          openPicker,
          onRemovePhoto,
          photoMode,
          report,
        })}
      </div>
    </div>
  );

  if (!photoGroupExtraContent) return photoColumn;

  return (
    <div className={styles.photoGroupColumn}>
      <div className={styles.photoGroup}>
        {photoColumn}
        <div className={styles.photoGroupExtra}>{photoGroupExtraContent}</div>
      </div>
    </div>
  );
}
