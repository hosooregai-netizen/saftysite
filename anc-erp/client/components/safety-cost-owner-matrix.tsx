import type { SafetyCostOwnerMatrixResponse } from "../../packages/contracts/src";
import { SafetyCostStatusBadge } from "./safety-cost-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyCostOwnerMatrixProps = {
  matrix: SafetyCostOwnerMatrixResponse;
};

export function SafetyCostOwnerMatrix({ matrix }: SafetyCostOwnerMatrixProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostOwnerMatrix</p>
          <h3 className="panel-title">발주처별 안전관리비 비교</h3>
        </div>
        <StatusBadge tone="info" label={`${matrix.rows.length}개 발주처`} />
      </div>
      <div className="table-shell">
        <table className="data-table safety-cost-table">
          <thead>
            <tr>
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
            {matrix.rows.map((row) => (
              <tr key={row.ownerPartyId}>
                <td>{row.ownerDisplayName}</td>
                <td className="numeric-cell">{row.usage ? row.usage.calculatedAmount.toLocaleString() : "-"}</td>
                <td className="numeric-cell">{row.usage ? row.usage.usedAmount.toLocaleString() : "-"}</td>
                <td className="numeric-cell">{row.usage ? `${row.usage.usedRateCalculated.toFixed(1)}%` : "-"}</td>
                <td>{row.usage?.basisMonth ?? row.usage?.basisDate ?? "미입력"}</td>
                <td>{row.usage?.basisDocumentText ?? "미입력"}</td>
                <td>{row.evidenceCount}</td>
                <td>{row.usage?.appropriatenessStatus ?? "-"}</td>
                <td>
                  {row.usage ? (
                    <div className="section-stack compact">
                      <SafetyCostStatusBadge status={row.usage.status} />
                      {row.warnings[0] ? (
                        <StatusBadge
                          tone={
                            row.warnings[0].severity === "danger"
                              ? "danger"
                              : row.warnings[0].severity === "warning"
                                ? "warning"
                                : "info"
                          }
                          label={row.warnings[0].type}
                        />
                      ) : null}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
