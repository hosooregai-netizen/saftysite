import type { ChecklistItem } from "../../packages/contracts/src";

export function ChecklistItemEditor({ items }: { items: ChecklistItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ChecklistItemEditor</p>
          <h3>템플릿 항목</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>카테고리</th>
            <th>항목</th>
            <th>보고서 라벨</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.categoryKey}</td>
              <td>{item.title}</td>
              <td>{item.reportLabel ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
