import type { PublicShareResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function PublicShareView({ detail }: { detail: PublicShareResponse }) {
  return (
    <section className="card webhard-public-share-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PublicShareView</p>
          <h2>{detail.shareLink.title ?? detail.file?.fileName ?? detail.folder?.name ?? "공유 자료"}</h2>
          <p>외부 공유 화면에서는 제목, 다운로드 가능 여부, 대상 파일/폴더만 간단히 노출합니다.</p>
        </div>
        <StatusBadge tone={detail.downloadAllowed ? "submitted" : "warning"} label={detail.downloadAllowed ? "download" : "view only"} />
      </div>
      {detail.file ? <p>파일: {detail.file.fileName}</p> : null}
      {detail.folder ? <p>폴더: {detail.folder.path}</p> : null}
    </section>
  );
}
