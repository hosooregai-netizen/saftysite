import type { Finding } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type FindingSourceLinkPanelProps = {
  finding: Finding;
};

export function FindingSourceLinkPanel({ finding }: FindingSourceLinkPanelProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Finding Source</p>
          <h3>원본 연결 정보</h3>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <strong>sourceType</strong>
          <p>{finding.sourceType ?? "manual"}</p>
        </div>
        <div>
          <strong>sourceId</strong>
          <p>{finding.sourceId ?? "-"}</p>
        </div>
        <div>
          <strong>checklistResultId</strong>
          <p>{finding.checklistResultId ?? "-"}</p>
        </div>
        <div>
          <strong>reportInclude</strong>
          <p>{finding.reportInclude ? "사진대지/보고서 반영" : "내부 관리 전용"}</p>
        </div>
      </div>
      <div className="badge-row">
        <StatusBadge tone="info" label={`InspectionRound ${finding.inspectionRoundId}`} />
        <StatusBadge tone="review" label={`Project ${finding.projectId}`} />
      </div>
    </section>
  );
}
