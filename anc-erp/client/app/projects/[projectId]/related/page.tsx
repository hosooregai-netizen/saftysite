import { ErpShell } from "../../../../components/erp-shell";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { RelatedWorkTabs } from "../../../../components/related-work-tabs";
import { RelatedCountCards } from "../../../../components/project-summary-cards";
import { loadProjectDetailData } from "../../../../lib/project-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectRelatedPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectDetailData(projectId);

  return (
    <ErpShell title="관련업무 탭" subtitle="계약, 점검, 문서, 웹하드, 메일과의 연결 건수를 요약합니다.">
      <ProjectDetailLayout activeLabel="관련업무" projectId={projectId}>
        <RelatedCountCards counts={pageData.relatedCounts} />
        <RelatedWorkTabs counts={pageData.relatedCounts} projectId={projectId} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
