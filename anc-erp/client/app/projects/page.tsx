import { ErpShell } from "../../components/erp-shell";
import { ProjectExtractionPreview } from "../../components/project-extraction-preview";
import { ProjectFilterBar } from "../../components/project-filter-bar";
import { ProjectTable } from "../../components/project-table";
import { ProjectRequiredFieldPanel } from "../../components/project-required-field-panel";
import { ProjectHeroPanel, ProjectReportPreview, ProjectWorkPanel } from "../../components/project-summary-cards";
import { loadProjectsPageData } from "../../lib/project-page-data";

export default async function ProjectsPage() {
  const pageData = await loadProjectsPageData();
  const primary = pageData.primaryAggregate;

  return (
    <ErpShell
      title="프로젝트 / 현장 원장"
      subtitle="Project가 모든 업무의 루트입니다. 발주처·시공사·담당자·점검조건을 구조화해 이후 계약, 점검, 문서, 웹하드, 메일로 연결합니다."
    >
      <ProjectHeroPanel
        parties={primary.projectParties}
        project={primary.project}
        relatedCounts={primary.relatedCounts}
      />
      <ProjectFilterBar />
      <div className="feature-split">
        <ProjectTable items={pageData.projects} />
        <div className="feature-side-stack">
          <ProjectWorkPanel
            ownerNames={primary.organizations.filter((item) => item.type === "owner").map((item) => item.name)}
            relatedCounts={primary.relatedCounts}
          />
          <ProjectRequiredFieldPanel requirements={pageData.primaryRequirements} />
        </div>
      </div>
      <ProjectExtractionPreview
        preview={pageData.extractionPreview}
        projectId="project-sample-001"
        validation={pageData.extractionValidation}
      />
      <ProjectReportPreview parties={primary.projectParties} project={primary.project} />
    </ErpShell>
  );
}
