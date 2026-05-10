import { ComposePanel } from "../../../components/compose-panel";
import { MailLeftPane } from "../../../components/mail-left-pane";
import { MailboxShell } from "../../../components/mailbox-shell";
import { OAuthConnectCard } from "../../../components/oauth-connect-card";
import { loadMailComposePageData } from "../../../lib/mail-page-data";

export default async function MailComposePage() {
  const pageData = await loadMailComposePageData();

  return (
    <MailboxShell
      title="메일 작성"
      subtitle="guest draft mode와 connected mode를 구분해 메일 초안을 작성합니다."
      activeSection="compose"
      headerPanel={
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>accounts</span>
            <strong>{pageData.accounts.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>templates</span>
            <strong>{pageData.templates.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>signatures</span>
            <strong>{pageData.signatures.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>source</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder={undefined} projectId={pageData.projectId} />}
      centerPane={<ComposePanel draft={pageData.draft} templates={pageData.templates} />}
      detailPane={<OAuthConnectCard />}
    />
  );
}
