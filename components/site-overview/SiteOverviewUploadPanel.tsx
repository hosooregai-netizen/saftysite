'use client';

import { useState } from 'react';
import { IMAGE_UPLOAD_LABEL_DESKTOP, IMAGE_UPLOAD_LABEL_MOBILE } from '@/constants/imageUploadLabels';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import { checkCausativeAgents } from '@/lib/safetyApi/ai';
import { normalizeCausativeAgentResponse } from '@/lib/normalizeCausativeAgentResponse';
import type { CausativeAgentReport } from '@/types/siteOverview';
import styles from './SiteOverviewUploadPanel.module.css';

interface SiteOverviewUploadPanelProps {
  report: CausativeAgentReport;
  onSuccess: (report: CausativeAgentReport) => void;
  onClear: () => void;
  onRawResponse?: (raw: unknown) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function SiteOverviewUploadPanel({
  report,
  onSuccess,
  onClear,
  onRawResponse,
  onLoadingChange,
}: SiteOverviewUploadPanelProps) {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { galleryInputRef, cameraInputRef, requestPick, pickerModal } =
    useImageSourcePicker({ title: '현장 사진 추가' });

  const uploadFile = async (incoming: File | undefined) => {
    if (!incoming) return;
    if (!incoming.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    setError(null);

    try {
      const raw = await checkCausativeAgents([incoming]);
      onRawResponse?.(raw);

      const normalized = await normalizeCausativeAgentResponse(raw, incoming);
      onSuccess(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void uploadFile(e.target.files?.[0]);
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

    void uploadFile(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => {
    if (loading) return;
    requestPick();
  };
  const dropzoneClassName = [
    styles.dropzone,
    loading ? styles.dropzoneDisabled : styles.dropzoneReady,
    dragActive ? styles.dropzoneActive : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
        {report.photoUrl ? (
          <div className={styles.previewFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.photoUrl}
              alt="전경 사진 미리보기"
              className={styles.previewImage}
            />
            <button
              type="button"
              className={styles.removeButton}
              onClick={(event) => {
                event.stopPropagation();
                if (loading) return;
                onClear();
                setError(null);
              }}
            >
              삭제
            </button>
          </div>
        ) : (
          <div className={styles.dropzoneContent}>
            <p className={styles.dropzoneTitle}>
              {loading ? (
                '판독 중...'
              ) : (
                <>
                  <span className={styles.dropzoneLabelNarrow}>{IMAGE_UPLOAD_LABEL_MOBILE}</span>
                  <span className={styles.dropzoneLabelWide}>{IMAGE_UPLOAD_LABEL_DESKTOP}</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {pickerModal}
    </>
  );
}

