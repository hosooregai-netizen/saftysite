import Link from "next/link";

import type { SafetyManagementPlanListItem } from "../../packages/contracts/src";
import { PlanStatusBadge } from "./plan-status-badge";

export function SafetyManagementPlanTable({ items }: { items: SafetyManagementPlanListItem[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyManagementPlanTable</p>
          <h3 className="panel-title">안전관리계획서 목록</h3>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>템플릿</th>
            <th>회차</th>
            <th>상태</th>
            <th>위험요인</th>
            <th>누락</th>
            <th>경고</th>
            <th>수정일</th>
            <th>바로가기</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.plan.id}>
              <td>
                <div className="report-table-title">
                  <strong>{item.plan.title}</strong>
                  <span className="table-subcopy">개정 {item.plan.revisionNo}차</span>
                </div>
              </td>
              <td>{item.plan.templateId}</td>
              <td>{item.inspectionRoundName ?? "-"}</td>
              <td><PlanStatusBadge label={item.plan.status} /></td>
              <td>{item.latestVersion ? "연결됨" : "-"}</td>
              <td>{item.missingRequiredCount}건</td>
              <td>{item.warningCount}건</td>
              <td>{item.plan.updatedAt.slice(0, 10)}</td>
              <td>
                <div className="report-row-actions">
                  <Link className="inline-link" href={`/documents/safety-management-plans/${item.plan.id}`}>
                    상세
                  </Link>
                  <Link className="inline-link" href={`/documents/safety-management-plans/${item.plan.id}/edit`}>
                    편집
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
