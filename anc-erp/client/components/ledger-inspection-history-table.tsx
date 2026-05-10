import type { LedgerInspectionHistory } from "../../packages/contracts/src";

export function LedgerInspectionHistoryTable({ items }: { items: LedgerInspectionHistory[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerInspectionHistoryTable</p>
          <h3 className="panel-title">점검이력</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>회차</th>
            <th>점검일</th>
            <th>주의</th>
            <th>불량</th>
            <th>지적</th>
            <th>미조치</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.roundNo ?? "-"}</td>
              <td>{item.inspectionDate ?? "-"}</td>
              <td>{item.cautionCount}</td>
              <td>{item.badCount}</td>
              <td>{item.findingCount}</td>
              <td>{item.openFindingCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
