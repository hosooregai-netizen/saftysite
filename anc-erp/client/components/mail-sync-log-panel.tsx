import type { MailSyncJob } from "../../packages/contracts/src";
import { MailSyncStatusBadge } from "./mail-sync-status-badge";

export function MailSyncLogPanel({ jobs }: { jobs: MailSyncJob[] }) {
  return (
    <section className="panel">
      <p className="card-eyebrow">MailSyncLogPanel</p>
      <div className="stack-list">
        {jobs.length === 0 ? <p className="empty-state">sync log가 없습니다.</p> : null}
        {jobs.map((job) => (
          <article className="mini-card" key={job.id}>
            <div className="utility-row" style={{ justifyContent: "space-between" }}>
              <strong>{job.summary}</strong>
              <MailSyncStatusBadge status={job.status} />
            </div>
            <p className="muted">{job.startedAt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
