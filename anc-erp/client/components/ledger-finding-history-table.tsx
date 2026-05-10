import type { LedgerFindingHistory } from "../../packages/contracts/src";

export function LedgerFindingHistoryTable({ items }: { items: LedgerFindingHistory[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerFindingHistoryTable</p>
          <h3 className="panel-title">지적사항 이력</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>위험유형</th>
            <th>상태</th>
            <th>반복</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.riskType ?? "-"}</td>
              <td>{item.status}</td>
              <td>{item.recurrenceCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
