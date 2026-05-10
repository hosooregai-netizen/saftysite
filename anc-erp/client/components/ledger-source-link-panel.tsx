import type { SourceLink } from "../../packages/contracts/src";

export function LedgerSourceLinkPanel({ links }: { links: SourceLink[] }) {
  return (
    <section className="panel ledger-source-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">LedgerSourceLinkPanel</p>
          <h3 className="panel-title">원본 연결</h3>
          <p className="card-copy">계획 데이터와 실행 데이터의 출처를 바로 확인할 수 있게 유지합니다.</p>
        </div>
      </div>
      <div className="ops-card-list">
        {links.map((link) => (
          <article className="ops-item ledger-source-item" key={link.id}>
            <strong>{link.sourceLabel}</strong>
            <span>{link.sourceEntityType} / {link.sourceEntityId}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
