import { StatusBadge } from "./status-badge";

type ApprovalFilterBarProps = {
  scope: "all" | "inbox" | "requested";
  itemCount: number;
};

export function ApprovalFilterBar({ scope, itemCount }: ApprovalFilterBarProps) {
  const label =
    scope === "inbox" ? "내 결재함" : scope === "requested" ? "내가 요청한 결재" : "전체 결재 목록";

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Approval Filter</p>
          <h3 className="panel-title">{label}</h3>
          <p className="card-copy">전역 큐이지만 실제 소유권은 문서 내부 approval workflow에 있습니다.</p>
        </div>
        <StatusBadge tone="info" label={`${itemCount} workflows`} />
      </div>
      <div className="hero-badges">
        <span className={`pill ${scope === "all" ? "" : "outline"}`}>전체</span>
        <span className={`pill ${scope === "inbox" ? "" : "outline"}`}>내 결재함</span>
        <span className={`pill ${scope === "requested" ? "" : "outline"}`}>요청한 결재</span>
      </div>
    </section>
  );
}
