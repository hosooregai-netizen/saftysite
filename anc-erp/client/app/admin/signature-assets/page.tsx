import { ErpShell } from "../../../components/erp-shell";
import { SealAssetPicker } from "../../../components/seal-asset-picker";
import { SignatureAssetPicker } from "../../../components/signature-asset-picker";
import { SignatureAssetTable } from "../../../components/signature-asset-table";
import { loadAdminSignatureAssetsPageData } from "../../../lib/admin-page-data";

export default async function SignatureAssetsAdminPage() {
  const pageData = await loadAdminSignatureAssetsPageData();
  return (
    <ErpShell title="Signature Assets" subtitle="직인/서명 자산 관리 화면입니다.">
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Signature Asset Admin</p>
            <h2 className="hero-title">서명 자산과 날인 자산 관리</h2>
            <p className="hero-subtitle">문서별 서명 task가 참조하는 자산을 중앙에서 정리하고, 최종 제출용 파일과의 혼동을 줄입니다.</p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>asset count</span>
            <strong>{pageData.assets.length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>signature</span>
            <strong>{pageData.assets.filter((asset) => asset.assetType === "signature").length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>seal</span>
            <strong>{pageData.assets.filter((asset) => asset.assetType === "seal").length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>active</span>
            <strong>{pageData.assets.filter((asset) => asset.status === "active").length}개</strong>
          </article>
        </div>
      </section>
      <SignatureAssetTable items={pageData.assets} />
      <SignatureAssetPicker items={pageData.assets} mode="admin" />
      <SealAssetPicker items={pageData.assets} mode="admin" />
      <section className="panel">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">Signature Assets</p>
            <h3 className="panel-title">서명 자산</h3>
            <p className="card-copy">서명 유형, 연결 파일, 상태를 문서 통제 관점에서 점검합니다.</p>
          </div>
        </div>
        <div className="stack-list">
          {pageData.assets.map((asset) => (
            <article className="ops-item" key={asset.id}>
              <strong>{asset.label}</strong>
              <span>{asset.assetType}</span>
              <span>{asset.fileId} · {asset.status}</span>
            </article>
          ))}
        </div>
      </section>
    </ErpShell>
  );
}
