import type { MailThreadListItem } from "../../packages/contracts/src";
import { MailMessageListItem } from "./mail-message-list-item";

export function MailThreadList({ items }: { items: MailThreadListItem[] }) {
  const unclassifiedCount = items.filter((item) => item.links.length === 0).length;
  const unreadCount = items.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <>
      <section className="hero-card mailbox-thread-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Thread List</p>
            <h2 className="hero-title">메일 스레드와 ERP 연결 상태를 한 번에 검토</h2>
            <p className="hero-subtitle">프로젝트 badge, 연결 엔티티 badge, unread, 첨부 신호를 같은 목록에서 확인합니다.</p>
          </div>
          <div className="hero-badges">
            <span className="status info">unread {unreadCount}</span>
            <span className="status warning">미분류 {unclassifiedCount}</span>
            <span className="status submitted">threads {items.length}</span>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="stack-list">
          {items.length === 0 ? <p className="empty-state">표시할 메일 스레드가 없습니다.</p> : null}
          {items.map((item) => (
            <article className="mini-card mailbox-thread-card" key={item.thread.id}>
              <div className="utility-row" style={{ justifyContent: "space-between" }}>
                <strong>{item.thread.subject}</strong>
                <div className="mailbox-flag-list">
                  <span className={`status ${item.unreadCount > 0 ? "info" : "neutral"}`}>unread {item.unreadCount}</span>
                  <span className={`status ${item.links.length > 0 ? "submitted" : "warning"}`}>
                    {item.links.length > 0 ? "linked" : "미분류"}
                  </span>
                </div>
              </div>
              <div className="mailbox-flag-list">
                <span className="pill outline">{item.thread.projectId}</span>
                {item.links.slice(0, 3).map((link) => (
                  <span className={`pill ${link.confirmed ? "" : "outline"}`} key={link.id}>
                    {link.entityType}
                  </span>
                ))}
              </div>
              {item.latestMessage ? <MailMessageListItem message={item.latestMessage} /> : <p className="muted">메시지 없음</p>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
