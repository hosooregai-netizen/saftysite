'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { CreateQuarterlyReportForm } from './types';

interface MobileQuarterlyCreateDialogProps {
  createDialogError: string | null;
  createForm: CreateQuarterlyReportForm;
  createQuarterSelection: string;
  isCreateDialogOpen: boolean;
  isCreateDisabled: boolean;
  isCreateRangeInvalid: boolean;
  isCreatingReport: boolean;
  onChangeField: (key: keyof CreateQuarterlyReportForm, value: string) => void;
  onChangeQuarter: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function MobileQuarterlyCreateDialog({
  createDialogError,
  createForm,
  createQuarterSelection,
  isCreateDialogOpen,
  isCreateDisabled,
  isCreateRangeInvalid,
  isCreatingReport,
  onChangeField,
  onChangeQuarter,
  onChangeTitle,
  onClose,
  onSubmit,
}: MobileQuarterlyCreateDialogProps) {
  return (
    <AppModal
      open={isCreateDialogOpen}
      title="분기 보고 만들기"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            닫기
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
      <div style={{ display: 'grid', gap: '12px' }}>
        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>제목</span>
          <input
            className="app-input"
            value={createForm.title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="예: 2026년 2분기 종합보고서"
          />
        </label>

        <label className={styles.mobileEditorFieldGroup}>
          <span className={styles.mobileEditorFieldLabel}>분기</span>
          <select
            className="app-select"
            value={createQuarterSelection}
            onChange={(event) => onChangeQuarter(event.target.value)}
          >
            <option value="1">1분기</option>
            <option value="2">2분기</option>
            <option value="3">3분기</option>
            <option value="4">4분기</option>
          </select>
        </label>

        <div
          style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
        >
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>시작일</span>
            <input
              type="date"
              className="app-input"
              value={createForm.periodStartDate}
              onChange={(event) => onChangeField('periodStartDate', event.target.value)}
            />
          </label>
          <label className={styles.mobileEditorFieldGroup}>
            <span className={styles.mobileEditorFieldLabel}>종료일</span>
            <input
              type="date"
              className="app-input"
              value={createForm.periodEndDate}
              onChange={(event) => onChangeField('periodEndDate', event.target.value)}
            />
          </label>
        </div>

        {isCreateRangeInvalid ? (
          <div className={styles.errorNotice}>종료일이 시작일보다 빠를 수 없습니다.</div>
        ) : null}
        {createDialogError ? <div className={styles.errorNotice}>{createDialogError}</div> : null}
      </div>
    </AppModal>
  );
}
