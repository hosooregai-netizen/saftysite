import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { MissingPhotoWarningPanel } from "../../../../components/missing-photo-warning-panel";
import { OwnerPhotoLedgerFilter } from "../../../../components/owner-photo-ledger-filter";
import { PhotoLedgerA4Preview } from "../../../../components/photo-ledger-a4-preview";
import { PhotoLedgerEntryTable } from "../../../../components/photo-ledger-entry-table";
import { PhotoLedgerExportChecklist } from "../../../../components/photo-ledger-export-checklist";
import { PhotoPairMatcher } from "../../../../components/photo-pair-matcher";
import { StatusBadge } from "../../../../components/status-badge";
import { loadPhotoLedgerRoundPageData } from "../../../../lib/finding-page-data";

type PhotoLedgerPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function PhotoLedgerPage({ params }: PhotoLedgerPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadPhotoLedgerRoundPageData(inspectionRoundId);
  const ownerNames = Array.from(
    new Set(pageData.detail.findings.map((item) => item.ownerPartyId).filter(Boolean)),
  ) as string[];
  const confirmedCount = pageData.detail.entries.filter((entry) => entry.confirmed).length;
  const warningCount = pageData.detail.warnings.length;
  const completionRate =
    pageData.detail.entries.length === 0 ? 0 : Math.round((confirmedCount / pageData.detail.entries.length) * 100);

  return (
    <ErpShell
      title={`사진대지 · ${inspectionRoundId}`}
      subtitle="사진대지는 InspectionRound 원본 업무이면서 DocumentInstance photo_ledger section으로 동기화됩니다."
    >
      <section className="section-stack">
        <section className="hero-card">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Photo Ledger Builder</p>
              <h2 className="hero-title">지적사진·조치사진을 문서형 사진대지로 정리</h2>
              <p className="hero-subtitle">
                회차 원본 사진을 짝지어 검토하고, 경고를 확인한 뒤 photo_ledger section으로 동기화하기 전 상태를 읽는
                화면입니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone={pageData.dataSource === "api" ? "success" : "review"} label={pageData.dataSource === "api" ? "API 연결" : "샘플 데이터"} />
              <StatusBadge tone="info" label={pageData.detail.photoLedger.status} />
              <StatusBadge tone="review" label={`${ownerNames.length}개 발주처`} />
            </div>
          </div>
          <div className="hero-progress-row">
            <div className="hero-progress-label">
              확정 진행률
              <span className="hero-progress-value">{completionRate}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <article className="hero-summary-card">
              <span>전체 항목</span>
              <strong>{pageData.detail.entries.length}개</strong>
            </article>
            <article className="hero-summary-card">
              <span>확정 항목</span>
              <strong>{confirmedCount}개</strong>
            </article>
            <article className="hero-summary-card">
              <span>경고</span>
              <strong>{warningCount}건</strong>
            </article>
            <article className="hero-summary-card">
              <span>문서 연계</span>
              <strong>{pageData.detail.photoLedger.documentId ?? "미연결"}</strong>
            </article>
          </div>
        </section>

        <section className="feature-split">
          <div className="section-stack">
            <OwnerPhotoLedgerFilter ownerNames={ownerNames} />
            <PhotoPairMatcher entries={pageData.detail.entries} />
            <PhotoLedgerEntryTable entries={pageData.detail.entries} />
          </div>
          <div className="section-stack">
            <MissingPhotoWarningPanel warnings={pageData.detail.warnings} />
            <PhotoLedgerA4Preview detail={pageData.detail} />
            <PhotoLedgerExportChecklist
              photoLedgerId={pageData.detail.photoLedger.id}
              warnings={pageData.detail.warnings}
            />
            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Photo Ledger Routes</p>
                  <h3>추가 작업</h3>
                </div>
              </div>
              <div className="link-list">
                <Link className="inline-link" href={`/inspections/${inspectionRoundId}/photo-ledger/new`}>
                  새 사진대지 생성
                </Link>
                <Link className="inline-link" href={`/photo-ledgers/${pageData.detail.photoLedger.id}/preview`}>
                  A4 미리보기
                </Link>
              </div>
            </section>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}
