import { MailDetailPane } from "../../../components/mail-detail-pane";
import { MailLeftPane } from "../../../components/mail-left-pane";
import { MailThreadList } from "../../../components/mail-thread-list";
import { MailboxShell } from "../../../components/mailbox-shell";
import { loadMailboxPageData } from "../../../lib/mail-page-data";

export default async function MailSentPage() {
  const pageData = await loadMailboxPageData(undefined, "sent");
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
      title="보낸 메일"
      subtitle="발송 완료 메일과 제출/조치 이력을 검토합니다."
      activeSection="sent"
      leftPane={<MailLeftPane accounts={pageData.accounts} currentFolder="sent" projectId={null} />}
      centerPane={<MailThreadList items={pageData.threads} />}
      detailPane={<MailDetailPane detail={selectedMessage} />}
    />
  );
}
