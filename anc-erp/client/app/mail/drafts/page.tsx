import { MailDetailPane } from "../../../components/mail-detail-pane";
import { MailLeftPane } from "../../../components/mail-left-pane";
import { MailThreadList } from "../../../components/mail-thread-list";
import { MailboxShell } from "../../../components/mailbox-shell";
import { loadMailboxPageData } from "../../../lib/mail-page-data";

export default async function MailDraftsPage() {
  const pageData = await loadMailboxPageData(undefined, "drafts");
  const selectedMessage = pageData.selectedThread?.messages?.[0]
    ? {
        message: pageData.selectedThread.messages[0],
        attachments: pageData.selectedThread.attachments.filter(
          (item) => item.messageId === pageData.selectedThread?.messages?.[0]?.id,
        ),
        links: pageData.selectedThread.links.filter(
          (item) => item.messageId === pageData.selectedThread?.messages?.[0]?.id,
        ),
      }
    : null;

  return (
    <MailboxShell
      title="메일 초안"
      subtitle="draft only 상태의 메일을 검토하고 발송 전 검증합니다."
      activeSection="drafts"
      headerPanel={
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>draft threads</span>
            <strong>{pageData.threads.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>guest draft</span>
            <strong>{pageData.accounts.filter((account) => account.mode === "guest_draft_mode").length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>templates</span>
            <strong>{pageData.templates.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>source</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder="drafts" projectId={null} />}
      centerPane={<MailThreadList items={pageData.threads} />}
      detailPane={<MailDetailPane detail={selectedMessage} />}
    />
  );
}
