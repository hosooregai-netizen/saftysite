import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { ProjectImpactWarningPanel } from "../../../../components/project-impact-warning-panel";
import { ProjectRequiredFieldPanel } from "../../../../components/project-required-field-panel";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectRequirementsPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);

  return (
    <ErpShell title="누락정보 탭" subtitle="문서, 계약, 점검, 메일 제출 전에 필요한 필수값을 확인합니다.">
      <ProjectDetailLayout activeLabel="누락정보" projectId={projectId}>
        <ProjectRequiredFieldPanel requirements={pageData.requirements} />
        <ProjectImpactWarningPanel />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
