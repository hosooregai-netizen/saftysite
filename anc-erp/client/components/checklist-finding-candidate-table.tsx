import type { FindingCandidate } from "../../packages/contracts/src";
import { ChecklistFindingCandidateDrawer } from "./checklist-finding-candidate-drawer";

export function ChecklistFindingCandidateTable({ items }: { items: FindingCandidate[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistFindingCandidateTable</p>
          <h3>지적사항 후보</h3>
          <p>주의·불량 입력에서 생성된 후보를 Finding 전환 전에 검토합니다.</p>
        </div>
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <ChecklistFindingCandidateDrawer candidate={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
