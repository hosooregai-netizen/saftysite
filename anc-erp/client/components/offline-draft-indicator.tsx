import type { ChecklistMobileDraft } from "../../packages/contracts/src";

export function OfflineDraftIndicator({ draft }: { draft: ChecklistMobileDraft | null }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OfflineDraftIndicator</p>
          <h3>오프라인 임시저장</h3>
        </div>
      </div>
      <div className="badge-row">
        <span className="pill">{draft ? `draft v${draft.draftVersion}` : "draft 없음"}</span>
        <span className="pill outline">{draft?.conflictDetected ? "충돌 감지" : "충돌 없음"}</span>
      </div>
    </section>
  );
}
