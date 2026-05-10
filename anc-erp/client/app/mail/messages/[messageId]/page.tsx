import { MailDetailPane } from "../../../../components/mail-detail-pane";
import { ErpShell } from "../../../../components/erp-shell";
import { loadMailMessagePageData } from "../../../../lib/mail-page-data";

type MailMessageDetailPageProps = {
  params: Promise<{ messageId: string }>;
};

export default async function MailMessageDetailPage({ params }: MailMessageDetailPageProps) {
  const { messageId } = await params;
  const pageData = await loadMailMessagePageData(messageId);
  return (
    <ErpShell title={`메일 메시지 ${messageId}`} subtitle="첨부 저장, entity linkage, 제출/조치 연결을 확인합니다.">
      <MailDetailPane detail={pageData.detail} />
    </ErpShell>
  );
}
