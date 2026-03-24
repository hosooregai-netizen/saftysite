'use client';
/* eslint-disable @next/next/no-img-element */

import { useId } from 'react';
import styles from './ControllerDashboard.module.css';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import { readFileAsDataUrl } from './contentItems';

interface ContentAssetFieldProps {
  accept: string;
  disabled: boolean;
  fileName: string;
  label: string;
  mode: 'image' | 'file';
  value: string;
  onChange: (payload: { dataUrl: string; fileName: string }) => void;
  onClear: () => void;
}

export default function ContentAssetField(props: ContentAssetFieldProps) {
  const { accept, disabled, fileName, label, mode, value, onChange, onClear } = props;
  const inputId = useId();
  const isImage = mode === 'image' && value.startsWith('data:image/');

  return (
    <div className={styles.assetField}>
      <div className={styles.assetHeader}>
        <span className={styles.label}>{label}</span>
        {value ? (
          <button type="button" className={styles.assetClear} onClick={onClear} disabled={disabled}>
            비우기
          </button>
        ) : null}
      </div>
      <div className={styles.assetBox}>
        {value ? (
          isImage ? (
            <img src={value} alt={label} className={styles.assetPreviewImage} />
          ) : (
            <div className={styles.assetFilePreview}>
              <strong>{fileName || '첨부 파일'}</strong>
              <span>업로드된 파일이 연결되어 있습니다.</span>
            </div>
          )
        ) : (
          <div
            className={
              mode === 'image' ? `${styles.assetPlaceholder} ${styles.assetPlaceholderImage}` : styles.assetPlaceholder
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
      <div className={styles.assetActions}>
        <label htmlFor={inputId} className="app-button app-button-secondary">
          {value ? '교체' : mode === 'image' ? '이미지 선택' : '파일 선택'}
        </label>
      </div>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        disabled={disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (!file) return;
          void readFileAsDataUrl(file).then((dataUrl) =>
            onChange({ dataUrl, fileName: file.name })
          );
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
