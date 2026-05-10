import type { PhotoLedgerEntry } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type PhotoLedgerEntryCardProps = {
  entry: PhotoLedgerEntry;
};

export function PhotoLedgerEntryCard({ entry }: PhotoLedgerEntryCardProps) {
  return (
    <article className="card muted-card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Ledger Entry</p>
          <h4>{entry.findingId}</h4>
        </div>
        <StatusBadge tone={entry.confirmed ? "success" : "warning"} label={entry.confirmed ? "확정" : "검토"} />
      </div>
      <p>지적 캡션: {entry.findingCaption ?? "-"}</p>
      <p>조치 캡션: {entry.actionCaption ?? "-"}</p>
    </article>
  );
}
