import type { SignatureTask } from "../../packages/contracts/src";
import { ApprovalStatusBadge } from "./approval-status-badge";

type SignatureTaskTableProps = {
  tasks: SignatureTask[];
};

export function SignatureTaskTable({ tasks }: SignatureTaskTableProps) {
  const requiredCount = tasks.filter((task) => task.required).length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Signature Tasks</p>
          <h3 className="panel-title">서명/날인 task</h3>
          <p className="card-copy">최종본, 날인본, 예외 면제 여부를 한 화면에서 확인하는 서명 통제 구간입니다.</p>
        </div>
      </div>
      <div className="approval-summary-grid">
        <article className="ops-item">
          <strong>총 task</strong>
          <span>{tasks.length}개</span>
        </article>
        <article className="ops-item">
          <strong>필수 task</strong>
          <span>{requiredCount}개</span>
        </article>
        <article className="ops-item">
          <strong>완료 task</strong>
          <span>{completedCount}개</span>
        </article>
        <article className="ops-item">
          <strong>미연결 signed file</strong>
          <span>{tasks.filter((task) => task.taskType === "signed_file_upload" && !task.signedFileId).length}개</span>
        </article>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>task</span>
          <span>유형</span>
          <span>상태</span>
          <span>signedFileId</span>
        </div>
        {tasks.map((task) => (
          <div className="table-row" key={task.id}>
            <span className="approval-table-document">
              <strong>{task.title}</strong>
              <small>{task.required ? "필수" : "선택"}</small>
            </span>
            <span className="approval-table-document">
              <strong>{task.taskType}</strong>
              <small>{task.signatureAssetId ?? "asset 미지정"}</small>
            </span>
            <span><ApprovalStatusBadge status={task.status} /></span>
            <span className="approval-table-document">
              <strong>{task.signedFileId ?? "미연결"}</strong>
              <small>{task.completedAt ?? task.waivedReason ?? "처리 이력 없음"}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
