import type { Estimate } from "../../packages/contracts/src";
import { DocumentPreview } from "./document-preview";
import { StatusBadge } from "./status-badge";

export function EstimatePreviewA4({ estimate, draftText }: { estimate: Estimate; draftText: string }) {
  return (
    <div className="feature-split">
      <DocumentPreview
        title="견적서 A4 미리보기"
        statusLabel="AI 초안 / 검토 전"
        statusTone="review"
        previewTitle={estimate.title}
        rows={[
          { label: "용역명", status: estimate.serviceName, note: "견적서 기준" },
          { label: "총액", status: `${estimate.totalAmount.toLocaleString("ko-KR")}원`, note: "항목 합산" },
          { label: "초안", status: draftText.split("\n")[0] ?? "견적서 초안", note: "저장 전" },
        ]}
        noteBadges={["AI 초안", "계약 전환 가능"]}
      />
      <section className="card">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Estimate Review</p>
            <h3>전환 전 체크</h3>
          </div>
        </div>
        <div className="status-stack">
          <StatusBadge tone="info" label={`항목 ${estimate.items.length}건`} />
          <StatusBadge tone="success" label="계약 전환 가능" />
          <StatusBadge tone="review" label="AI 초안" />
        </div>
        <p>{draftText}</p>
      </section>
    </div>
  );
}
