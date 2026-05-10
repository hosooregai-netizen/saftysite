import { ComposePanel } from "../../../../../components/compose-panel";
import { ErpShell } from "../../../../../components/erp-shell";
import { loadMailComposePageData } from "../../../../../lib/mail-page-data";

type ProjectMailComposePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectMailComposePage({ params }: ProjectMailComposePageProps) {
  const { projectId } = await params;
  const pageData = await loadMailComposePageData(projectId);

  return (
    <ErpShell title={`프로젝트 메일 작성 · ${projectId}`} subtitle="projectId를 루트 키로 유지한 메일 초안을 작성합니다.">
      <ComposePanel draft={pageData.draft} templates={pageData.templates} />
    </ErpShell>
  );
}
