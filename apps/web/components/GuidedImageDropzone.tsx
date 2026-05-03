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
  helper: string;
  kinds?: Array<{ value: string; label: string }>;
  label: string;
  onDelete: (id: string) => void;
  onFilesSelected: (files: File[]) => void;
  onKindChange: (id: string, kind: string) => void;
  onRepresentativeChange: (id: string) => void;
}

export function GuidedImageDropzone({
  files,
  helper,
  kinds,
  label,
  onDelete,
  onFilesSelected,
  onKindChange,
  onRepresentativeChange,
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
        <div>
          <h3 className={styles.dropzoneTitle}>{label}</h3>
          <p className={styles.dropzoneHelper}>{helper}</p>
        </div>
        <span className={styles.dropzoneCount}>업로드 {files.length}건</span>
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
        <span className={styles.dropzoneBodyTitle}>여러 이미지를 한 번에 올리세요</span>
        <span className={styles.dropzoneBodyHint}>드래그해서 놓거나 클릭해서 다중 선택할 수 있습니다.</span>
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

              {kinds ? (
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
        <div className={styles.dropzoneEmptyNote}>아직 업로드된 이미지가 없습니다.</div>
      )}
    </section>
  );
}
