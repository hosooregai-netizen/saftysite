import { ErpShell } from "../../../../../../components/erp-shell";
import { MissingPhotoWarningPanel } from "../../../../../../components/missing-photo-warning-panel";
import { PhotoLedgerA4Preview } from "../../../../../../components/photo-ledger-a4-preview";
import { PhotoLedgerEntryTable } from "../../../../../../components/photo-ledger-entry-table";
import { StatusBadge } from "../../../../../../components/status-badge";
import { loadDocumentPhotoLedgerSectionPageData } from "../../../../../../lib/finding-page-data";
import type { PhotoLedgerDetailResponse } from "../../../../../../../packages/contracts/src";

type DocumentPhotoLedgerSectionPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentPhotoLedgerSectionPage({ params }: DocumentPhotoLedgerSectionPageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentPhotoLedgerSectionPageData(documentId);
  const detail = pageData.payload as unknown as PhotoLedgerDetailResponse;

  return (
    <ErpShell
      title={`photo_ledger section · ${documentId}`}
      subtitle="DocumentInstance 내부 photo_ledger section은 InspectionRound 원본 사진대지에서 동기화됩니다."
    >
      <section className="section-stack">
        <section className="hero-card">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Document Section / photo_ledger</p>
              <h2 className="hero-title">문서 반영용 사진대지 section 검토</h2>
              <p className="hero-subtitle">
                InspectionRound 원본 사진대지에서 동기화된 항목과 문서 section 연결 상태를 함께 확인합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone={pageData.dataSource === "api" ? "success" : "review"} label={pageData.dataSource === "api" ? "API 연결" : "샘플 데이터"} />
              <StatusBadge tone="info" label={`Document ${documentId}`} />
              <StatusBadge tone="review" label={`${detail.entries.length}개 항목`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <article className="hero-summary-card">
              <span>photoLedgerId</span>
              <strong>{detail.photoLedger.id}</strong>
            </article>
            <article className="hero-summary-card">
              <span>InspectionRound</span>
              <strong>{detail.photoLedger.inspectionRoundId}</strong>
            </article>
            <article className="hero-summary-card">
              <span>발주처 분기</span>
              <strong>{detail.photoLedger.ownerPartyId ?? "공통"}</strong>
            </article>
            <article className="hero-summary-card">
              <span>경고</span>
              <strong>{detail.warnings.length}건</strong>
            </article>
          </div>
        </section>

        <section className="feature-split">
          <div className="section-stack">
            <PhotoLedgerA4Preview detail={detail} />
            <PhotoLedgerEntryTable entries={detail.entries} />
          </div>
          <div className="section-stack">
            <MissingPhotoWarningPanel warnings={detail.warnings} />
            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Section Linkage</p>
                  <h3>문서 section 연결 정보</h3>
                </div>
              </div>
              <div className="ops-card-list">
                <article className="ops-item">
                  <strong>DocumentInstance</strong>
                  <span>{documentId} 문서의 photo_ledger section으로 연결됩니다.</span>
                </article>
                <article className="ops-item">
                  <strong>원본 기준</strong>
                  <span>{detail.photoLedger.inspectionRoundId} 회차의 사진대지 원본을 기준으로 유지합니다.</span>
                </article>
                <article className="ops-item">
                  <strong>내보내기 기준</strong>
                  <span>최신 저장 snapshot과 확정 항목을 기준으로 A4 미리보기를 구성합니다.</span>
                </article>
              </div>
            </section>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}
