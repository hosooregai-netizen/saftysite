'use client';
/* eslint-disable @next/next/no-img-element */

import { useId, useRef, useState } from 'react';
import styles from './GuidedUploadFlow.module.css';

export type GuidedUploadFileItem = {
  id: string;
  name: string;
  previewUrl: string;
  kind?: string;
  isRepresentative: boolean;
};

interface GuidedImageDropzoneProps {
  files: GuidedUploadFileItem[];
  emptyNote?: string;
  helper?: string;
  kinds?: Array<{ value: string; label: string }>;
  label: string;
  onDelete: (id: string) => void;
  onFilesSelected: (files: File[]) => void;
  onKindChange?: (id: string, kind: string) => void;
  onRepresentativeChange: (id: string) => void;
  uploadHint?: string;
  uploadTitle?: string;
}

export function GuidedImageDropzone({
  files,
  emptyNote,
  helper,
  kinds,
  label,
  onDelete,
  onFilesSelected,
  onKindChange,
  onRepresentativeChange,
  uploadHint,
  uploadTitle,
}: GuidedImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    onFilesSelected(Array.from(fileList));
  };

  return (
    <section className={styles.dropzoneCard}>
      <div className={styles.dropzoneHeader}>
        {label || helper ? (
          <div className={styles.dropzoneHeaderText}>
            {label ? <h3 className={styles.dropzoneTitle}>{label}</h3> : null}
            {helper ? <p className={styles.dropzoneHelper}>{helper}</p> : null}
          </div>
        ) : (
          <span />
        )}
        <span className={styles.dropzoneCount}>{files.length}장 첨부</span>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={(event) => {
          handleFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />

      <button
        type="button"
        className={`${styles.dropzoneBody} ${isDragging ? styles.dropzoneBodyActive : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <span className={styles.dropzoneBodyTitle}>{uploadTitle ?? '사진을 선택하거나 이곳에 끌어다 놓으세요.'}</span>
        <span className={styles.dropzoneBodyHint}>{uploadHint ?? 'JPG, PNG 파일을 여러 장 첨부할 수 있습니다.'}</span>
      </button>

      {files.length > 0 ? (
        <div className={styles.uploadedList}>
          {files.map((file, index) => (
            <article key={file.id} className={styles.uploadedItem}>
              <div className={styles.uploadedPreview}>
                <img src={file.previewUrl} alt={file.name} />
              </div>

              <div className={styles.uploadedMeta}>
                <strong>{file.name}</strong>
                <span>{file.isRepresentative ? '대표사진' : `업로드 이미지 ${index + 1}`}</span>
              </div>

              {kinds && onKindChange ? (
                <select
                  className={styles.uploadedSelect}
                  value={file.kind ?? ''}
                  onChange={(event) => onKindChange(file.id, event.target.value)}
                >
                  {kinds.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              ) : null}

              <div className={styles.uploadedActions}>
                <button
                  type="button"
                  className={styles.uploadedActionText}
                  onClick={() => onRepresentativeChange(file.id)}
                >
                  {file.isRepresentative ? '대표사진' : '대표 지정'}
                </button>
                <button
                  type="button"
                  className={styles.uploadedActionText}
                  onClick={() => onDelete(file.id)}
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.dropzoneEmptyNote}>{emptyNote ?? '아직 첨부된 사진이 없습니다.'}</div>
      )}
    </section>
  );
}
