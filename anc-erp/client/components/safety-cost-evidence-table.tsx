import type { SafetyCostEvidence } from "../../packages/contracts/src";

type SafetyCostEvidenceTableProps = {
  items: SafetyCostEvidence[];
};

export function SafetyCostEvidenceTable({ items }: SafetyCostEvidenceTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyCostEvidenceTable</p>
          <h3 className="panel-title">증빙파일 목록</h3>
        </div>
      </div>
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>파일명</th>
              <th>유형</th>
              <th>발행일</th>
              <th>제출자</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.fileName}</td>
                <td>{item.evidenceType}</td>
                <td>{item.issuedDate ?? "-"}</td>
                <td>{item.submittedBy ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
