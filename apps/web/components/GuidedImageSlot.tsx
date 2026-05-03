'use client';
/* eslint-disable @next/next/no-img-element */

import { useId, useRef } from 'react';
import styles from './GuidedUploadFlow.module.css';

interface GuidedImageSlotProps {
  fileName?: string;
  helper: string;
  label: string;
  onClear: () => void;
  onSelect: (file: File) => void;
  previewAlt: string;
  previewUrl: string;
  required?: boolean;
}

export function GuidedImageSlot({
  fileName,
  helper,
  label,
  onClear,
  onSelect,
  previewAlt,
  previewUrl,
  required = false,
}: GuidedImageSlotProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasPreview = Boolean(previewUrl);

  return (
    <article className={styles.slotCard}>
      <div className={styles.slotHeader}>
        <div className={styles.slotLabelRow}>
          <span className={styles.slotLabel}>{label}</span>
          {required ? <span className={styles.requiredMark}>필수</span> : null}
        </div>
        <span className={styles.slotHelper}>{helper}</span>
      </div>

      <div className={styles.slotBody}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              onSelect(file);
            }
            event.currentTarget.value = '';
          }}
        />

        {hasPreview ? (
          <button
            type="button"
            className={styles.slotPreviewButton}
            onClick={() => inputRef.current?.click()}
            aria-label={`${label} 이미지 교체`}
          >
            <img src={previewUrl} alt={previewAlt || label} />
            <span className={styles.slotPreviewOverlay}>교체</span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.slotPlaceholderButton}
            onClick={() => inputRef.current?.click()}
            aria-label={`${label} 이미지 첨부`}
          >
            <span className={styles.slotPlaceholderInner}>
              <span className={styles.slotPlaceholderTitle}>이미지 첨부</span>
              <span className={styles.slotPlaceholderHint}>사진 선택</span>
            </span>
          </button>
        )}
      </div>

      <div className={styles.slotFooter}>
        <span className={styles.slotState}>
          {hasPreview ? fileName || '첨부됨' : '미첨부'}
        </span>
        <div className={styles.slotActions}>
          <button
            type="button"
            className={styles.slotActionText}
            onClick={() => inputRef.current?.click()}
          >
            {hasPreview ? '교체' : '첨부'}
          </button>
          {hasPreview ? (
            <button type="button" className={styles.slotActionText} onClick={onClear}>
              삭제
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
