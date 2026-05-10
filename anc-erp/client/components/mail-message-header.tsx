import type { MailMessage } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function MailMessageHeader({ message }: { message: MailMessage }) {
  return (
    <div className="card-head">
      <div>
        <p className="card-eyebrow">Message</p>
        <h3 className="panel-title">{message.subject || "(제목 없음)"}</h3>
        <p className="muted">
          {message.fromAddress || "unknown"} → {message.toAddresses?.join(", ") || "recipient missing"}
        </p>
        <div className="mailbox-flag-list">
          <span className="pill outline">{message.projectId}</span>
          {message.documentId ? <span className="pill outline">document</span> : null}
          {message.submissionId ? <span className="pill outline">submission</span> : null}
        </div>
      </div>
      <StatusBadge tone={message.direction === "outbound" ? "success" : "info"} label={message.folder || "inbox"} />
    </div>
  );
}
