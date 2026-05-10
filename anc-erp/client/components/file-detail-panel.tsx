import type { FileDetailResponse } from "../../packages/contracts/src";
import { FileLinkTargetPanel } from "./file-link-target-panel";
import { FileTagEditor } from "./file-tag-editor";
import { FileVersionPanel } from "./file-version-panel";
import { FileActivityTimeline } from "./file-activity-timeline";
import { ShareLinkList } from "./share-link-list";
import { StatusBadge } from "./status-badge";

export function FileDetailPanel({ detail }: { detail: FileDetailResponse }) {
  const hasMissingLinks = detail.links.length === 0;
  const hasMissingShares = detail.shareLinks.length === 0;

  return (
    <div className="content-grid">
      <section className="panel webhard-detail-card">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">FileDetailPanel</p>
            <h3 className="panel-title">기본 정보</h3>
            <p className="inline-link-meta">문서 연결, 저장 위치, 파일 상태를 운영 관점으로 검토합니다.</p>
          </div>
          <div className="status-stack">
            <StatusBadge tone={detail.file.isLocked ? "review" : "info"} label={detail.file.status ?? "active"} />
            {detail.file.source ? <StatusBadge tone="submitted" label={detail.file.source} /> : null}
          </div>
        </div>
        <table className="table">
          <tbody>
            <tr><th>파일명</th><td>{detail.file.fileName}</td></tr>
            <tr><th>경로</th><td>{detail.file.storagePath}</td></tr>
            <tr><th>연결</th><td>{detail.file.linkedEntityType} / {detail.file.linkedEntityId}</td></tr>
            <tr><th>업로드자</th><td>{detail.file.uploadedBy ?? "-"}</td></tr>
            <tr><th>상태</th><td>{detail.file.status}</td></tr>
          </tbody>
        </table>
      </section>
      {(hasMissingLinks || hasMissingShares) ? (
        <section className="missing-panel">
          <strong>추적 누락 점검</strong>
          <div className="missing-list">
            {hasMissingLinks ? (
              <div className="missing-item">
                <strong>업무 연결 없음</strong>
                <span>문서, 점검, 메일, 제출 중 어느 흐름과 연결되는지 남겨야 후속 추적이 쉬워집니다.</span>
              </div>
            ) : null}
            {hasMissingShares ? (
              <div className="missing-item">
                <strong>공유 링크 없음</strong>
                <span>외부 전달 대상이면 공유 링크 생성 또는 제출 링크 여부를 확인해야 합니다.</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      <FileTagEditor fileId={detail.file.id} tags={detail.file.tags ?? []} />
      <FileLinkTargetPanel fileId={detail.file.id} links={detail.links} />
      <FileVersionPanel fileId={detail.file.id} versions={detail.versions} />
      <ShareLinkList items={detail.shareLinks} />
      <FileActivityTimeline activities={detail.activities} />
    </div>
  );
}
