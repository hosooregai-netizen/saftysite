import Link from "next/link";

import type { EstimateListItem, EstimateStatus } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { StatusBadge } from "./status-badge";

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const tone =
    status === "accepted"
      ? "success"
      : status === "sent"
        ? "submitted"
        : status === "rejected"
          ? "danger"
          : status === "converted"
            ? "info"
            : "review";
  return <StatusBadge tone={tone} label={status} />;
}

export function EstimateTable({ items }: { items: EstimateListItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EstimateTable</p>
          <h3>견적 목록</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>견적명</th>
            <th>항목 수</th>
            <th>총액</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.estimate.id}>
              <td>
                <Link className="inline-link" href={`/estimates/${item.estimate.id}`}>
                  {item.estimate.title}
                </Link>
              </td>
              <td>{item.itemCount}</td>
              <td>{formatCurrency(item.estimate.totalAmount)}</td>
              <td><EstimateStatusBadge status={item.estimate.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
