import type { SubmissionStatusEvent } from "../../packages/contracts/src";

type SubmissionHistoryTimelineProps = {
  events: SubmissionStatusEvent[];
};

export function SubmissionHistoryTimeline({ events }: SubmissionHistoryTimelineProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Submission Timeline</p>
          <h3 className="panel-title">상태 이력</h3>
          <p className="card-copy">제출, 접수확인, 보완요청, 재제출 흐름을 시간 순서대로 확인합니다.</p>
        </div>
      </div>
      <div className="submission-history-list">
        {events.map((event) => (
          <article className="submission-history-card" key={event.id}>
            <div className="utility-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="approval-table-document">
                <strong>{event.status}</strong>
                <small>{event.createdAt}</small>
              </div>
            </div>
            <p className="helper-text">{event.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
