'use client';

import { useRef, useState } from 'react';
import type { HazardReportItem } from '@/types/hazard';
import { analyzeHazardPhotos } from '@/lib/api';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import styles from './HazardUploadPanel.module.css';

interface HazardUploadPanelProps {
  onSuccess: (reports: HazardReportItem[]) => void;
  onRawResponse: (raw: unknown) => void;
}

export default function HazardUploadPanel({
  onSuccess,
  onRawResponse,
}: HazardUploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setFiles((prev) => [...prev, ...imageFiles]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (loading) return;

    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('사진을 먼저 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await analyzeHazardPhotos(files);
      onRawResponse(raw);

      const reports = await normalizeHazardResponse(raw, files);
      onSuccess(reports);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => inputRef.current?.click();
  const dropzoneClassName = [
    styles.dropzone,
    loading ? styles.dropzoneDisabled : styles.dropzoneReady,
    dragActive ? styles.dropzoneActive : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <h2 className="app-panel-title">위험요인 사진 등록</h2>
        <p className="app-panel-description">
          여러 장의 현장 사진을 등록해 위험성평가 보고서 초안을 생성합니다.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        className={dropzoneClassName}
      >
        <div className={styles.dropzoneContent}>
          <p className={styles.dropzoneTitle}>사진 파일 등록</p>
          <p className={styles.dropzoneDescription}>
            이 영역에 파일을 끌어오거나 클릭하여 여러 장의 이미지를 선택합니다.
          </p>
        </div>
      </div>

      <div className={styles.actionBar}>
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className="app-button app-button-secondary"
        >
          사진 선택
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="app-button app-button-accent"
        >
          {loading ? '분석 중...' : '업로드 및 분석'}
        </button>
      </div>

      {files.length > 0 && (
        <div className={styles.filePanel}>
          <div className={styles.fileHeader}>
            등록 대기 파일 {files.length}건
          </div>
          <ul className={styles.fileList}>
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className={styles.fileItem}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className={styles.removeButton}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
