import type { ChecklistSession, ChecklistTemplate } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function ChecklistSessionHeader({
  session,
  template,
}: {
  session: ChecklistSession;
  template: ChecklistTemplate;
}) {
  return (
    <section className="hero-card checklist-session-hero">
      <div className="hero-head">
        <div>
          <p className="card-eyebrow">ChecklistSessionHeader</p>
          <h2 className="hero-title">{template.name}</h2>
          <p className="hero-subtitle">
            점검회차 {session.inspectionRoundId} · 세션 {session.id} · 버전 {session.templateVersion}
          </p>
        </div>
        <div className="hero-badges">
          <StatusBadge tone="review" label={session.status} />
          <StatusBadge tone="info" label={session.inspectionDate ?? "점검일 미정"} />
        </div>
      </div>
      <div className="hero-summary-grid checklist-summary-grid">
        <div className="kv-card">
          <strong>점검회차</strong>
          <span>{session.inspectionRoundId}</span>
        </div>
        <div className="kv-card">
          <strong>점검일</strong>
          <span>{session.inspectionDate ?? "미정"}</span>
        </div>
        <div className="kv-card">
          <strong>입력 진행</strong>
          <span>
            {session.completedCount ?? 0} / {session.resultCount ?? 0}
          </span>
        </div>
        <div className="kv-card">
          <strong>발주처 분기</strong>
          <span>{session.ownerPartyId ?? "공통 세션"}</span>
        </div>
      </div>
    </section>
  );
}
