import type { SignatureAsset } from "../../packages/contracts/src";

type SignatureAssetTableProps = {
  items: SignatureAsset[];
};

export function SignatureAssetTable({ items }: SignatureAssetTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SignatureAssetTable</p>
          <h3 className="panel-title">서명 자산 표</h3>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>자산</span>
          <span>유형</span>
          <span>상태</span>
        </div>
        {items.map((asset) => (
          <div className="table-row" key={asset.id}>
            <span className="approval-table-document">
              <strong>{asset.label}</strong>
              <small>{asset.fileId}</small>
            </span>
            <span>{asset.assetType}</span>
            <span>{asset.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
