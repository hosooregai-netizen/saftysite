import type { CorrectiveAction } from "../../packages/contracts/src";
import { CorrectiveActionStatusBadge } from "./corrective-action-status-badge";

type CorrectiveActionTableProps = {
  actions: CorrectiveAction[];
};

export function CorrectiveActionTable({ actions }: CorrectiveActionTableProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Corrective Action Table</p>
          <h3>조치현황</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>조치내용</th>
            <th>조치일</th>
            <th>제출 / 확인</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action.id}>
              <td>{action.actionDetail}</td>
              <td>{action.actionDate ?? "미정"}</td>
              <td>
                <div className="table-subtext">제출: {action.submittedAt ?? "-"}</div>
                <div className="table-subtext">확인: {action.verifiedAt ?? "-"}</div>
              </td>
              <td>
                <CorrectiveActionStatusBadge status={action.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
