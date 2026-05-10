import type { DocumentInstance } from "../../packages/contracts/src";

type DocumentVersionCardProps = {
  document: DocumentInstance;
};

export function DocumentVersionCard({ document }: DocumentVersionCardProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">DocumentVersionCard</p>
          <h3 className="panel-title">문서 버전 정보</h3>
        </div>
      </div>
      <div className="stack-list">
        <article className="ops-item">
          <strong>latestVersionNo</strong>
          <span>{document.latestVersionNo ?? "미지정"}</span>
        </article>
        <article className="ops-item">
          <strong>documentNo</strong>
          <span>{document.documentNo ?? "미지정"}</span>
        </article>
        <article className="ops-item">
          <strong>status</strong>
          <span>{document.status}</span>
        </article>
      </div>
    </section>
  );
}
