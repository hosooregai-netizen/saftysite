import Link from "next/link";

import type { InspectionOwnerReportTask } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function OwnerReportTaskList({ items }: { items: InspectionOwnerReportTask[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OwnerReportTaskList</p>
          <h3>발주처별 보고서 업무</h3>
        </div>
      </div>
      <div className="section-stack">
        {items.map((item) => (
          <div className="missing-item" key={item.id}>
            <strong>{item.ownerDisplayName ?? item.ownerPartyId}</strong>
            <span>documentInstanceId: {item.documentInstanceId ?? "-"}</span>
            <div className="link-list">
              <StatusBadge tone={item.status === "submitted" ? "success" : "review"} label={item.status} />
              <Link className="inline-link" href={`/inspections/${item.inspectionRoundId}/owner-reports`}>
                상태 보기
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
