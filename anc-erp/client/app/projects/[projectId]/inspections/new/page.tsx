import { ErpShell } from "../../../../../components/erp-shell";
import { InspectionRoundForm } from "../../../../../components/inspection-round-form";
import { ProjectDetailLayout } from "../../../../../components/project-detail-layout";
import { loadInspectionRoundCreateData } from "../../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function NewInspectionRoundPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadInspectionRoundCreateData(projectId);
  return (
    <ErpShell title="점검회차 수동 등록" subtitle="Project 하위에서 roundNo, 예정월, 담당자 연결 구조를 먼저 검토합니다.">
      <ProjectDetailLayout activeLabel="점검회차" projectId={projectId}>
        <InspectionRoundForm
          round={{
            projectId,
            roundNo: pageData.suggestedRoundNo,
            status: "planned",
            name: `${pageData.suggestedRoundNo}회 점검`,
            documentInstances: [],
          }}
          contacts={pageData.contacts}
          projectParties={pageData.projectParties}
          projectId={projectId}
        />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
