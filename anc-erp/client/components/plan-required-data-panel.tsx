import type { MissingField } from "../../packages/contracts/src";

export function PlanRequiredDataPanel({ items }: { items: MissingField[] }) {
  return (
    <section className="panel report-required-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PlanRequiredDataPanel</p>
          <h3 className="panel-title">필수 연결 데이터</h3>
        </div>
      </div>
      {items.length === 0 ? (
        <article className="ops-item">
          <strong>누락 없음</strong>
          <span>현재 필수 입력 기준에서 즉시 보완해야 할 항목은 없습니다.</span>
        </article>
      ) : (
        <div className="ops-card-list">
          {items.map((item) => (
            <article className={`ops-item plan-missing-item ${item.severity}`} key={`${item.field}-${item.sectionKey ?? "root"}`}>
              <strong>{item.label ?? item.field}</strong>
              <span>{item.message}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
