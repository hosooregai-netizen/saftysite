import Link from "next/link";

import { ErpShell } from "../../../../../components/erp-shell";
import { SafetyHealthLedgerTable } from "../../../../../components/safety-health-ledger-table";
import { loadProjectSafetyHealthLedgersPageData } from "../../../../../lib/safety-health-ledger-page-data";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyHealthLedgersPage({ params }: Props) {
  const { projectId } = await params;
  const pageData = await loadProjectSafetyHealthLedgersPageData(projectId);
  const totalMissing = pageData.items.reduce((sum, item) => sum + item.missingRequiredCount, 0);
  const totalWarnings = pageData.items.reduce((sum, item) => sum + item.warningCount, 0);
  const reviewCount = pageData.items.filter((item) => item.ledger.status === "review").length;
  const exportedCount = pageData.items.filter((item) => item.ledger.status === "exported").length;

  return (
    <ErpShell title="안전보건대장" subtitle="Project Document / Project ledger 기준으로 장기 누적 대장을 관리합니다.">
      <section className="hero-card report-hub-hero ledger-hub-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Safety Health Ledger Hub</p>
            <h2 className="hero-title">프로젝트 누적 안전보건대장</h2>
            <p className="hero-subtitle">
              안전관리계획서, 점검이력, 지적/조치, 산업안전보건관리비를 하나의 장기 원장으로 누적 관리합니다.
            </p>
          </div>
          <div className="status-stack">
            <span className="pill outline">Project Root</span>
            <span className="pill outline">장기 누적 문서</span>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card"><span>대장 수</span><strong>{pageData.items.length}건</strong></article>
          <article className="hero-summary-card"><span>필수 누락</span><strong>{totalMissing}건</strong></article>
          <article className="hero-summary-card"><span>검토 경고</span><strong>{totalWarnings}건</strong></article>
          <article className="hero-summary-card"><span>검토중</span><strong>{reviewCount}건</strong></article>
        </div>
        <div className="contract-health-grid ledger-health-grid">
          <article className="contract-health-card">
            <div className="contract-health-head">
              <strong>반영 상태</strong>
              <span className="status info">누적 원장</span>
            </div>
            <p>{exportedCount}건</p>
            <span>최종본까지 생성된 대장 수</span>
          </article>
          <article className="contract-health-card">
            <div className="contract-health-head">
              <strong>데이터 소스</strong>
              <span className="status review">{pageData.dataSource}</span>
            </div>
            <p>{pageData.dataSource === "api" ? "API" : "Draft"}</p>
            <span>계획 데이터와 실행 데이터의 연결 상태</span>
          </article>
        </div>
      </section>
      <div className="feature-split">
        <div className="section-stack">
          <SafetyHealthLedgerTable items={pageData.items} />
        </div>
        <div className="feature-side-stack">
          <section className="panel report-quick-panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Quick Actions</p>
                <h3 className="panel-title">누적 대장 작업</h3>
              </div>
            </div>
            <div className="ops-card-list">
              <article className="ops-item">
                <strong>새 안전보건대장</strong>
                <span>프로젝트 문서 기준으로 누적 ledger 초안을 생성합니다.</span>
                <Link className="inline-link" href={`/projects/${projectId}/documents/safety-health-ledgers/new`}>초안 생성</Link>
              </article>
              <article className="ops-item">
                <strong>반복 위험 검토</strong>
                <span>같은 위험유형과 회차 반복 지적을 한 화면에서 검토합니다.</span>
              </article>
              <article className="ops-item">
                <strong>회차별 보고서와 구분</strong>
                <span>이 화면은 발주처 제출용 회차 보고서가 아니라 프로젝트 전체 기간 원장을 다룹니다.</span>
              </article>
            </div>
          </section>
        </div>
      </div>
    </ErpShell>
  );
}
