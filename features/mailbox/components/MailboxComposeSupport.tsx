import localStyles from './MailboxPanel.module.css';

export interface MailboxComposeAttachmentItem {
  file: File;
  id: string;
}

export interface MailboxComposeSelectedReport {
  attachmentReady: boolean;
  attachmentUnavailableReason: string;
  headquarterName: string;
  originalPdfAvailable: boolean;
  recipientEmail: string;
  reportKey: string;
  reportTitle: string;
  siteName: string;
  visitDate: string | null;
  visitRound?: number | null;
}

interface MailboxComposeSupportProps {
  attachments: MailboxComposeAttachmentItem[];
  composeMode: 'new' | 'reply' | 'report';
  isDemoMode: boolean;
  isSendingMail: boolean;
  selectedReport: MailboxComposeSelectedReport | null;
  selectedReports: MailboxComposeSelectedReport[];
  onClearSelectedReport: () => void;
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
  attachments,
  composeMode,
  isDemoMode,
  isSendingMail,
  selectedReport,
  selectedReports,
  onClearSelectedReport,
  onRemoveAttachment,
}: MailboxComposeSupportProps) {
  const reportItems = selectedReports.length > 0 ? selectedReports : selectedReport ? [selectedReport] : [];
  const shouldRender =
    (composeMode === 'report' && reportItems.length > 0) ||
    attachments.length > 0 ||
    isDemoMode;

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={localStyles.composeSupportArea}>
      {composeMode === 'report' && reportItems.length > 0 ? (
        <div className={localStyles.composeSupportBlock}>
          <div className={localStyles.detailInfoRow}>
            <span className={localStyles.fieldLabel}>선택 보고서 {reportItems.length}건</span>
            <button
              type="button"
              className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
              onClick={onClearSelectedReport}
              disabled={isSendingMail}
            >
              전체 해제
            </button>
          </div>
          {reportItems.map((report) => (
            <div key={report.reportKey} className={localStyles.reportSelectionCard}>
              <div className={localStyles.reportSelectionMain}>
                <strong className={localStyles.reportSelectionTitle}>
                  {report.reportTitle || report.reportKey}
                </strong>
                <span className={localStyles.accountMeta}>
                  {report.siteName || '-'}
                  {report.headquarterName ? ` / ${report.headquarterName}` : ''}
                  {report.visitDate ? ` / ${report.visitDate}` : ''}
                  {report.visitRound ? ` / ${report.visitRound}회차` : ''}
                </span>
                <span className={localStyles.accountMeta}>
                  기본 수신자: {report.recipientEmail || '미등록'}
                </span>
                {report.originalPdfAvailable ? (
                  <span className={localStyles.accountMeta}>등록된 원본 PDF를 우선 첨부합니다.</span>
                ) : null}
                {!report.attachmentReady && report.attachmentUnavailableReason ? (
                  <span className={localStyles.accountMeta}>{report.attachmentUnavailableReason}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className={localStyles.composeSupportBlock}>
          <span className={localStyles.fieldLabel}>추가 첨부 파일</span>
          <div className={localStyles.attachmentList}>
            {attachments.map((attachment) => (
              <div key={attachment.id} className={localStyles.attachmentChip}>
                <span>
                  {attachment.file.name} / {formatFileSize(attachment.file.size)}
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
            데모 메일함에서는 작성 화면만 시연하며 실제 발송과 첨부 업로드는 실행하지 않습니다.
          </span>
        </div>
      ) : null}
    </div>
  );
}
