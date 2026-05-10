import type { LedgerRiskItem } from "../../packages/contracts/src";
import { LedgerRiskStatusBadge } from "./ledger-risk-status-badge";
import { RiskRecurrenceBadge } from "./risk-recurrence-badge";

export function LedgerRiskRegisterTable({ items }: { items: LedgerRiskItem[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerRiskRegisterTable</p>
          <h3 className="panel-title">위험요인 register</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>공종</th>
            <th>유해·위험요인</th>
            <th>위험도</th>
            <th>상태</th>
            <th>반복</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.workType ?? "-"}</td>
              <td>{item.hazardDescription}</td>
              <td>{item.riskLevel ?? "-"}</td>
              <td><LedgerRiskStatusBadge label={item.status} /></td>
              <td><RiskRecurrenceBadge count={item.recurrenceCount} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
