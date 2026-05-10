import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { ContractAmountSummary } from "../../../../components/contract-amount-summary";
import { ContractTable } from "../../../../components/contract-table";
import { EstimateTable } from "../../../../components/estimate-table";
import { MissingFieldPanel } from "../../../../components/missing-field-panel";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { StatusBadge } from "../../../../components/status-badge";
import { loadProjectContractsPageData } from "../../../../lib/contract-page-data";
import { formatCurrency } from "../../../../lib/project-demo-data";

type ProjectContractsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectContractsPage({
  params,
}: ProjectContractsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectContractsPageData(projectId);
  const primaryContract = pageData.contracts[0]?.contract;
  const primaryClients = primaryContract
    ? pageData.contracts[0]?.clientNames ?? []
    : [];
  const totalEstimateAmount = pageData.estimates.reduce(
    (sum, item) => sum + item.estimate.totalAmount,
    0,
  );

  return (
    <ErpShell title="계약/견적 탭" subtitle="Project root 아래에서 계약서와 견적서를 함께 관리합니다.">
      <ProjectDetailLayout activeLabel="계약/견적" projectId={projectId}>
        <section className="hero-card contract-hub-hero">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Project Detail &gt; Contracts</p>
              <h2 className="hero-title">계약/견적 허브</h2>
              <p className="hero-subtitle">
                프로젝트 계약 조건, 발주처별 분담금액, 지급조건, 최종본/날인본을 한 화면에서 검토합니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={`${pageData.contracts.length}개 계약`} />
              <StatusBadge tone="review" label={`${pageData.estimates.length}개 견적`} />
              <StatusBadge tone={pageData.dataSource === "api" ? "success" : "warning"} label={pageData.dataSource === "api" ? "실데이터" : "샘플 데이터"} />
            </div>
          </div>
          <div className="hero-summary-grid">
            <article className="hero-summary-card">
              <span>대표 계약금액</span>
              <strong>{primaryContract ? formatCurrency(primaryContract.contractAmount) : "-"}</strong>
            </article>
            <article className="hero-summary-card">
              <span>발주처 분기</span>
              <strong>{primaryClients.join(" / ") || "미설정"}</strong>
            </article>
            <article className="hero-summary-card">
              <span>총 견적 합계</span>
              <strong>{formatCurrency(totalEstimateAmount)}</strong>
            </article>
            <article className="hero-summary-card">
              <span>빠른 작업</span>
              <strong>계약 초안, 견적 초안, 파일 업로드</strong>
            </article>
          </div>
        </section>
        <div className="feature-split">
          <div className="feature-side-stack">
            {primaryContract ? (
              <ContractAmountSummary
                contract={primaryContract}
                parties={pageData.aggregate.projectParties
                  .filter((item) => item.role === "owner")
                  .map((party) => ({
                    id: party.id,
                    contractId: primaryContract.id,
                    organizationId: party.organizationId,
                    projectPartyId: party.id,
                    role: "client",
                    displayName:
                      pageData.aggregate.organizations.find((org) => org.id === party.organizationId)?.name ?? party.organizationId,
                    shareRatio: party.shareRatio,
                    shareAmount: party.shareAmount,
                    paymentRequired: true,
                    signingRequired: true,
                    displayOrder: party.displayOrder,
                    createdAt: party.createdAt,
                    updatedAt: party.updatedAt,
                  }))}
              />
            ) : null}
            <ContractTable items={pageData.contracts} />
            <EstimateTable items={pageData.estimates} />
          </div>
          <div className="feature-side-stack">
            <section className="card">
              <div className="card-head">
                <div>
                  <p className="card-eyebrow">Quick Actions</p>
                  <h3>빠른 작업</h3>
                </div>
              </div>
              <div className="link-list">
                <Link className="inline-link" href={`/projects/${projectId}/contracts/new`}>
                  계약서 생성
                </Link>
                <Link className="inline-link" href={`/projects/${projectId}/estimates/new`}>
                  견적서 생성
                </Link>
                {primaryContract ? (
                  <Link className="inline-link" href={`/contracts/${primaryContract.id}/files`}>
                    계약서 파일 업로드
                  </Link>
                ) : null}
              </div>
            </section>
            <MissingFieldPanel
              title="계약 검토 경고"
              items={[
                {
                  label: "분담비율 합계",
                  reason: "발주처별 분담비율 합계가 100%인지 지급조건 계산 전 확인합니다.",
                  severity: "recommended",
                },
                {
                  label: "지급조건 합계",
                  reason: "1차기성/준공금 합계가 계약금액과 일치하지 않으면 export 전 경고가 유지됩니다.",
                  severity: "required",
                },
                {
                  label: "날인본 상태",
                  reason: "signed 상태 전환 전 날인본 파일이 연결되어야 합니다.",
                  severity: "required",
                },
              ]}
            />
          </div>
        </div>
      </ProjectDetailLayout>
    </ErpShell>
  );
}
