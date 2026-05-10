import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { FindingTable } from "../../../../components/finding-table";
import { OwnerPhotoLedgerFilter } from "../../../../components/owner-photo-ledger-filter";
import { StatusBadge } from "../../../../components/status-badge";
import { loadRoundFindingsPageData } from "../../../../lib/finding-page-data";

type InspectionRoundFindingsPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionRoundFindingsPage({ params }: InspectionRoundFindingsPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadRoundFindingsPageData(inspectionRoundId);
  const ownerNames = Array.from(new Set(pageData.findings.map((item) => item.ownerDisplayName).filter(Boolean))) as string[];
  const reportIncludedCount = pageData.findings.filter((item) => item.finding.reportInclude).length;
  const actionRequestedCount = pageData.findings.filter((item) => item.finding.status === "action_requested").length;
  const verifiedCount = pageData.findings.filter((item) => item.finding.status === "verified").length;
  const warningCount = pageData.findings.reduce((count, item) => count + item.warnings.length, 0);

  return (
    <ErpShell
      title={`지적사항 · ${inspectionRoundId}`}
      subtitle="지적사항 원본은 InspectionRound에 귀속되고, 이후 조치현황과 사진대지로 확장됩니다."
    >
      <section className="section-stack">
        <section className="hero-card finding-hub-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Feature 06 / InspectionRound Source Work</p>
              <h2 className="hero-title">지적사항 원본 관리와 후속 조치 준비</h2>
              <p className="hero-subtitle">
                회차 기준 지적사항을 한 화면에서 검토하고, 발주처 분기와 사진대지 반영 여부를 동시에 확인할 수 있도록
                구성했습니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone={pageData.dataSource === "api" ? "success" : "review"} label={pageData.dataSource === "api" ? "API 연결" : "샘플 데이터"} />
              <StatusBadge tone="info" label={`InspectionRound ${inspectionRoundId}`} />
              <StatusBadge tone="review" label={`${ownerNames.length}개 발주처`} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <article className="hero-summary-card">
              <span>총 지적사항</span>
              <strong>{pageData.findings.length}건</strong>
            </article>
            <article className="hero-summary-card">
              <span>조치 요청 중</span>
              <strong>{actionRequestedCount}건</strong>
            </article>
            <article className="hero-summary-card">
              <span>확인 완료</span>
              <strong>{verifiedCount}건</strong>
            </article>
            <article className="hero-summary-card">
              <span>보고서 반영 예정</span>
              <strong>{reportIncludedCount}건</strong>
            </article>
          </div>
        </section>

        <section className="feature-split">
          <div className="section-stack">
            <OwnerPhotoLedgerFilter ownerNames={ownerNames} />
            <FindingTable items={pageData.findings} title="회차 지적사항" />
          </div>

          <div className="section-stack">
            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Operational Snapshot</p>
                  <h3>조치 및 반영 상태</h3>
                  <p>사진대지 반영과 회신 요청이 필요한 항목을 빠르게 읽을 수 있는 운영 요약입니다.</p>
                </div>
              </div>
              <div className="ops-card-list">
                <article className="ops-item">
                  <strong>사진/조치 경고</strong>
                  <span>{warningCount}건의 후속 확인 필요 항목이 남아 있습니다.</span>
                </article>
                <article className="ops-item">
                  <strong>Document section 연계</strong>
                  <span>{reportIncludedCount}건이 photo_ledger section 반영 대상으로 유지됩니다.</span>
                </article>
                <article className="ops-item">
                  <strong>발주처별 분기</strong>
                  <span>{ownerNames.length}개 발주처 필터로 지적사항과 사진대지 원본을 분리 검토합니다.</span>
                </article>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Feature 06 Routes</p>
                  <h3>후속 작업</h3>
                </div>
              </div>
              <div className="link-list">
                <Link className="inline-link" href={`/inspections/${inspectionRoundId}/findings/new`}>
                  수동 지적사항 등록
                </Link>
                <Link className="inline-link" href={`/inspections/${inspectionRoundId}/photo-ledger`}>
                  사진대지 이동
                </Link>
              </div>
            </section>
          </div>
        </section>
      </section>
    </ErpShell>
  );
}
