import type { Submission } from "../../packages/contracts/src";

type OwnerSubmissionMatrixProps = {
  items: Array<{ submission: Submission }>;
};

export function OwnerSubmissionMatrix({ items }: OwnerSubmissionMatrixProps) {
  const grouped = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.submission.ownerPartyId] = (acc[item.submission.ownerPartyId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">OwnerSubmissionMatrix</p>
          <h3 className="panel-title">발주처별 제출 현황</h3>
        </div>
      </div>
      <div className="approval-summary-grid approval-summary-grid-tight">
        {Object.entries(grouped).map(([ownerPartyId, count]) => (
          <article className="ops-item" key={ownerPartyId}>
            <strong>{ownerPartyId}</strong>
            <span>{count}건</span>
          </article>
        ))}
      </div>
    </section>
  );
}
