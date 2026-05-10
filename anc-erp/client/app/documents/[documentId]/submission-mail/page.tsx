import { DocumentPreview } from "../../../../components/document-preview";
import { ErpShell } from "../../../../components/erp-shell";
import { MailAttachmentList } from "../../../../components/mail-attachment-list";
import { MailSendChecklist } from "../../../../components/mail-send-checklist";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { SubmissionMailComposer } from "../../../../components/submission-mail-composer";
import { loadSubmissionMailComposerPageData } from "../../../../lib/mail-page-data";

type SubmissionMailPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SubmissionMailPage({ params }: SubmissionMailPageProps) {
  const { documentId } = await params;
  const pageData = await loadSubmissionMailComposerPageData(documentId);
  const attachments = pageData.draft.attachmentFileIds.map((fileId, index) => ({
    id: `mail-attachment-draft-${index + 1}`,
    messageId: pageData.draft.id,
    projectId: pageData.draft.projectId ?? "project-unlinked",
    fileName: fileId,
    mimeType: "application/octet-stream",
    sizeBytes: 0,
    savedFileId: fileId,
    linkedFileId: fileId,
    createdAt: pageData.draft.createdAt,
  }));
  return (
    <ErpShell title={`제출 메일 · ${documentId}`} subtitle="Document / Submission linked mail composer입니다.">
      <section className="dense-grid">
        <DocumentPreview
          title="제출 메일 검토 카드"
          statusLabel="Document Linked"
          statusTone="submitted"
          previewTitle={pageData.draft.subject || "제출 메일 제목"}
          rows={[
            { label: "documentId", status: documentId, note: "최종본 연결 확인" },
            { label: "수신자", status: `${pageData.draft.toAddresses.length}명`, note: "발주처 수신자 확인" },
            { label: "첨부", status: `${pageData.draft.attachmentFileIds.length}건`, note: "최종본 첨부 누락 여부 확인" },
          ]}
          noteBadges={["AI 초안", "제출 이력 연결"]}
        />
        <MissingFieldPanel
          title="제출 전 확인"
          items={[
            {
              label: "최종본 첨부",
              reason: pageData.draft.attachmentFileIds.length > 0 ? "최종본 파일이 draft에 연결되어 있습니다." : "최종본 첨부가 필요합니다.",
              severity: pageData.draft.attachmentFileIds.length > 0 ? "recommended" : "required",
            },
            {
              label: "수신자 검토",
              reason: pageData.draft.toAddresses.length > 0 ? "발주처 수신자가 설정되어 있습니다." : "수신자를 먼저 확인하세요.",
              severity: pageData.draft.toAddresses.length > 0 ? "recommended" : "required",
            },
          ]}
        />
      </section>
      <MailAttachmentList attachments={attachments} />
      {pageData.draft.id !== "mail-draft-empty" ? <MailSendChecklist draftId={pageData.draft.id} /> : null}
      <SubmissionMailComposer draft={pageData.draft} templates={pageData.templates} />
    </ErpShell>
  );
}
