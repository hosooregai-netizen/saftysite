import type { FileAsset } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function FilePreviewPanel({
  file,
  previewPath,
  previewStatus,
}: {
  file: FileAsset;
  previewPath: string;
  previewStatus: string;
}) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">FilePreviewPanel</p>
          <h3 className="panel-title">미리보기</h3>
          <p className="inline-link-meta">문서형 파일은 A4 느낌으로, 일반 파일은 경로와 상태 중심으로 확인합니다.</p>
        </div>
        <StatusBadge tone={previewStatus === "ready" ? "success" : previewStatus === "failed" ? "danger" : "info"} label={previewStatus} />
      </div>
      <div className="a4-preview">
        <div className="a4-surface">
          <div className="a4-paper">
            <div className="a4-watermark">WEBHARD PREVIEW</div>
            <h4>{file.fileName}</h4>
            <div className="a4-meta">
              <div className="a4-line medium" />
              <div className="a4-line short" />
            </div>
            <div className="a4-table">
              <div className="a4-row">
                <span>source</span>
                <span>{file.source ?? "-"}</span>
                <span>{file.linkedEntityType}</span>
              </div>
              <div className="a4-row">
                <span>preview</span>
                <span>{previewStatus}</span>
                <span>{file.previewStatus ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="missing-panel">
          <strong>미리보기 경로</strong>
          <div className="missing-list">
            <div className="missing-item">
              <strong>{previewPath}</strong>
              <span>실제 바이너리 스트리밍 전 단계에서는 저장 경로와 preview 상태를 먼저 검토합니다.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
