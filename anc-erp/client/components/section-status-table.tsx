import type { SafetyReportSection } from "../../packages/contracts/src";
import { ReportStatusBadge } from "./report-status-badge";
import { SectionRegenerateButton } from "./section-regenerate-button";

type SectionStatusTableProps = {
  documentId: string;
  sections: SafetyReportSection[];
};

export function SectionStatusTable({
  documentId,
  sections,
}: SectionStatusTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SectionStatusTable</p>
          <h3 className="panel-title">섹션 상태 / 재생성</h3>
        </div>
      </div>
      <div className="table-shell">
        <table className="erp-table">
          <thead>
            <tr>
              <th>섹션</th>
              <th>상태</th>
              <th>updatedAt</th>
              <th>재생성</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id}>
                <td>{section.title}</td>
                <td>
                  <ReportStatusBadge status={section.status} />
                </td>
                <td>{section.updatedAt.slice(0, 10)}</td>
                <td>
                  <SectionRegenerateButton documentId={documentId} sectionKey={section.key} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

