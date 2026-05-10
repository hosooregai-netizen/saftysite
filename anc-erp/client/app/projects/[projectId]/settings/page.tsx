import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { ProjectForm } from "../../../../components/project-forms";
import { ProjectImpactWarningPanel } from "../../../../components/project-impact-warning-panel";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSettingsPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);

  return (
    <ErpShell title="설정 탭" subtitle="보관 정책, 알림, 폴더 정책, 원장 수정 기준을 확인합니다.">
      <ProjectDetailLayout activeLabel="설정" projectId={projectId}>
        <ProjectForm project={pageData.aggregate.project} />
        <ProjectImpactWarningPanel />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
