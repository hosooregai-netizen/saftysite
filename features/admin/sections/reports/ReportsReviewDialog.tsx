'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { Dispatch, SetStateAction } from 'react';
import type { ControllerQualityStatus, ControllerReportRow } from '@/types/admin';
import type { SafetyUser } from '@/types/backend';
import type { ReportReviewForm } from './reportsSectionTypes';

interface ReportsReviewDialogProps {
  onClose: () => void;
  onSave: () => void;
  reviewForm: ReportReviewForm;
  reviewRow: ControllerReportRow | null;
  setReviewForm: Dispatch<SetStateAction<ReportReviewForm>>;
  users: SafetyUser[];
}

export function ReportsReviewDialog({
  onClose,
  onSave,
  reviewForm,
  reviewRow,
  setReviewForm,
  users,
}: ReportsReviewDialogProps) {
  return (
    <AppModal
      open={Boolean(reviewRow)}
      title="보고서 품질 체크"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="app-button app-button-primary" onClick={onSave}>
            저장
          </button>
        </>
      }
    >
      <div className={styles.modalGrid}>
        <label className={styles.modalField}>
          <span className={styles.label}>품질 상태</span>
          <select
            className="app-select"
            value={reviewForm.qualityStatus}
            onChange={(event) =>
              setReviewForm((current) => ({
                ...current,
                qualityStatus: event.target.value as ControllerQualityStatus,
              }))
            }
          >
            <option value="unchecked">미확인</option>
            <option value="ok">확인완료</option>
            <option value="issue">이슈</option>
          </select>
        </label>
        <label className={styles.modalField}>
          <span className={styles.label}>담당자</span>
          <select
            className="app-select"
            value={reviewForm.ownerUserId}
            onChange={(event) =>
              setReviewForm((current) => ({
                ...current,
                ownerUserId: event.target.value,
              }))
            }
          >
            <option value="">선택</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.modalFieldWide}>
          <span className={styles.label}>메모</span>
          <textarea
            className="app-textarea"
            rows={4}
            value={reviewForm.note}
            onChange={(event) =>
              setReviewForm((current) => ({
                ...current,
                note: event.target.value,
              }))
            }
          />
        </label>
      </div>
    </AppModal>
  );
}
