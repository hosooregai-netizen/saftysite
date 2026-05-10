import type { SafetyCostUsage } from "../../packages/contracts/src";
import { DocumentPreview } from "./document-preview";

type SafetyCostReportPreviewCardProps = {
  usage: SafetyCostUsage;
  ownerDisplayName: string;
};

export function SafetyCostReportPreviewCard({
  usage,
  ownerDisplayName,
}: SafetyCostReportPreviewCardProps) {
  const basisLabel = usage.basisMonth ?? usage.basisDate ?? "기준 미입력";

  return (
    <DocumentPreview
      title={`${ownerDisplayName} 보고서 반영 미리보기`}
      statusLabel={usage.status}
      statusTone={usage.status === "synced_to_report" ? "submitted" : usage.status === "confirmed" ? "info" : "review"}
      previewTitle="산업안전보건관리비 사용 실적"
      rows={[
        {
          label: "산업안전보건관리비 사용 실적",
          status: `계상금액 ${usage.calculatedAmount.toLocaleString()}원 중 ${usage.usedAmount.toLocaleString()}원`,
          note: `${usage.usedRateCalculated.toFixed(1)}% (${basisLabel} 기준)`,
        },
        {
          label: "관련근거",
          status: usage.basisDocumentText ?? "산업안전보건관리비 사용내역서 미연결",
          note: "보고서 safety_cost_usage 표 반영",
        },
        {
          label: "적정성",
          status: usage.appropriatenessStatus,
          note: usage.appropriatenessComment ?? "검토 의견 미입력",
        },
      ]}
      noteBadges={[
        "AI 초안",
        "보고서 표 반영",
        usage.reportInclude ? "반영 대상" : "반영 제외",
        usage.syncedDocumentId ? "문서 반영 완료" : "문서 반영 대기",
      ]}
    />
  );
}
