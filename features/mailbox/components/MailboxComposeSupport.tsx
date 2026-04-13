import type { ChangeEvent, RefObject } from 'react';
import localStyles from './MailboxPanel.module.css';

export interface MailboxComposeAttachmentItem {
  file: File;
  id: string;
}

export interface MailboxComposeSelectedReport {
  headquarterName: string;
  recipientEmail: string;
  reportKey: string;
  reportTitle: string;
  siteName: string;
  visitDate: string | null;
}

interface MailboxComposeSupportProps {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  attachments: MailboxComposeAttachmentItem[];
  composeMode: 'new' | 'reply' | 'report';
  isDemoMode: boolean;
  isSendingMail: boolean;
  selectedReport: MailboxComposeSelectedReport | null;
  onAttachmentSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSelectedReport: () => void;
  onOpenReportPicker: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${size}B`;
}

export function MailboxComposeSupport({
  attachmentInputRef,
  attachments,
  composeMode,
  isDemoMode,
  isSendingMail,
  selectedReport,
  onAttachmentSelect,
  onClearSelectedReport,
  onOpenReportPicker,
  onRemoveAttachment,
}: MailboxComposeSupportProps) {
  return (
    <div className={localStyles.composeSupportArea}>
      <div className={localStyles.composeSupportActions}>
        <button
          type="button"
          className={localStyles.toolbarButton}
          onClick={() => attachmentInputRef.current?.click()}
        >
          파일 첨부
        </button>
        <button
          type="button"
          className={`${localStyles.toolbarButton} ${localStyles.reportPickerButton}`}
          onClick={onOpenReportPicker}
        >
          보고서 선택하기
        </button>
        <input ref={attachmentInputRef} type="file" multiple hidden onChange={onAttachmentSelect} />
      </div>

      {composeMode === 'report' && selectedReport ? (
        <div className={localStyles.composeSupportBlock}>
          <span className={localStyles.fieldLabel}>선택 보고서</span>
          <div className={localStyles.reportSelectionCard}>
            <div className={localStyles.reportSelectionMain}>
              <strong className={localStyles.reportSelectionTitle}>
                {selectedReport.reportTitle || selectedReport.reportKey}
              </strong>
              <span className={localStyles.accountMeta}>
                {selectedReport.siteName || '-'}
                {selectedReport.headquarterName ? ` · ${selectedReport.headquarterName}` : ''}
                {selectedReport.visitDate ? ` · ${selectedReport.visitDate}` : ''}
              </span>
              <span className={localStyles.accountMeta}>
                기본 수신자 {selectedReport.recipientEmail || '미등록'}
              </span>
              <span className={localStyles.accountMeta}>발송 시 선택한 보고서 PDF가 자동으로 첨부됩니다.</span>
            </div>
            <button
              type="button"
              className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
              onClick={onClearSelectedReport}
              disabled={isSendingMail}
            >
              선택 해제
            </button>
          </div>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className={localStyles.composeSupportBlock}>
          <span className={localStyles.fieldLabel}>첨부 파일</span>
          <div className={localStyles.attachmentList}>
            {attachments.map((attachment) => (
              <div key={attachment.id} className={localStyles.attachmentChip}>
                <span>
                  {attachment.file.name} · {formatFileSize(attachment.file.size)}
                </span>
                <button
                  type="button"
                  className={localStyles.recipientChipRemove}
                  onClick={() => onRemoveAttachment(attachment.id)}
                  aria-label={`${attachment.file.name} 제거`}
                  disabled={isSendingMail}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isDemoMode ? (
        <div className={localStyles.composeSupportBlock}>
          <span className={localStyles.fieldLabel}>시연 안내</span>
          <span className={localStyles.accountMeta}>
            데모 메일함에서는 작성 화면만 시연하며 실제 발송과 첨부 업로드는 실행되지 않습니다.
          </span>
        </div>
      ) : null}
    </div>
  );
}
