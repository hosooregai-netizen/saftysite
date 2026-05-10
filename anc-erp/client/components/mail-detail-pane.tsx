import type { MailMessageDetailResponse } from "../../packages/contracts/src";
import { MailAttachmentSavePanel } from "./mail-attachment-save-panel";
import { MailBodyViewer } from "./mail-body-viewer";
import { MailEntityLinker } from "./mail-entity-linker";
import { MailMessageHeader } from "./mail-message-header";
import { MissingFieldPanel } from "./missing-field-panel";
import { MailProjectLinker } from "./mail-project-linker";

export function MailDetailPane({ detail }: { detail: MailMessageDetailResponse | null }) {
  if (!detail) {
    return (
      <section className="panel">
        <p className="empty-state">선택된 메일이 없습니다.</p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <MailMessageHeader message={detail.message} />
      </section>
      <MissingFieldPanel
        title="메일 작업 체크포인트"
        items={[
          {
            label: "프로젝트/문서 연결",
            reason: detail.links.length > 0 ? "현재 메일은 ERP 엔티티와 연결되어 있습니다." : "미분류 메일이면 프로젝트/문서/지적사항 연결을 먼저 확인하세요.",
            severity: detail.links.length > 0 ? "recommended" : "required",
          },
          {
            label: "첨부 저장",
            reason: detail.attachments.some((item) => !item.savedFileId) ? "미저장 첨부가 있습니다. 웹하드 저장 후 증빙 추적을 유지하세요." : "첨부 저장 상태가 양호합니다.",
            severity: detail.attachments.some((item) => !item.savedFileId) ? "required" : "recommended",
          },
        ]}
      />
      <MailBodyViewer body={detail.message.bodyText} />
      <MailAttachmentSavePanel attachments={detail.attachments} projectId={detail.message.projectId} />
      <section className="dense-grid">
        <MailProjectLinker projectId={detail.message.projectId} />
        <MailEntityLinker messageId={detail.message.id} projectId={detail.message.projectId} />
      </section>
    </>
  );
}
