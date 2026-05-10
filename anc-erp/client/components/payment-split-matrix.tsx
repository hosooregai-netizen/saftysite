import type { PaymentSplitCalculationResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function PaymentSplitMatrix({ calculation }: { calculation: PaymentSplitCalculationResponse }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PaymentSplitMatrix</p>
          <h3>지급조건 분담금액</h3>
        </div>
        <StatusBadge
          tone={calculation.warnings.length === 0 ? "success" : "warning"}
          label={calculation.warnings.length === 0 ? "합계 일치" : "검토 필요"}
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>발주처</th>
            <th>비율</th>
            <th>비중</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {calculation.splitItems.map((item) => (
            <tr key={`${item.organizationId}-${item.label}`}>
              <td>{item.label}</td>
              <td>{item.ratio}%</td>
              <td>
                <div className="split-bar">
                  <span className="split-bar-fill" style={{ width: `${Math.max(6, item.ratio)}%` }} />
                </div>
              </td>
              <td>{item.amount.toLocaleString("ko-KR")}원</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>합계</th>
            <th>{calculation.totalRatio}%</th>
            <th />
            <th>{calculation.totalAmount.toLocaleString("ko-KR")}원</th>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
