function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isLegacyMailAttachmentReport(reportKey: string) {
  return normalizeText(reportKey).startsWith('legacy:');
}

export function getMailAttachmentUnavailableReason(input: {
  originalPdfAvailable: boolean;
  reportKey: string;
}) {
  if (isLegacyMailAttachmentReport(input.reportKey) && !input.originalPdfAvailable) {
    return '등록된 원본 PDF가 없는 레거시 보고서는 메일에 첨부할 수 없습니다.';
  }
  return '';
}

export function isMailAttachmentReady(input: {
  originalPdfAvailable: boolean;
  reportKey: string;
}) {
  return !getMailAttachmentUnavailableReason(input);
}
