import type { PhotoLedgerEntry } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

type PhotoLedgerEntryTableProps = {
  entries: PhotoLedgerEntry[];
};

export function PhotoLedgerEntryTable({ entries }: PhotoLedgerEntryTableProps) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Photo Ledger Entry Table</p>
          <h3>사진대지 항목</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>순서</th>
            <th>지적사항</th>
            <th>지적사진</th>
            <th>조치사진</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.displayOrder}</td>
              <td>{entry.findingId}</td>
              <td>{entry.findingPhotoId ?? "미연결"}</td>
              <td>{entry.actionPhotoId ?? "미연결"}</td>
              <td>
                <StatusBadge tone={entry.confirmed ? "success" : "warning"} label={entry.confirmed ? "확정" : "검토"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
