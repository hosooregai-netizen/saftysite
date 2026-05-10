import { ErpShell } from "../../../components/erp-shell";
import { ProjectExtractionPreview } from "../../../components/project-extraction-preview";
import { ContactForm, ProjectForm, ProjectPartyForm } from "../../../components/project-forms";
import { ProjectImpactWarningPanel } from "../../../components/project-impact-warning-panel";
import { ProjectRequiredFieldPanel } from "../../../components/project-required-field-panel";
import { ProjectHeroPanel, ProjectReportPreview } from "../../../components/project-summary-cards";
import { getSampleProjectData } from "../../../lib/project-demo-data";
import { loadProjectCreationDraft } from "../../../lib/project-page-data";

export default async function NewProjectPage() {
  const sample = getSampleProjectData("project-draft-preview");
  const creationDraft = await loadProjectCreationDraft();

  return (
    <ErpShell
      title="새 프로젝트 등록"
      subtitle="기본정보, 발주처, 시공사, 엔지니어링사, 담당자, 점검조건, 보고서 제출조건을 한 번에 확인하는 Feature 01 폼 스켈레톤입니다."
    >
      <ProjectHeroPanel
        parties={sample.projectParties}
        project={sample.project}
        relatedCounts={sample.relatedCounts}
      />
      <div className="feature-split">
        <div className="feature-side-stack">
          <ProjectForm project={sample.project} />
          <ProjectPartyForm parties={sample.projectParties} />
          <ContactForm contacts={sample.contacts} />
        </div>
        <div className="feature-side-stack">
          <ProjectRequiredFieldPanel requirements={sample.requirements} />
          <ProjectImpactWarningPanel />
        </div>
      </div>
      <ProjectExtractionPreview
        preview={creationDraft.extractionPreview}
        projectId={creationDraft.draftProjectId}
        validation={creationDraft.extractionValidation}
      />
      <ProjectReportPreview parties={sample.projectParties} project={sample.project} />
    </ErpShell>
  );
}
