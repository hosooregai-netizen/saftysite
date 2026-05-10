import { ErpShell } from "../../../../components/erp-shell";
import { MailMessageListItem } from "../../../../components/mail-message-list-item";
import { loadMailThreadPageData } from "../../../../lib/mail-page-data";

type MailThreadDetailPageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function MailThreadDetailPage({ params }: MailThreadDetailPageProps) {
  const { threadId } = await params;
  const pageData = await loadMailThreadPageData(threadId);

  return (
    <ErpShell title={`메일 스레드 ${threadId}`} subtitle="thread 단위로 대화 흐름과 linked entity를 검토합니다.">
      <section className="card">
        <p className="card-eyebrow">Thread Messages</p>
        {pageData.detail?.messages.map((message) => <MailMessageListItem key={message.id} message={message} />) ?? (
          <p className="empty-state">메시지가 없습니다.</p>
        )}
      </section>
    </ErpShell>
  );
}
