import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { ProjectActivityTimeline } from "../../../../components/project-summary-cards";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectHistoryPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);

  return (
    <ErpShell title="이력 탭" subtitle="프로젝트 변경사항이 하위 문서에 미치는 영향을 추적합니다.">
      <ProjectDetailLayout activeLabel="이력" projectId={projectId}>
        <ProjectActivityTimeline items={pageData.history} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
