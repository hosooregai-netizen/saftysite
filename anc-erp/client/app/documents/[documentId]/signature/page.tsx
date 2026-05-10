import { ApprovalStatusBadge } from "../../../../components/approval-status-badge";
import { ErpShell } from "../../../../components/erp-shell";
import { SealAssetPicker } from "../../../../components/seal-asset-picker";
import { SignatureAssetPicker } from "../../../../components/signature-asset-picker";
import { SignatureRequirementPanel } from "../../../../components/signature-requirement-panel";
import { SignatureTaskTable } from "../../../../components/signature-task-table";
import { SignedFileUploader } from "../../../../components/signed-file-uploader";
import { WebhardFinalFileCard } from "../../../../components/webhard-final-file-card";
import { loadDocumentSignaturePageData } from "../../../../lib/approval-page-data";

type DocumentSignaturePageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentSignaturePage({
  params,
}: DocumentSignaturePageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentSignaturePageData(documentId);
  const signedFileId = pageData.tasks.tasks.find((item) => item.taskType === "signed_file_upload")?.signedFileId;
  const signatureReady = pageData.tasks.tasks.every(
    (task) => !task.required || task.status === "completed" || task.status === "waived",
  );

  return (
    <ErpShell
      title={`Signature: ${documentId}`}
      subtitle="서명/날인은 DocumentInstance 내부 task로만 표현합니다."
    >
      <section className="hero-card approval-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Signature Control</p>
            <h2 className="hero-title">{pageData.tasks.document.title}</h2>
            <p className="hero-subtitle">
              최종본과 날인본을 혼동하지 않도록 서명 task, 사용할 자산, signed file 연결 상태를 함께 검토합니다.
            </p>
          </div>
          <ApprovalStatusBadge status={signatureReady ? "completed" : "pending"} />
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>required task</span>
            <strong>{pageData.tasks.tasks.filter((item) => item.required).length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>signed file</span>
            <strong>{signedFileId ?? "미연결"}</strong>
          </article>
          <article className="hero-summary-card">
            <span>asset pool</span>
            <strong>{pageData.assets.length}개</strong>
          </article>
          <article className="hero-summary-card">
            <span>ownerPartyId</span>
            <strong>{pageData.tasks.document.ownerPartyId}</strong>
          </article>
        </div>
      </section>
      <section className="approval-workspace-layout">
        <div className="section-stack">
          <SignatureRequirementPanel tasks={pageData.tasks.tasks} />
          <SignatureTaskTable tasks={pageData.tasks.tasks} />
        </div>
        <div className="section-stack">
          <SignatureAssetPicker items={pageData.assets} />
          <SealAssetPicker items={pageData.assets} />
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Signature Assets</p>
                <h3 className="panel-title">사용 가능한 서명 자산</h3>
              </div>
            </div>
            <div className="stack-list">
              {pageData.assets.map((asset) => (
                <article className="ops-item" key={asset.id}>
                  <strong>{asset.label}</strong>
                  <span>{asset.assetType}</span>
                  <span>{asset.fileId}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
        <div className="section-stack">
          <WebhardFinalFileCard fileId={signedFileId} />
          <SignedFileUploader
            documentId={documentId}
            files={[]}
            finalFileId={pageData.tasks.document.exportedFileId}
            signedFileId={signedFileId}
          />
          <section className="panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Document Compare</p>
                <h3 className="panel-title">최종본 vs 날인본 확인</h3>
              </div>
            </div>
            <div className="stack-list">
              <article className="ops-item">
                <strong>exportedFileId</strong>
                <span>{pageData.tasks.document.exportedFileId ?? "미생성"}</span>
              </article>
              <article className="ops-item">
                <strong>signedFileId</strong>
                <span>{signedFileId ?? "미연결"}</span>
              </article>
            </div>
          </section>
        </div>
      </section>
    </ErpShell>
  );
}
