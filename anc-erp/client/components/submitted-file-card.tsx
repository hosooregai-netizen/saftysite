import type { FileAsset } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type SubmittedFileCardProps = {
  file?: FileAsset | null;
};

export function SubmittedFileCard({ file }: SubmittedFileCardProps) {
  return (
    <section className="panel report-submitted-file-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SubmittedFileCard</p>
          <h3 className="panel-title">제출 파일 확인</h3>
        </div>
        <StatusBadge tone={file ? "success" : "warning"} label={file ? "최종본 연결" : "파일 미생성"} />
      </div>
      <div className="ops-card-list">
        <article className="ops-item">
          <strong>파일명</strong>
          <span>{file?.fileName ?? "미생성"}</span>
        </article>
        <article className="ops-item">
          <strong>웹하드 경로</strong>
          <span>{file?.storagePath ?? "경로 미연결"}</span>
        </article>
        <article className="ops-item">
          <strong>fileId</strong>
          <span>{file?.id ?? "없음"}</span>
        </article>
      </div>
    </section>
  );
}
