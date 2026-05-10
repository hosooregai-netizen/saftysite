import type { InspectionTask } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function InspectionReminderPanel({ items }: { items: InspectionTask[] }) {
  const dueSoon = items.filter((item) => item.status !== "done").slice(0, 5);
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">InspectionReminderPanel</p>
          <h3>오늘 필요한 작업</h3>
        </div>
      </div>
      <div className="section-stack">
        {dueSoon.map((item) => (
          <div className="inspection-action-item" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.dueDate ?? "마감 미정"}</span>
            </div>
            <StatusBadge tone={item.status === "blocked" ? "danger" : item.status === "in_progress" ? "info" : "warning"} label={item.status} />
          </div>
        ))}
        {dueSoon.length === 0 ? <p>오늘 당장 조치할 회차 업무가 없습니다.</p> : null}
      </div>
    </section>
  );
}
