'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/site-reports/components/SiteReportsScreen.module.css';
import type { CreateReportFormState } from './types';

interface SiteReportCreateDialogProps {
  createError: string | null;
  createForm: CreateReportFormState;
  handleCreateDateChange: (value: string) => void;
  handleCreateSubmit: () => Promise<void>;
  handleCreateTitleChange: (value: string) => void;
  isCreatingReport: boolean;
  open: boolean;
  onClose: () => void;
}

export function SiteReportCreateDialog({
  createError,
  createForm,
  handleCreateDateChange,
  handleCreateSubmit,
  handleCreateTitleChange,
  isCreatingReport,
  open,
  onClose,
}: SiteReportCreateDialogProps) {
  return (
    <AppModal
      open={open}
      title="기술지도 보고서 생성"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => void handleCreateSubmit()}
            disabled={isCreatingReport || !createForm.reportDate || !createForm.reportTitle.trim()}
          >
            생성
          </button>
        </>
      }
    >
      <div className={styles.createDialogBody}>
        <label className={styles.createDialogField}>
          <span className={styles.createDialogLabel}>지도일</span>
          <input
            className="app-input"
            type="date"
            value={createForm.reportDate}
            onChange={(event) => handleCreateDateChange(event.target.value)}
          />
        </label>

        <label className={styles.createDialogField}>
          <span className={styles.createDialogLabel}>제목</span>
          <input
            className="app-input"
            value={createForm.reportTitle}
            onChange={(event) => handleCreateTitleChange(event.target.value)}
            placeholder="예: 2026-04-01 보고서 3"
          />
        </label>

        {createError ? <p className={styles.createDialogError}>{createError}</p> : null}
      </div>
    </AppModal>
  );
}
