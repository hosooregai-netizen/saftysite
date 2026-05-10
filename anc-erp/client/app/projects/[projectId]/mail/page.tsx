import { MailDetailPane } from "../../../../components/mail-detail-pane";
import { MailLeftPane } from "../../../../components/mail-left-pane";
import { MailThreadList } from "../../../../components/mail-thread-list";
import { MailboxShell } from "../../../../components/mailbox-shell";
import { loadMailboxPageData } from "../../../../lib/mail-page-data";

type ProjectMailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectMailPage({ params }: ProjectMailPageProps) {
  const { projectId } = await params;
  const pageData = await loadMailboxPageData(projectId, "inbox");
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
      title={`프로젝트 메일함 · ${projectId}`}
      subtitle="Project Detail > Mail 탭에서 프로젝트/문서/제출 연결 메일을 함께 검토합니다."
      activeSection="project"
      projectId={projectId}
      headerPanel={
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>projectId</span>
            <strong>{projectId}</strong>
          </article>
          <article className="hero-summary-card">
            <span>threads</span>
            <strong>{pageData.threads.length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>미분류</span>
            <strong>{pageData.threads.filter((item) => item.links.length === 0).length}</strong>
          </article>
          <article className="hero-summary-card">
            <span>data</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      }
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder={pageData.folder} projectId={projectId} />}
      centerPane={<MailThreadList items={pageData.threads} />}
      detailPane={<MailDetailPane detail={selectedMessage} />}
    />
  );
}
