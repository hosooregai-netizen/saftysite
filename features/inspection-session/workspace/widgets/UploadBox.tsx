'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, type CSSProperties, type ChangeEvent } from 'react';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import type { InspectionPhotoAlbumContext } from '@/components/session/workspace/types';
import { PhotoAlbumPickerModal } from '@/features/photos/components/PhotoAlbumPickerModal';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { isImageValue } from '@/components/session/workspace/utils';
import {
  getSafetyAssetTransportWarning,
  resolveSafetyAssetUrl,
  shouldOpenSafetyAssetInNewTab,
  shouldUseSafetyAssetDownloadAttribute,
} from '@/lib/safetyApi/assetUrls';
import type { PhotoAlbumItem } from '@/types/photos';

interface UploadBoxProps {
  accept?: string;
  disabled?: boolean;
  enablePhotoAlbum?: boolean;
  fileName?: string;
  fieldBodyHeight?: number;
  fieldClearOverlay?: boolean;
  fieldLabelMode?: 'show' | 'omit';
  fitImageToBox?: boolean;
  id: string;
  label: string;
  labelLayout?: 'panel' | 'field';
  mode?: 'image' | 'file';
  onAlbumSelect?: (item: PhotoAlbumItem) => Promise<void> | void;
  onClear?: () => void;
  onSelect: (file: File) => Promise<unknown> | void;
  photoAlbumContext?: InspectionPhotoAlbumContext | null;
  value: string;
}

export function UploadBox({
  accept = 'image/*',
  disabled = false,
  enablePhotoAlbum = false,
  fileName,
  fieldBodyHeight,
  fieldClearOverlay = false,
  fieldLabelMode = 'show',
  fitImageToBox = false,
  id,
  label,
  labelLayout = 'panel',
  mode = 'image',
  onAlbumSelect,
  onClear,
  onSelect,
  photoAlbumContext,
  value,
}: UploadBoxProps) {
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const resolvedValue = resolveSafetyAssetUrl(value);
  const hasValue = Boolean(resolvedValue);
  const isImage = mode === 'image' && isImageValue(resolvedValue);
  const canUsePhotoAlbum = Boolean(
    mode === 'image' &&
      enablePhotoAlbum &&
      onAlbumSelect &&
      photoAlbumContext?.siteId &&
      !disabled,
  );
  const { cameraInputRef, galleryInputRef, pickerModal, requestPick } = useImageSourcePicker({
    enablePhotoAlbum: canUsePhotoAlbum,
    fileButtonLabel: '컴퓨터에서 업로드',
    onOpenPhotoAlbum: () => setIsAlbumPickerOpen(true),
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
    if (disabled) {
      event.currentTarget.value = '';
      return;
    }

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
                disabled={disabled}
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
              <div
                className={styles.uploadFileHit}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                onClick={() => {
                  if (!disabled) requestPick();
                }}
                onKeyDown={(event) => {
                  if (disabled) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    requestPick();
                  }
                }}
              >
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
              </div>
            )
        : (
            <button
              type="button"
              className={styles.uploadPlaceholder}
              style={containViewportStyle}
              disabled={disabled}
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
          disabled={disabled}
          onChange={handleFileInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          disabled={disabled}
          onChange={handleFileInputChange}
        />
        {pickerModal}
        {canUsePhotoAlbum && photoAlbumContext && onAlbumSelect ? (
          <PhotoAlbumPickerModal
            open={isAlbumPickerOpen}
            siteId={photoAlbumContext.siteId}
            onClose={() => setIsAlbumPickerOpen(false)}
            onSelect={onAlbumSelect}
          />
        ) : null}
      </>
    ) : (
      <input
        id={id}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        disabled={disabled}
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
