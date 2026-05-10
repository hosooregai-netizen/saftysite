import type { FileActivity } from "../../packages/contracts/src";

export function FileActivityTimeline({ activities }: { activities: FileActivity[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FileActivityTimeline</p>
          <h3 className="panel-title">활동 이력</h3>
        </div>
      </div>
      <ul>
        {activities.map((item) => (
          <li key={item.id}>
            {item.activityType} · {item.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

