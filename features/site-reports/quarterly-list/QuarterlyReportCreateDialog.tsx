'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '../components/SiteReportsScreen.module.css';
import type { CreateQuarterlyReportForm } from './types';

interface QuarterlyReportCreateDialogProps {
  createQuarterSelection: string;
  error: string | null;
  form: CreateQuarterlyReportForm;
  isBusy: boolean;
  isCreateDisabled: boolean;
  isCreatingReport: boolean;
  open: boolean;
  onChangePeriod: (field: 'periodStartDate' | 'periodEndDate', value: string) => void;
  onChangeQuarter: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function QuarterlyReportCreateDialog({
  createQuarterSelection,
  error,
  form,
  isBusy,
  isCreateDisabled,
  isCreatingReport,
  open,
  onChangePeriod,
  onChangeQuarter,
  onChangeTitle,
  onClose,
  onSubmit,
}: QuarterlyReportCreateDialogProps) {
  return (
    <AppModal
      open={open}
      title="분기 종합 보고서 생성"
      size="large"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            disabled={isBusy}
          >
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={onSubmit}
            disabled={isCreateDisabled}
          >
            {isCreatingReport ? '생성 중...' : '생성'}
          </button>
        </>
      }
    >
      <div className={styles.createDialogBody}>
        <label className={styles.createDialogField}>
          <span className={styles.createDialogLabel}>제목</span>
          <input
            className="app-input"
            value={form.title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="예: 2026년 2분기 종합보고서"
            disabled={isBusy}
          />
        </label>

        <div className={styles.createDialogPeriodGrid}>
          <label className={`${styles.createDialogField} ${styles.createDialogQuarterField}`}>
            <span className={styles.createDialogLabel}>분기</span>
            <select
              className="app-select"
              value={createQuarterSelection}
              onChange={(event) => onChangeQuarter(event.target.value)}
              disabled={isBusy}
              aria-label="분기"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </label>

          <label className={styles.createDialogField}>
            <span className={styles.createDialogLabel}>시작일</span>
            <input
              className="app-input"
              type="date"
              value={form.periodStartDate}
              onChange={(event) => onChangePeriod('periodStartDate', event.target.value)}
              disabled={isBusy}
            />
          </label>

          <label className={styles.createDialogField}>
            <span className={styles.createDialogLabel}>종료일</span>
            <input
              className="app-input"
              type="date"
              value={form.periodEndDate}
              onChange={(event) => onChangePeriod('periodEndDate', event.target.value)}
              disabled={isBusy}
            />
          </label>
        </div>

        {error ? <p className={styles.createDialogError}>{error}</p> : null}
      </div>
    </AppModal>
  );
}
