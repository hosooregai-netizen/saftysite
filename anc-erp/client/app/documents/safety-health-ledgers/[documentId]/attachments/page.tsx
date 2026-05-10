import { ErpShell } from "../../../../../components/erp-shell";
import { LedgerAttachmentPanel } from "../../../../../components/ledger-attachment-panel";
import { loadSafetyHealthLedgerDetailPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyHealthLedgerAttachmentsPage({ params }: Props) {
  const { documentId } = await params;
  const pageData = await loadSafetyHealthLedgerDetailPageData(documentId);
  return (
    <ErpShell title={`첨부자료 · ${documentId}`} subtitle="대장 첨부자료와 웹하드 연결 자료를 관리합니다.">
      <LedgerAttachmentPanel items={pageData.detail.attachments} ledgerId={pageData.detail.ledger.id} />
    </ErpShell>
  );
}
