import type { ContractChange } from "../../packages/contracts/src";

export function ContractChangeForm() {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractChangeForm</p>
          <h3>변경 요청 초안</h3>
        </div>
      </div>
      <p>계약 변경은 저장된 field diff와 audit log를 기준으로 기록됩니다.</p>
    </section>
  );
}

export function ContractChangeTimeline({ changes }: { changes: ContractChange[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractChangeTimeline</p>
          <h3>계약 변경 이력</h3>
        </div>
      </div>
      <ul>
        {changes.map((change) => (
          <li key={change.id}>
            {change.createdAt} · {change.summary}
          </li>
        ))}
      </ul>
    </section>
  );
}
