import type { PhotoLedgerDetailResponse } from "../../packages/contracts/src";
import { DocumentPreview } from "./document-preview";

type PhotoLedgerA4PreviewProps = {
  detail: PhotoLedgerDetailResponse;
};

export function PhotoLedgerA4Preview({ detail }: PhotoLedgerA4PreviewProps) {
  return (
    <DocumentPreview
      title="사진대지 A4 미리보기"
      statusLabel={detail.photoLedger.status}
      statusTone={detail.warnings.some((item) => item.severity === "danger") ? "warning" : "review"}
      previewTitle={detail.photoLedger.title}
      rows={detail.entries.map((entry) => ({
        label: `${entry.displayOrder}. ${entry.findingCaption ?? entry.findingId}`,
        status: entry.confirmed ? "confirmed" : "draft",
        note: entry.actionCaption ?? "조치사진 확인 필요",
      }))}
      noteBadges={[
        "AI 초안",
        "photo_ledger section",
        `${detail.entries.length}개 항목`,
        detail.photoLedger.ownerPartyId ?? "공통 분기",
      ]}
    />
  );
}
