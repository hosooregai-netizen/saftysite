import type { FindingTimelineEvent } from "../../packages/contracts/src";

type FindingTimelineProps = {
  events: FindingTimelineEvent[];
};

export function FindingTimeline({ events }: FindingTimelineProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Finding Timeline</p>
          <h3>상태 전이 / 이력</h3>
        </div>
      </div>
      <div className="timeline-list">
        {events.map((event) => (
          <article className="timeline-item" key={event.id}>
            <strong>{event.summary}</strong>
            <p className="table-subtext">{event.eventType}</p>
            <p className="table-subtext">{event.createdAt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
