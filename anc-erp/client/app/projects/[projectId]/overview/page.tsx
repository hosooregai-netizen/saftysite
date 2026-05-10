import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import {
  ConstructionAmountCard,
  InspectionSummaryCard,
  ProjectHeroPanel,
  ProjectReportPreview,
  ProjectSummaryCard,
} from "../../../../components/project-summary-cards";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectOverviewPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);
  const { aggregate, relatedCounts } = pageData;

  return (
    <ErpShell title="프로젝트 개요" subtitle="공사개요, 금액, 공정율, 점검조건을 한 화면에서 검토합니다.">
      <ProjectHeroPanel
        parties={aggregate.projectParties}
        project={aggregate.project}
        relatedCounts={relatedCounts}
      />
      <ProjectDetailLayout activeLabel="개요" projectId={projectId}>
        <ProjectSummaryCard project={aggregate.project} relatedCounts={relatedCounts} />
        <div className="feature-split">
          <div className="feature-side-stack">
            <ConstructionAmountCard parties={aggregate.projectParties} project={aggregate.project} />
            <InspectionSummaryCard project={aggregate.project} relatedCounts={relatedCounts} />
          </div>
          <ProjectReportPreview parties={aggregate.projectParties} project={aggregate.project} />
        </div>
      </ProjectDetailLayout>
    </ErpShell>
  );
}
