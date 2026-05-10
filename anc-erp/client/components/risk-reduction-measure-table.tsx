import type { LedgerRiskReductionMeasure } from "../../packages/contracts/src";

export function RiskReductionMeasureTable({ items }: { items: LedgerRiskReductionMeasure[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RiskReductionMeasureTable</p>
          <h3 className="panel-title">감소대책</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>설명</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.description}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
