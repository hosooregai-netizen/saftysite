import type { SafetyCostUsageListItem } from "../../packages/contracts/src";
import { SafetyCostStatusBadge } from "./safety-cost-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyCostUsageTableProps = {
  items: SafetyCostUsageListItem[];
  title: string;
};

export function SafetyCostUsageTable({ items, title }: SafetyCostUsageTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostUsageTable</p>
          <h3 className="panel-title">{title}</h3>
        </div>
        <StatusBadge tone="info" label={`${items.length}건`} />
      </div>
      <div className="table-shell">
        <table className="data-table safety-cost-table">
          <thead>
            <tr>
              <th>회차</th>
              <th>발주처</th>
              <th>계상금액</th>
              <th>사용금액</th>
              <th>사용률</th>
              <th>기준월</th>
              <th>관련근거</th>
              <th>증빙</th>
              <th>적정성</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.usage.id}>
                <td>{item.usage.inspectionRoundId}</td>
                <td>{item.ownerDisplayName}</td>
                <td className="numeric-cell">{item.usage.calculatedAmount.toLocaleString()}</td>
                <td className="numeric-cell">{item.usage.usedAmount.toLocaleString()}</td>
                <td className="numeric-cell">
                  <strong>{item.usage.usedRateCalculated.toFixed(1)}%</strong>
                  {item.usage.userEnteredRate !== undefined && item.usage.userEnteredRate !== null ? (
                    <span className="table-subcopy">입력 {item.usage.userEnteredRate.toFixed(1)}%</span>
                  ) : null}
                </td>
                <td>{item.usage.basisMonth ?? item.usage.basisDate ?? "미입력"}</td>
                <td>{item.usage.basisDocumentText ?? "미입력"}</td>
                <td>{item.evidenceCount}</td>
                <td>{item.usage.appropriatenessStatus}</td>
                <td>
                  <div className="section-stack compact">
                    <SafetyCostStatusBadge status={item.usage.status} />
                    {item.warnings[0] ? (
                      <StatusBadge
                        tone={
                          item.warnings[0].severity === "danger"
                            ? "danger"
                            : item.warnings[0].severity === "warning"
                              ? "warning"
                              : "info"
                        }
                        label={item.warnings[0].type}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
