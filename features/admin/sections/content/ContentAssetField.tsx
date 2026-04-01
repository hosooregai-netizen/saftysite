'use client';
/* eslint-disable @next/next/no-img-element */

import { useId, useState } from 'react';
import {
  IMAGE_UPLOAD_LABEL_DESKTOP,
  IMAGE_UPLOAD_LABEL_MOBILE,
} from '@/constants/imageUploadLabels';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import { readFileAsDataUrl } from '@/features/admin/sections/content/lib/contentItems';

interface ContentAssetFieldProps {
  accept: string;
  disabled: boolean;
  fileName: string;
  helperText?: string;
  label: string;
  mode: 'image' | 'file';
  readOnly?: boolean;
  value: string;
  onChange: (payload: { fileName: string; value: string }) => void;
  onClear: () => void;
  resolveFile?: (file: File) => Promise<{ fileName?: string; value: string }>;
  validateFile?: (file: File) => string | null;
}

function isPdfSource(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith('data:application/pdf')) return true;
  const pathOnly = normalized.split(/[?#]/)[0] ?? normalized;
  return /\.pdf$/i.test(pathOnly);
}

export function ContentAssetField(props: ContentAssetFieldProps) {
  const {
    accept,
    disabled,
    fileName,
    helperText,
    label,
    mode,
    readOnly = false,
    value,
    onChange,
    onClear,
    resolveFile,
    validateFile,
  } = props;
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const supportsPdf = accept.includes('.pdf');
  const isImage = mode === 'image' && Boolean(value) && !isPdfSource(value);
  const isDisabled = disabled || isProcessing;

  return (
    <div className={styles.assetField}>
      <div className={styles.assetHeader}>
        <span className={styles.label}>{label}</span>
        {value && !readOnly ? (
          <button
            type="button"
            className={styles.assetClear}
            onClick={() => {
              setError(null);
              onClear();
            }}
            disabled={isDisabled}
          >
            선택 해제
          </button>
        ) : null}
      </div>
      <div className={styles.assetBox}>
        {value ? (
          isImage ? (
            <img src={value} alt={label} className={styles.assetPreviewImage} />
          ) : (
            <div className={styles.assetFilePreview}>
              <strong>{fileName || '연결된 파일'}</strong>
              <span>업로드한 파일이 연결되어 있습니다.</span>
            </div>
          )
        ) : (
          <div
            className={
              mode === 'image'
                ? `${styles.assetPlaceholder} ${styles.assetPlaceholderImage}`
                : styles.assetPlaceholder
            }
          >
            {mode === 'image' ? (
              <>
                <span className={styles.assetUploadLabelNarrow}>{IMAGE_UPLOAD_LABEL_MOBILE}</span>
                <span className={styles.assetUploadLabelWide}>{IMAGE_UPLOAD_LABEL_DESKTOP}</span>
              </>
            ) : (
              '파일을 업로드해 주세요.'
            )}
          </div>
        )}
      </div>
      {!readOnly ? (
        <>
          <div className={styles.assetActions}>
            <label htmlFor={inputId} className="app-button app-button-secondary">
              {isProcessing
                ? '업로드 중...'
                : value
                  ? '파일 변경'
                  : mode === 'image'
                    ? supportsPdf
                      ? 'PDF/이미지 업로드'
                      : '이미지 업로드'
                    : '파일 업로드'}
            </label>
          </div>
          <input
            id={inputId}
            type="file"
            accept={accept}
            className={styles.hiddenInput}
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;

              setError(null);
              const validationMessage = validateFile?.(file) ?? null;
              if (validationMessage) {
                setError(validationMessage);
                event.currentTarget.value = '';
                return;
              }

              setIsProcessing(true);
              const nextValue = resolveFile
                ? resolveFile(file)
                : readFileAsDataUrl(file).then((dataUrl) => ({
                    fileName: file.name,
                    value: dataUrl,
                  }));

              void nextValue
                .then((result) =>
                  onChange({ fileName: result.fileName || file.name, value: result.value }),
                )
                .catch((readError) =>
                  setError(
                    readError instanceof Error
                      ? readError.message
                      : '파일을 읽는 중 오류가 발생했습니다.',
                  ),
                )
                .finally(() => setIsProcessing(false));

              event.currentTarget.value = '';
            }}
          />
        </>
      ) : null}
      {helperText ? <p className={styles.modalHint}>{helperText}</p> : null}
      {error ? <p className={styles.modalError}>{error}</p> : null}
    </div>
  );
}
