import { MailSignatureEditor } from "../../../components/mail-signature-editor";
import { MailTemplateEditor } from "../../../components/mail-template-editor";
import { MailLeftPane } from "../../../components/mail-left-pane";
import { MailboxShell } from "../../../components/mailbox-shell";
import { OAuthConnectCard } from "../../../components/oauth-connect-card";
import { loadMailSettingsPageData } from "../../../lib/mail-page-data";

export default async function MailSettingsPage() {
  const pageData = await loadMailSettingsPageData();
  return (
    <MailboxShell
      title="메일 설정"
      subtitle="서명, 템플릿, 연결 계정 정책을 관리합니다."
      activeSection="settings"
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
            <span>data</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder={undefined} projectId={null} />}
      centerPane={
        <>
          {pageData.signatures.map((signature) => (
            <MailSignatureEditor key={signature.id} signature={signature} />
          ))}
          {pageData.templates.map((template) => (
            <MailTemplateEditor key={template.id} template={template} />
          ))}
        </>
      }
      detailPane={<OAuthConnectCard />}
    />
  );
}
