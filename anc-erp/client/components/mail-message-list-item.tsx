import type { MailMessage } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function MailMessageListItem({ message }: { message: MailMessage }) {
  return (
    <article className={`mini-card mailbox-message-item ${message.isRead ? "is-read" : "is-unread"}`}>
      <div className="utility-row" style={{ justifyContent: "space-between" }}>
        <strong>{message.subject || "(제목 없음)"}</strong>
        <StatusBadge tone={message.isRead ? "neutral" : "info"} label={message.folder || "inbox"} />
      </div>
      <p className="muted">{message.fromAddress || "unknown sender"}</p>
      <div className="mailbox-flag-list">
        {message.direction ? <span className="pill outline">{message.direction}</span> : null}
        {message.documentId ? <span className="pill outline">document linked</span> : null}
        {message.submissionId ? <span className="pill outline">submission</span> : null}
      </div>
    </article>
  );
}
