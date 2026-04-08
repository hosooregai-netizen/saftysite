'use client';
/* eslint-disable @next/next/no-img-element */

import type { CSSProperties, ChangeEvent } from 'react';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { isImageValue } from '@/components/session/workspace/utils';
import {
  getSafetyAssetTransportWarning,
  resolveSafetyAssetUrl,
  shouldOpenSafetyAssetInNewTab,
  shouldUseSafetyAssetDownloadAttribute,
} from '@/lib/safetyApi/assetUrls';

interface UploadBoxProps {
  accept?: string;
  fileName?: string;
  fieldBodyHeight?: number;
  fieldClearOverlay?: boolean;
  fieldLabelMode?: 'show' | 'omit';
  fitImageToBox?: boolean;
  id: string;
  label: string;
  labelLayout?: 'panel' | 'field';
  mode?: 'image' | 'file';
  onClear?: () => void;
  onSelect: (file: File) => Promise<unknown> | void;
  value: string;
}

export function UploadBox({
  accept = 'image/*',
  fileName,
  fieldBodyHeight,
  fieldClearOverlay = false,
  fieldLabelMode = 'show',
  fitImageToBox = false,
  id,
  label,
  labelLayout = 'panel',
  mode = 'image',
  onClear,
  onSelect,
  value,
}: UploadBoxProps) {
  const resolvedValue = resolveSafetyAssetUrl(value);
  const hasValue = Boolean(resolvedValue);
  const isImage = mode === 'image' && isImageValue(resolvedValue);
  const { cameraInputRef, galleryInputRef, pickerModal, requestPick } = useImageSourcePicker({
    title: '사진 불러오기',
  });
  const shouldUseDownload = shouldUseSafetyAssetDownloadAttribute(resolvedValue);
  const shouldOpenInNewTab = shouldOpenSafetyAssetInNewTab(resolvedValue);
  const assetWarning = getSafetyAssetTransportWarning(resolvedValue, 'https:');

  const fieldBodyStyle: CSSProperties | undefined = fieldBodyHeight
    ? {
        height: `${fieldBodyHeight}px`,
        minHeight: `${fieldBodyHeight}px`,
        maxHeight: `${fieldBodyHeight}px`,
      }
    : undefined;
  const containViewportStyle: CSSProperties | undefined = fitImageToBox
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }
    : undefined;
  const containImageStyle: CSSProperties | undefined = fitImageToBox
    ? {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
      }
    : undefined;

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      void Promise.resolve(onSelect(file));
    }
    event.currentTarget.value = '';
  };

  const bodyInner =
    mode === 'image'
      ? hasValue
        ? isImage
          ? (
              <button
                type="button"
                className={styles.uploadPreviewHit}
                style={containViewportStyle}
                onClick={() => requestPick()}
                aria-label={`${label} 바꾸기`}
              >
                <img
                  src={resolvedValue}
                  alt={label}
                  className={styles.uploadPreview}
                  style={containImageStyle}
                />
              </button>
            )
          : (
              <label htmlFor={id} className={styles.uploadFileHit}>
                <div className={styles.filePreview}>
                  <strong className={styles.filePreviewTitle}>
                    {fileName || '업로드한 자료'}
                  </strong>
                  <p className={styles.filePreviewText}>자료 파일이 연결되어 있습니다.</p>
                  <a
                    href={resolvedValue}
                    download={shouldUseDownload ? fileName || 'material' : undefined}
                    target={shouldOpenInNewTab ? '_blank' : undefined}
                    rel={shouldOpenInNewTab ? 'noreferrer' : undefined}
                    className={styles.fileLink}
                    onClick={(event) => event.stopPropagation()}
                  >
                    파일 열기
                  </a>
                  {assetWarning ? <p className={styles.filePreviewText}>{assetWarning}</p> : null}
                </div>
              </label>
            )
        : (
            <button
              type="button"
              className={styles.uploadPlaceholder}
              style={containViewportStyle}
              onClick={() => requestPick()}
              aria-label={`${label} 선택`}
            >
              <span className={styles.uploadPrimaryLabel}>
                <span className={styles.uploadLabelNarrow}>{IMAGE_UPLOAD_LABEL_MOBILE}</span>
                <span className={styles.uploadLabelWide}>{IMAGE_UPLOAD_LABEL_DESKTOP}</span>
              </span>
            </button>
          )
      : hasValue
        ? (
            <label htmlFor={id} className={styles.uploadFileHit}>
              <div className={styles.filePreview}>
                <strong className={styles.filePreviewTitle}>
                  {fileName || '업로드한 자료'}
                </strong>
                <p className={styles.filePreviewText}>자료 파일이 연결되어 있습니다.</p>
                <a
                  href={resolvedValue}
                  download={shouldUseDownload ? fileName || 'material' : undefined}
                  target={shouldOpenInNewTab ? '_blank' : undefined}
                  rel={shouldOpenInNewTab ? 'noreferrer' : undefined}
                  className={styles.fileLink}
                  onClick={(event) => event.stopPropagation()}
                >
                  파일 열기
                </a>
                {assetWarning ? <p className={styles.filePreviewText}>{assetWarning}</p> : null}
              </div>
            </label>
          )
        : (
            <label htmlFor={id} className={styles.uploadPlaceholder}>
              <span>자료 파일 업로드</span>
              <span className={styles.uploadHint}>
                PDF, 이미지 등 자료 파일을 연결할 수 있습니다.
              </span>
            </label>
          );

  const fileInputs =
    mode === 'image' ? (
      <>
        <input
          ref={galleryInputRef}
          type="file"
          accept={accept}
          className={styles.hiddenInput}
          onChange={handleFileInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={handleFileInputChange}
        />
        {pickerModal}
      </>
    ) : (
      <input
        id={id}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
      />
    );

  if (labelLayout === 'field') {
    const clearInLabel = Boolean(hasValue && onClear && !fieldClearOverlay);
    const clearOverlay = Boolean(hasValue && onClear && fieldClearOverlay);

    return (
      <div className={styles.field}>
        {fieldLabelMode === 'show' ? (
          <div className={styles.uploadFieldLabelRow}>
            <span className={styles.fieldLabel}>{label}</span>
            {clearInLabel ? (
              <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
                삭제
              </button>
            ) : null}
          </div>
        ) : null}
        <div
          className={`${styles.uploadBody} ${styles.uploadBodyField} ${
            clearOverlay ? styles.uploadBodyFieldOverlayClear : ''
          }`}
          style={fieldBodyStyle}
        >
          {bodyInner}
          {clearOverlay ? (
            <button
              type="button"
              className={`${styles.inlineDangerButton} ${styles.uploadFieldClearOverlay}`}
              onClick={onClear}
            >
              삭제
            </button>
          ) : null}
        </div>
        {fileInputs}
      </div>
    );
  }

  return (
    <div className={styles.uploadBox}>
      <div className={styles.uploadHeader}>
        <span className={styles.uploadLabel}>{label}</span>
        {hasValue && onClear ? (
          <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
            삭제
          </button>
        ) : null}
      </div>
      <div className={styles.uploadBody}>{bodyInner}</div>
      {fileInputs}
    </div>
  );
}
