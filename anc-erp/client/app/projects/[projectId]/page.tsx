import { ErpShell } from "../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../components/project-detail-layout";
import { ProjectExtractionPreview } from "../../../components/project-extraction-preview";
import { ProjectImpactWarningPanel } from "../../../components/project-impact-warning-panel";
import { ProjectRequiredFieldPanel } from "../../../components/project-required-field-panel";
import {
  ProjectHeroPanel,
  ProjectReportPreview,
  ProjectSummaryCard,
  RelatedCountCards,
} from "../../../components/project-summary-cards";
import { RelatedWorkTabs } from "../../../components/related-work-tabs";
import { loadProjectDetailData } from "../../../lib/project-page-data";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);
  const { aggregate, relatedCounts, requirements, extractionPreview, extractionValidation } = pageData;

  return (
    <ErpShell
      title={aggregate.project.projectName}
      subtitle="프로젝트 상세는 이후 계약, 점검회차, 문서, 웹하드, 메일의 실제 부모 컨테이너입니다."
    >
      <ProjectHeroPanel
        parties={aggregate.projectParties}
        project={aggregate.project}
        relatedCounts={relatedCounts}
      />
      <ProjectDetailLayout activeLabel="개요" projectId={projectId}>
        <ProjectSummaryCard project={aggregate.project} relatedCounts={relatedCounts} />
        <RelatedCountCards counts={relatedCounts} />
        <div className="feature-split">
          <div className="feature-side-stack">
            <RelatedWorkTabs counts={relatedCounts} projectId={projectId} />
            <ProjectReportPreview parties={aggregate.projectParties} project={aggregate.project} />
          </div>
          <div className="feature-side-stack">
            <ProjectRequiredFieldPanel requirements={requirements} />
            <ProjectImpactWarningPanel />
          </div>
        </div>
        <ProjectExtractionPreview
          preview={extractionPreview}
          projectId={projectId}
          validation={extractionValidation}
        />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
