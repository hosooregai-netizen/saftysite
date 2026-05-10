import type { ContractDetailResponse } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

export function ContractPartySplitEditor({ parties }: { parties: ContractDetailResponse["parties"] }) {
  const totalRatio = parties.reduce((sum, item) => sum + (item.shareRatio ?? 0), 0);
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractPartySplitEditor</p>
          <h3>발주처 분담 구조</h3>
        </div>
        <StatusBadge tone={totalRatio === 100 ? "success" : "warning"} label={`합계 ${totalRatio}%`} />
      </div>
      <div className="link-list">
        {parties
          .filter((item) => item.role.startsWith("client"))
          .map((party) => (
            <span className="pill" key={party.id}>
              {party.displayName} {party.shareRatio ?? 0}%
            </span>
          ))}
      </div>
    </section>
  );
}
