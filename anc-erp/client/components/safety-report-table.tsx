import Link from "next/link";

import type { SafetyReportListItem } from "../../packages/contracts/src";
import { OwnerReportBranchBadge } from "./owner-report-branch-badge";
import { ReportStatusBadge } from "./report-status-badge";
import { StatusBadge } from "./status-badge";

type SafetyReportTableProps = {
  items: SafetyReportListItem[];
};

export function SafetyReportTable({ items }: SafetyReportTableProps) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyReportTable</p>
          <h3 className="panel-title">발주처별 이행확인 보고서</h3>
        </div>
        <StatusBadge tone="info" label={`${items.length}건 관리`} />
      </div>
      <div className="table-shell">
        <table className="erp-table report-table">
          <thead>
            <tr>
              <th>문서</th>
              <th>발주처</th>
              <th>회차</th>
              <th>상태</th>
              <th>누락</th>
              <th>경고</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.document.id}>
                <td>
                  <div className="report-table-title">
                    <Link className="inline-link" href={`/documents/safety-reports/${item.document.id}`}>
                      {item.document.title}
                    </Link>
                    <span className="table-subcopy">
                      문서번호 {item.document.documentNo ?? "미부여"} · 최신 v
                      {item.latestVersion?.versionNo ?? item.document.latestVersionNo}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="report-owner-cell">
                    <OwnerReportBranchBadge ownerDisplayName={item.ownerDisplayName} />
                    <span className="table-subcopy">
                      {item.linkedOwnerReportTask ? "owner report task 연결" : "owner report task 미연결"}
                    </span>
                  </div>
                </td>
                <td>
                  <strong>{item.inspectionRoundName}</strong>
                  <span className="table-subcopy">{item.document.roundNo}회 보고서 branch</span>
                </td>
                <td>
                  <div className="status-stack">
                    <ReportStatusBadge status={item.document.status} />
                    <StatusBadge
                      tone={item.document.exportedFileId ? "success" : "review"}
                      label={item.document.exportedFileId ? "export 보유" : "draft only"}
                    />
                  </div>
                </td>
                <td>
                  <strong>{item.missingRequiredCount}건</strong>
                  <span className="table-subcopy">
                    {item.missingRequiredCount > 0 ? "export 전 보완 필요" : "필수 누락 없음"}
                  </span>
                </td>
                <td>
                  <strong>{item.warningCount}건</strong>
                  <span className="table-subcopy">
                    {item.warningCount > 0 ? "linked data 검토 필요" : "검토 경고 없음"}
                  </span>
                </td>
                <td>
                  <div className="report-row-actions">
                    <Link className="inline-link" href={`/documents/safety-reports/${item.document.id}/edit`}>
                      편집
                    </Link>
                    <Link className="inline-link" href={`/documents/safety-reports/${item.document.id}/export`}>
                      export
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
