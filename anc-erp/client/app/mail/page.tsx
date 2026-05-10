import { MailDetailPane } from "../../components/mail-detail-pane";
import { MailLeftPane } from "../../components/mail-left-pane";
import { MailThreadList } from "../../components/mail-thread-list";
import { MailboxShell } from "../../components/mailbox-shell";
import { loadMailboxPageData } from "../../lib/mail-page-data";

export default async function MailPage() {
  const pageData = await loadMailboxPageData(undefined, "inbox");
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
      title="메일함"
      subtitle="프로젝트, 문서, 제출 이력을 연결하는 full-screen 3-pane 메일 앱입니다."
      activeSection="inbox"
      headerPanel={
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>threads</span>
            <strong>{pageData.threads.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>unread</span>
            <strong>{pageData.threads.reduce((sum, item) => sum + item.unreadCount, 0)}</strong>
          </article>
          <article className="hero-summary-card">
            <span>linked</span>
            <strong>{pageData.threads.filter((item) => item.links.length > 0).length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>source</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder={pageData.folder} projectId={null} />}
      centerPane={<MailThreadList items={pageData.threads} />}
      detailPane={<MailDetailPane detail={selectedMessage} />}
    />
  );
}
