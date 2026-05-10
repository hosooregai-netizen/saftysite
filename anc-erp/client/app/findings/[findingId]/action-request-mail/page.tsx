import { ActionRequestMailComposer } from "../../../../components/action-request-mail-composer";
import { FindingMailTable } from "../../../../components/finding-mail-table";
import { MailAttachmentList } from "../../../../components/mail-attachment-list";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { ErpShell } from "../../../../components/erp-shell";
import { loadActionRequestMailComposerPageData } from "../../../../lib/mail-page-data";

type ActionRequestMailPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function ActionRequestMailPage({ params }: ActionRequestMailPageProps) {
  const { findingId } = await params;
  const pageData = await loadActionRequestMailComposerPageData(findingId);
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
    <ErpShell title={`조치 요청 메일 · ${findingId}`} subtitle="Finding linked mail composer입니다.">
      <MissingFieldPanel
        title="조치 요청 메일 검토"
        items={[
          {
            label: "Finding linkage",
            reason: `현재 draft는 ${pageData.draft.findingIds.length}건의 지적사항과 연결되어 있습니다.`,
            severity: pageData.draft.findingIds.length > 0 ? "recommended" : "required",
          },
          {
            label: "시공사 수신자",
            reason: pageData.draft.toAddresses.length > 0 ? "시공사 담당자 수신자가 설정되어 있습니다." : "시공사 담당자를 먼저 확인하세요.",
            severity: pageData.draft.toAddresses.length > 0 ? "recommended" : "required",
          },
        ]}
      />
      <FindingMailTable findingIds={pageData.draft.findingIds} />
      <MailAttachmentList attachments={attachments} />
      <ActionRequestMailComposer draft={pageData.draft} templates={pageData.templates} />
    </ErpShell>
  );
}
