import type { ContractVersion } from "../../packages/contracts/src";

export function ContractVersionHistory({ versions }: { versions: ContractVersion[] }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractVersionHistory</p>
          <h3>계약 버전 이력</h3>
        </div>
      </div>
      <ul>
        {versions.map((version) => (
          <li key={version.id}>
            v{version.versionNo} · {version.templateKey} · {version.createdAt}
          </li>
        ))}
      </ul>
    </section>
  );
}
