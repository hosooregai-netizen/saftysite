import { ErpShell } from "../../../../components/erp-shell";
import { FindingTable } from "../../../../components/finding-table";
import { loadProjectFindingsPageData } from "../../../../lib/finding-page-data";

type ProjectFindingsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectFindingsPage({ params }: ProjectFindingsPageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectFindingsPageData(projectId);

  return (
    <ErpShell
      title={`프로젝트 지적사항 · ${projectId}`}
      subtitle="프로젝트 전체 지적사항을 발주처와 회차 기준으로 모아 보는 조회 화면입니다."
    >
      <FindingTable items={pageData.findings} title="프로젝트 전체 지적사항" />
    </ErpShell>
  );
}
