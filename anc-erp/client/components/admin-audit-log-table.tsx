import type { AdminAuditLog } from "../../packages/contracts/src";

type AdminAuditLogTableProps = {
  logs: AdminAuditLog[];
  title?: string;
};

export function AdminAuditLogTable({ logs, title = "관리자 감사로그" }: AdminAuditLogTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">AdminAuditLogTable</p>
          <h3 className="panel-title">{title}</h3>
          <p className="card-copy">운영 변경의 시간, 사유, 변경 필드를 함께 남겨 rollback과 영향 추적을 쉽게 만듭니다.</p>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>시간/작업</span>
          <span>대상</span>
          <span>사유/변경필드</span>
        </div>
        {logs.map((log) => (
          <div className="table-row" key={log.id}>
            <span className="approval-table-document">
              <strong>{log.createdAt}</strong>
              <small>{log.action}</small>
            </span>
            <span className="approval-table-document">
              <strong>{log.targetName}</strong>
              <small>
                {log.targetType} / {log.targetId}
              </small>
            </span>
            <span className="approval-table-document">
              <strong>{log.reason || "사유 없음"}</strong>
              <small>{log.changedFields.join(", ") || "변경 필드 없음"}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
