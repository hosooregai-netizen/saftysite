import Link from "next/link";

import { ErpShell } from "../../../../../components/erp-shell";
import { PlanFilterBar } from "../../../../../components/plan-filter-bar";
import { SafetyManagementPlanTable } from "../../../../../components/safety-management-plan-table";
import { loadProjectSafetyManagementPlansPageData } from "../../../../../lib/safety-management-plan-page-data";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSafetyManagementPlansPage({ params }: Props) {
  const { projectId } = await params;
  const pageData = await loadProjectSafetyManagementPlansPageData(projectId);
  const totalMissing = pageData.items.reduce((sum, item) => sum + item.missingRequiredCount, 0);
  const totalWarnings = pageData.items.reduce((sum, item) => sum + item.warningCount, 0);

  return (
    <ErpShell title="안전관리계획서" subtitle="Project Document 기준 계획서 원장과 개정본 이력을 관리합니다.">
      <section className="hero-card report-hub-hero">
        <div className="hero-head">
          <div>
            <p className="card-eyebrow">Safety Management Plan Hub</p>
            <h2 className="hero-title">프로젝트 단위 계획 문서 작업실</h2>
            <p className="hero-subtitle">
              공종별 위험요인과 감소대책, 안전조직, 교육, 비상연락망, 첨부자료를 문서형 워크플로우로 정리합니다.
            </p>
          </div>
        </div>
        <div className="hero-summary-grid">
          <article className="hero-summary-card">
            <span>계획서 수</span>
            <strong>{pageData.items.length}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>필수 누락</span>
            <strong>{totalMissing}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>검토 경고</span>
            <strong>{totalWarnings}건</strong>
          </article>
          <article className="hero-summary-card">
            <span>데이터 소스</span>
            <strong>{pageData.dataSource}</strong>
          </article>
        </div>
      </section>
      <PlanFilterBar />
      <div className="feature-split">
        <div className="section-stack">
          <SafetyManagementPlanTable items={pageData.items} />
        </div>
        <div className="feature-side-stack">
          <section className="panel report-quick-panel">
            <div className="card-head">
              <div>
                <p className="card-eyebrow">Quick Actions</p>
                <h3 className="panel-title">문서 작업</h3>
              </div>
            </div>
            <div className="ops-card-list">
              <article className="ops-item">
                <strong>새 안전관리계획서</strong>
                <span>프로젝트 원장과 계약 연결 기준으로 초안을 만듭니다.</span>
                <Link className="inline-link" href={`/projects/${projectId}/documents/safety-management-plans/new`}>초안 생성</Link>
              </article>
              <article className="ops-item">
                <strong>공정표 연결</strong>
                <span>첨부자료 탭에서 공정표와 조직도 연결 여부를 확인합니다.</span>
              </article>
              <article className="ops-item">
                <strong>위험요인 후보 생성</strong>
                <span>공종 기준 draft register 또는 체크리스트 import를 바로 검토합니다.</span>
              </article>
            </div>
          </section>
        </div>
      </div>
    </ErpShell>
  );
}
