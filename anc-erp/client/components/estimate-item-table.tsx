import type { EstimateItem } from "../../packages/contracts/src";

export function EstimateItemTable({ items }: { items: EstimateItem[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">EstimateItemTable</p>
          <h3>견적 항목</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>항목</th>
            <th>수량</th>
            <th>단가</th>
            <th>총액</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.label}</td>
              <td>{item.quantity}</td>
              <td>{item.unitPrice.toLocaleString("ko-KR")}원</td>
              <td>{item.totalAmount.toLocaleString("ko-KR")}원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
