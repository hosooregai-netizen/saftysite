'use client';

import { useRef, useState } from 'react';
import { checkCausativeAgents } from '@/lib/api';
import { normalizeCausativeAgentResponse } from '@/lib/normalizeCausativeAgentResponse';
import type { CausativeAgentReport } from '@/types/siteOverview';
import styles from './SiteOverviewUploadPanel.module.css';

interface SiteOverviewUploadPanelProps {
  onSuccess: (report: CausativeAgentReport) => void;
  onRawResponse: (raw: unknown) => void;
}

export default function SiteOverviewUploadPanel({
  onSuccess,
  onRawResponse,
}: SiteOverviewUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setImageFile = (incoming: File | undefined) => {
    if (!incoming) return;
    if (!incoming.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setFile(incoming);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0]);
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

    setImageFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('전경 사진을 먼저 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await checkCausativeAgents([file]);
      onRawResponse(raw);

      const normalized = await normalizeCausativeAgentResponse(raw, file);
      onSuccess(normalized);
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
        <h2 className="app-panel-title">전경 사진 등록</h2>
        <p className="app-panel-description">
          점검표 작성용 전경 이미지를 1건 등록하고 기인물 체크 결과를 불러옵니다.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />

      <div
        onClick={openPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={dropzoneClassName}
      >
        <div className={styles.dropzoneContent}>
          <p className={styles.dropzoneTitle}>전경 사진 등록</p>
          <p className={styles.dropzoneDescription}>
            파일을 끌어오거나 클릭하여 이미지 1건을 선택합니다.
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
          disabled={loading || !file}
          className="app-button app-button-accent"
        >
          {loading ? '판독 중...' : '업로드 및 판독'}
        </button>
        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setError(null);
            }}
            disabled={loading}
            className="app-button app-button-secondary"
          >
            선택 해제
          </button>
        )}
      </div>

      {file && (
        <div className={styles.filePanel}>
          <div className={styles.fileHeader}>등록 대상 파일</div>
          <div className={styles.fileBody}>
            선택된 파일: <span className={styles.fileNameStrong}>{file.name}</span>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
