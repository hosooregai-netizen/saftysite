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
  const isImage = mode === 'image' && Boolean(value);
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
            鍮꾩슦湲?
          </button>
        ) : null}
      </div>
      <div className={styles.assetBox}>
        {value ? (
          isImage ? (
            <img src={value} alt={label} className={styles.assetPreviewImage} />
          ) : (
            <div className={styles.assetFilePreview}>
              <strong>{fileName || '泥⑤? ?뚯씪'}</strong>
              <span>?낅줈?쒕맂 ?뚯씪???곌껐?섏뼱 ?덉뒿?덈떎.</span>
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
              '?뚯씪???낅줈?쒗빐 二쇱꽭??'
            )}
          </div>
        )}
      </div>
      {!readOnly ? (
        <>
          <div className={styles.assetActions}>
            <label htmlFor={inputId} className="app-button app-button-secondary">
              {isProcessing
                ? '?낅줈??以?..'
                : value
                  ? '援먯껜'
                  : mode === 'image'
                    ? '?대?吏 ?좏깮'
                    : '?뚯씪 ?좏깮'}
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
                      : '?뚯씪???쎈뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.',
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
