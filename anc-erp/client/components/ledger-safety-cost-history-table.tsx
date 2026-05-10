import type { LedgerSafetyCostHistory } from "../../packages/contracts/src";

export function LedgerSafetyCostHistoryTable({ items }: { items: LedgerSafetyCostHistory[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSafetyCostHistoryTable</p>
          <h3 className="panel-title">산업안전보건관리비 이력</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>회차</th>
            <th>기준월</th>
            <th>사용률</th>
            <th>적정성</th>
            <th>보고서 반영</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.inspectionRoundId}</td>
              <td>{item.basisMonth ?? "-"}</td>
              <td>{item.usedRateCalculated ?? "-"}%</td>
              <td>{item.appropriatenessStatus ?? "-"}</td>
              <td>{item.reportLinked ? "연결" : "미연결"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
