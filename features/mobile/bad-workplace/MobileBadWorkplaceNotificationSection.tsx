'use client';

import type { BadWorkplaceReport } from '@/types/erpReports';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { MobileBadWorkplaceEditableField } from './MobileBadWorkplaceEditableField';

interface MobileBadWorkplaceNotificationSectionProps {
  draft: BadWorkplaceReport;
  onUpdateDraft: (updater: (current: BadWorkplaceReport) => BadWorkplaceReport) => void;
}

export function MobileBadWorkplaceNotificationSection({
  draft,
  onUpdateDraft,
}: MobileBadWorkplaceNotificationSectionProps) {
  return (
    <section className={styles.mobileEditorCard}>
      <div className={styles.mobileImplementationListHeader}>
        <div className={styles.mobileImplementationListTitle}>3. 통보 정보</div>
      </div>

      <div className={styles.mobileImplementationFieldGrid}>
        <MobileBadWorkplaceEditableField
          label="개선 지시일"
          value={draft.guidanceDate}
          placeholder="YYYY-MM-DD"
          onChange={(value) => onUpdateDraft((current) => ({ ...current, guidanceDate: value }))}
        />
        <MobileBadWorkplaceEditableField
          label="이행 확인일"
          value={draft.confirmationDate}
          placeholder="YYYY-MM-DD"
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, confirmationDate: value }))
          }
        />
        <MobileBadWorkplaceEditableField
          label="담당 요원"
          value={draft.reporterName}
          onChange={(value) => onUpdateDraft((current) => ({ ...current, reporterName: value }))}
        />
        <MobileBadWorkplaceEditableField
          label="연락처"
          value={draft.assigneeContact}
          placeholder="연락처를 입력해 주세요."
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, assigneeContact: value }))
          }
        />
        <MobileBadWorkplaceEditableField
          label="통보일"
          value={draft.notificationDate}
          placeholder="YYYY-MM-DD"
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, notificationDate: value }))
          }
        />
        <MobileBadWorkplaceEditableField
          label="지방노동청(지청)"
          value={draft.recipientOfficeName}
          placeholder="관할 지방노동청(지청)을 입력해 주세요."
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, recipientOfficeName: value }))
          }
        />
        <MobileBadWorkplaceEditableField
          label="대리자"
          value={draft.agencyRepresentative}
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, agencyRepresentative: value }))
          }
        />
        <MobileBadWorkplaceEditableField
          label="첨부 서류"
          value={draft.attachmentDescription}
          onChange={(value) =>
            onUpdateDraft((current) => ({ ...current, attachmentDescription: value }))
          }
        />
      </div>
    </section>
  );
}
