import type { Estimate } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { StatusBadge } from "./status-badge";

export function EstimateForm({ estimate }: { estimate: Estimate }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EstimateForm</p>
          <h3>견적서 작성 초안</h3>
        </div>
        <StatusBadge tone="review" label="Draft Only" />
      </div>
      <table className="table">
        <tbody>
          <tr>
            <th>견적명</th>
            <td>{estimate.title}</td>
          </tr>
          <tr>
            <th>용역명</th>
            <td>{estimate.serviceName}</td>
          </tr>
          <tr>
            <th>총액</th>
            <td>{formatCurrency(estimate.totalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
