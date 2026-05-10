import type { SafetyHealthLedgerDetailResponse } from "../../packages/contracts/src";
import { A4Preview } from "./a4-preview";

export function LedgerA4Preview({ detail }: { detail: SafetyHealthLedgerDetailResponse }) {
  return (
    <A4Preview
      title={detail.ledger.title}
      watermark={detail.snapshot.meta.draftWatermark}
      rows={[
        { label: "위험요인 register", status: `${detail.riskItems.length}건`, note: "반복 위험 포함 검토" },
        { label: "점검 이력", status: `${detail.inspectionHistory.length}회`, note: "회차 누적 확인" },
        { label: "지적/조치", status: `${detail.findingHistory.length}건`, note: "verified 조치 우선 반영" },
        { label: "산안비 이력", status: `${detail.safetyCostHistory.length}건`, note: "회차/발주처 이력 누적" },
        { label: "첨부문서", status: `${detail.attachments.length}건`, note: "웹하드 저장 문맥 확인" },
      ]}
    />
  );
}
