import { MailAccountSelector } from "../../../components/mail-account-selector";
import { MailLeftPane } from "../../../components/mail-left-pane";
import { MailboxShell } from "../../../components/mailbox-shell";
import { MailSyncLogPanel } from "../../../components/mail-sync-log-panel";
import { OAuthConnectCard } from "../../../components/oauth-connect-card";
import { loadMailAccountsPageData } from "../../../lib/mail-page-data";

export default async function MailAccountsPage() {
  const pageData = await loadMailAccountsPageData();
  return (
    <MailboxShell
      title="메일 계정"
      subtitle="guest draft mode와 connected oauth account를 함께 관리합니다."
      activeSection="accounts"
      headerPanel={
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>accounts</span>
            <strong>{pageData.accounts.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>connected</span>
            <strong>{pageData.accounts.filter((account) => account.isConnected).length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>guest</span>
            <strong>{pageData.accounts.filter((account) => account.mode === "guest_draft_mode").length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>data</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder={undefined} projectId={null} />}
      centerPane={
        <>
          <MailAccountSelector accounts={pageData.accounts} />
          {pageData.syncJobsByAccount.map((jobs, index) => (
            <MailSyncLogPanel jobs={jobs} key={`sync-${index}`} />
          ))}
        </>
      }
      detailPane={<OAuthConnectCard />}
    />
  );
}
