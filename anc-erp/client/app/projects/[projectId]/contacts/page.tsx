import { ErpShell } from "../../../../components/erp-shell";
import { ContactTable } from "../../../../components/contact-table";
import { ContactForm } from "../../../../components/project-forms";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectContactsPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);
  const { aggregate } = pageData;

  return (
    <ErpShell title="연락처 탭" subtitle="조직별 담당자와 보고서/조치요청 수신 여부를 관리합니다.">
      <ProjectDetailLayout activeLabel="연락처" projectId={projectId}>
        <ContactTable contacts={aggregate.contacts} organizations={aggregate.organizations} />
        <ContactForm contacts={aggregate.contacts} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
