import type { RiskReductionChecklistItem } from "../../packages/contracts/src";

export function RiskReductionChecklistTable({ items }: { items: RiskReductionChecklistItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">RiskReductionChecklistTable</p>
          <h3>위험성 감소대책</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>분야</th>
            <th>결과</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.no}</td>
              <td>{item.field}</td>
              <td>{item.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
