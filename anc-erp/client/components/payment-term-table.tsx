import type { PaymentTerm } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { StatusBadge } from "./status-badge";

export function PaymentStatusBadge({ status }: { status: PaymentTerm["status"] }) {
  const tone =
    status === "paid"
      ? "success"
      : status === "requested"
        ? "submitted"
        : status === "overdue"
          ? "danger"
          : status === "cancelled"
            ? "neutral"
            : "info";
  return <StatusBadge tone={tone} label={status} />;
}

export function PaymentTermTable({ items }: { items: PaymentTerm[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PaymentTermTable</p>
          <h3>지급조건</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>구분</th>
            <th>트리거</th>
            <th>금액</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td>{item.triggerText}</td>
              <td>{formatCurrency(item.amount)}</td>
              <td><PaymentStatusBadge status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
