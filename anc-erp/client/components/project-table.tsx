import Link from "next/link";

import type { ProjectListItem } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { ProjectStatusBadge } from "./project-status-badge";
import { StatusBadge } from "./status-badge";

type ProjectTableProps = {
  items: ProjectListItem[];
};

export function ProjectTable({ items }: ProjectTableProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Project Table</p>
          <h3>프로젝트 목록</h3>
          <p>복수 발주처, 공정율, 다음 점검, 문서 상태를 한 줄 안에서 빠르게 읽을 수 있게 정리했습니다.</p>
        </div>
        <StatusBadge tone="info" label={`${items.length}개 현장`} />
      </div>
      <table className="table project-table">
        <thead>
          <tr>
            <th>프로젝트명</th>
            <th>발주처 / 시공사</th>
            <th>공사기간</th>
            <th>공정율</th>
            <th>다음 점검</th>
            <th>문서 / 미조치</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.project.id}>
              <td>
                <Link className="inline-link strong" href={`/projects/${item.project.id}`}>
                  {item.project.projectName}
                </Link>
                <div className="table-subtext">{item.project.siteAddress}</div>
              </td>
              <td>
                <div className="badge-row">
                  {item.ownerNames.map((name) => (
                    <span className="micro-pill owner" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
                <div className="table-subtext">{item.contractorNames.join(", ") || "-"}</div>
              </td>
              <td>
                {item.project.startDate} ~ {item.project.endDate}
                <div className="table-subtext">{formatCurrency(item.project.totalAmount)}</div>
              </td>
              <td>
                <div className="progress-cell">
                  <strong>{item.project.progressRate ?? "-"}%</strong>
                  <div className="progress-track compact">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.project.progressRate ?? 0}%` }}
                    />
                  </div>
                </div>
              </td>
              <td>{item.nextInspectionDate ?? "미정"}</td>
              <td>
                <div className="status-stack">
                  <StatusBadge tone="review" label={`문서 ${item.relatedCounts.documents}건`} />
                  <StatusBadge
                    tone={item.relatedCounts.openFindings > 0 ? "danger" : "success"}
                    label={`미조치 ${item.relatedCounts.openFindings}건`}
                  />
                </div>
              </td>
              <td>
                <ProjectStatusBadge status={item.project.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
