'use client';
/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from 'react';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { isImageValue } from '@/components/session/workspace/utils';

interface UploadBoxProps {
  accept?: string;
  fileName?: string;
  id: string;
  label: string;
  labelLayout?: 'panel' | 'field';
  fieldClearOverlay?: boolean;
  mode?: 'image' | 'file';
  onClear?: () => void;
  onSelect: (file: File) => Promise<unknown> | void;
  value: string;
}

export function UploadBox({
  accept = 'image/*',
  fileName,
  id,
  label,
  labelLayout = 'panel',
  fieldClearOverlay = false,
  mode = 'image',
  onClear,
  onSelect,
  value,
}: UploadBoxProps) {
  const hasValue = Boolean(value);
  const isImage = mode === 'image' && isImageValue(value);
  const { cameraInputRef, galleryInputRef, pickerModal, requestPick } = useImageSourcePicker({
    title: '사진 불러오기',
  });

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
                onClick={() => requestPick()}
                aria-label={`${label} 바꾸기`}
              >
                <img src={value} alt={label} className={styles.uploadPreview} />
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
                    href={value}
                    download={fileName || 'material'}
                    className={styles.fileLink}
                    onClick={(event) => event.stopPropagation()}
                  >
                    파일 열기
                  </a>
                </div>
              </label>
            )
        : (
            <button
              type="button"
              className={styles.uploadPlaceholder}
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
                  href={value}
                  download={fileName || 'material'}
                  className={styles.fileLink}
                  onClick={(event) => event.stopPropagation()}
                >
                  파일 열기
                </a>
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
        <div className={styles.uploadFieldLabelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          {clearInLabel ? (
            <button type="button" className={styles.inlineDangerButton} onClick={onClear}>
              삭제
            </button>
          ) : null}
        </div>
        <div
          className={`${styles.uploadBody} ${styles.uploadBodyField} ${
            clearOverlay ? styles.uploadBodyFieldOverlayClear : ''
          }`}
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

