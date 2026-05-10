import { StatusBadge } from "./status-badge";

type OwnerPhotoLedgerFilterProps = {
  ownerNames: string[];
};

export function OwnerPhotoLedgerFilter({ ownerNames }: OwnerPhotoLedgerFilterProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Owner Filter</p>
          <h3>발주처별 필터</h3>
        </div>
      </div>
      <div className="badge-row">
        {ownerNames.map((name) => (
          <StatusBadge key={name} tone="info" label={name} />
        ))}
      </div>
    </section>
  );
}
