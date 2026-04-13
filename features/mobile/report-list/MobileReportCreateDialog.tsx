'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '../components/MobileShell.module.css';
import type { CreateMobileReportForm } from './types';

interface MobileReportCreateDialogProps {
  createError: string | null;
  createForm: CreateMobileReportForm;
  isCreatingReport: boolean;
  open: boolean;
  onChangeDate: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function MobileReportCreateDialog({
  createError,
  createForm,
  isCreatingReport,
  open,
  onChangeDate,
  onChangeTitle,
  onClose,
  onSubmit,
}: MobileReportCreateDialogProps) {
  return (
    <AppModal
      open={open}
      title="기술지도 보고서 추가"
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
            onClick={onSubmit}
            disabled={isCreatingReport || !createForm.reportDate || !createForm.reportTitle.trim()}
          >
            {isCreatingReport ? '추가 중...' : '추가'}
          </button>
        </>
      }
    >
      <div className={styles.filterRow}>
        <label className={styles.metaItem}>
          <span className={styles.metaLabel}>지도일</span>
          <input
            className="app-input"
            type="date"
            value={createForm.reportDate}
            onChange={(event) => onChangeDate(event.target.value)}
          />
        </label>
        <label className={styles.metaItem}>
          <span className={styles.metaLabel}>제목</span>
          <input
            className="app-input"
            value={createForm.reportTitle}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="예: 2026-04-09 보고서 3"
          />
        </label>
        {createError ? <p className={styles.errorNotice}>{createError}</p> : null}
      </div>
    </AppModal>
  );
}
