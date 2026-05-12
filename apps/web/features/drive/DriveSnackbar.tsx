'use client';

import { useEffect } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import { formatSize } from '@/lib/webhard/drivePreview';
import type { DriveUploadBatchSummary, DriveUploadQueueItem } from '@/features/drive/types';

export function DriveSnackbar({
  lastUploadBatch,
  message,
  onClose,
  onUndoLastUpload,
  tone = 'notice',
  uploadQueue,
}: {
  lastUploadBatch?: DriveUploadBatchSummary | null;
  message: string;
  onClose: () => void;
  onUndoLastUpload?: () => void;
  tone?: 'error' | 'notice';
  uploadQueue?: DriveUploadQueueItem[];
}) {
  useEffect(() => {
    if (!message && !lastUploadBatch) return;
    const timeout = window.setTimeout(onClose, tone === 'error' ? 5000 : 3200);
    return () => window.clearTimeout(timeout);
  }, [lastUploadBatch, message, onClose, tone]);

  const isUploading = Boolean(uploadQueue && uploadQueue.some((row) => row.status === 'queued' || row.status === 'processing'));
  const hasUploadPanel = isUploading || Boolean(lastUploadBatch);

  if (!message && !hasUploadPanel) {
    return null;
  }

  return (
    <div className={styles.snackbarStack}>
      {hasUploadPanel ? (
        <div className={`${styles.uploadSnackbar} ${styles.snackbarNotice}`} role="status" aria-live="polite">
          <div className={styles.uploadSnackbarHeader}>
            <strong>{isUploading ? '업로드 중' : '업로드 완료'}</strong>
            <button type="button" className={styles.snackbarClose} aria-label="업로드 상태 닫기" onClick={onClose}>
              <DriveIcon name="close" size={16} />
            </button>
          </div>
          {isUploading && uploadQueue?.length ? (
            <div className={styles.uploadQueueList}>
              {uploadQueue.map((row) => (
                <div key={row.id} className={styles.uploadQueueItem}>
                  <div className={styles.uploadQueueMeta}>
                    <span className={styles.uploadQueueName}>{row.fileName}</span>
                    <span className={styles.uploadQueueStatus}>
                      {row.status === 'failed' ? '실패' : row.status === 'done' ? '완료' : `${row.progress}%`} · {formatSize(row.sizeBytes)}
                    </span>
                  </div>
                  <div className={styles.uploadQueueBar}>
                    <span className={styles.uploadQueueBarFill} style={{ width: `${row.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : lastUploadBatch ? (
            <div className={styles.uploadSummaryRow}>
              <span>{lastUploadBatch.count}개 파일을 업로드했습니다.</span>
              {onUndoLastUpload ? (
                <button type="button" className={styles.snackbarUndoButton} onClick={onUndoLastUpload}>
                  실행 취소
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div className={`${styles.snackbar} ${tone === 'error' ? styles.snackbarError : styles.snackbarNotice}`} role="status" aria-live="polite">
          <span>{message}</span>
          <button type="button" className={styles.snackbarClose} aria-label="알림 닫기" onClick={onClose}>
            <DriveIcon name="close" size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
