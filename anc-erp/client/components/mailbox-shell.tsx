import Link from "next/link";
import type { ReactNode } from "react";

type MailboxSection = "inbox" | "sent" | "drafts" | "compose" | "accounts" | "settings" | "project";

type MailboxShellProps = {
  title: string;
  subtitle: string;
  leftPane: ReactNode;
  centerPane: ReactNode;
  detailPane: ReactNode;
  headerPanel?: ReactNode;
  activeSection: MailboxSection;
  projectId?: string | null;
};

export function MailboxShell({
  title,
  subtitle,
  leftPane,
  centerPane,
  detailPane,
  headerPanel,
  activeSection,
  projectId,
}: MailboxShellProps) {
  const primaryLinks = [
    { href: "/mail/inbox", key: "inbox", label: "받은 메일" },
    { href: "/mail/sent", key: "sent", label: "보낸 메일" },
    { href: "/mail/drafts", key: "drafts", label: "초안" },
    { href: "/mail/compose", key: "compose", label: "작성" },
    { href: "/mail/accounts", key: "accounts", label: "계정" },
    { href: "/mail/settings", key: "settings", label: "설정" },
    ...(projectId ? [{ href: `/projects/${projectId}/mail`, key: "project", label: "프로젝트 메일" }] : []),
  ] as const;

  return (
    <div className="host-shell mailbox-host-shell">
      <main className="host-main-column mailbox-host-main">
        <section className="host-hero mailbox-host-hero">
          <div className="host-hero-copy">
            <p className="host-kicker">A&C ERP Mailbox</p>
            <h1 className="host-title">{title}</h1>
            <p className="host-subtitle">{subtitle}</p>
          </div>
          <div className="host-badge-cluster">
            <span className="status info">3-pane host</span>
            <span className="status submitted">project/document linked</span>
            <span className="status review">AI draft safe</span>
          </div>
        </section>

        <nav className="host-tabbar" aria-label="Mailbox navigation">
          {primaryLinks.map((item) => (
            <Link
              className={`host-tab-link ${activeSection === item.key ? "active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="host-context-strip">
          <article className="host-context-card">
            <span>scope</span>
            <strong>{projectId ? `projectId ${projectId}` : "cross-project inbox"}</strong>
          </article>
          <article className="host-context-card">
            <span>containment</span>
            <strong>Project / Document / Submission linked</strong>
          </article>
          <article className="host-context-card">
            <span>workflow</span>
            <strong>folders → threads → detail</strong>
          </article>
        </section>

        {headerPanel ? <section className="mailbox-header-panel">{headerPanel}</section> : null}
        <div className="host-workspace mailbox-host-workspace">
          <aside className="host-secondary-column">{leftPane}</aside>
          <div className="host-content-column">
            <div className="content-grid">{centerPane}</div>
          </div>
          <aside className="host-detail-column">{detailPane}</aside>
        </div>
      </main>
    </div>
  );
}
