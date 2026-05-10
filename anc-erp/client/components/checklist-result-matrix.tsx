import type { ChecklistResult } from "../../packages/contracts/src";

export function ChecklistResultMatrix({ results }: { results: ChecklistResult[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistResultMatrix</p>
          <h3>검토 매트릭스</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>항목</th>
            <th>결과</th>
            <th>후보</th>
            <th>사진</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id}>
              <td>{result.item?.title ?? result.checklistItemId}</td>
              <td>{result.result}</td>
              <td>{result.findingCandidateId ?? "-"}</td>
              <td>{result.photoIds.length}건</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
