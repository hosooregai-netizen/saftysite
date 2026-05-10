import type { ContractDetailResponse } from "../../packages/contracts/src";

export function ContractPartyTable({ parties }: { parties: ContractDetailResponse["parties"] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractPartyTable</p>
          <h3>계약 당사자</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>역할</th>
            <th>기관</th>
            <th>분담비율</th>
            <th>분담금액</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party) => (
            <tr key={party.id}>
              <td>{party.role}</td>
              <td>{party.displayName}</td>
              <td>{party.shareRatio ?? "-"}</td>
              <td>{party.shareAmount?.toLocaleString("ko-KR") ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
