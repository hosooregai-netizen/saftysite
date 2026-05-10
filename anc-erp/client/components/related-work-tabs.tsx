import Link from "next/link";

import type { ProjectRelatedCounts } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function RelatedWorkTabs({
  projectId,
  counts,
}: {
  projectId: string;
  counts: ProjectRelatedCounts;
}) {
  const items = [
    { label: "계약/견적", href: `/projects/${projectId}/contracts`, count: counts.contracts },
    { label: "점검회차", href: `/projects/${projectId}/inspections`, count: counts.inspectionRounds },
    { label: "문서", href: `/projects/${projectId}/documents/safety-reports`, count: counts.documents },
    { label: "웹하드", href: `/projects/${projectId}/webhard`, count: counts.files },
    { label: "메일", href: `/projects/${projectId}/mail`, count: counts.mailThreads },
  ];

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RelatedWorkTabs</p>
          <h3>관련 업무 진입</h3>
        </div>
        <StatusBadge tone="info" label="Project Contained" />
      </div>
      <div className="link-list">
        {items.map((item) => (
          <Link className="inline-link" href={item.href} key={item.href}>
            {item.label} <span className="inline-link-meta">{item.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
