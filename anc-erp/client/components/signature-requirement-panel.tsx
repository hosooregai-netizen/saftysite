import type { SignatureTask } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type SignatureRequirementPanelProps = {
  tasks: SignatureTask[];
};

export function SignatureRequirementPanel({ tasks }: SignatureRequirementPanelProps) {
  const requiredPending = tasks.filter(
    (task) => task.required && task.status !== "completed" && task.status !== "waived",
  ).length;

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SignatureRequirementPanel</p>
          <h3 className="panel-title">서명/날인 요구사항</h3>
          <p className="card-copy">제출 전 필수 서명 task와 signed file 연결 여부를 먼저 확인합니다.</p>
        </div>
        <StatusBadge tone={requiredPending > 0 ? "warning" : "success"} label={requiredPending > 0 ? "pending" : "ready"} />
      </div>
      <div className="stack-list">
        {tasks.map((task) => (
          <article className="ops-item" key={task.id}>
            <strong>{task.title}</strong>
            <span>{task.taskType}</span>
            <span>{task.required ? "필수" : "선택"} · {task.signedFileId ?? "signed file 미연결"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
