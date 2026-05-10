import Link from "next/link";

import { ErpShell } from "../../../../components/erp-shell";
import { EstimateTable } from "../../../../components/estimate-table";
import { ProjectDetailLayout } from "../../../../components/project-detail-layout";
import { loadProjectEstimatesPageData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectEstimatesPage({ params }: PageProps) {
  const { projectId } = await params;
  const pageData = await loadProjectEstimatesPageData(projectId);

  return (
    <ErpShell title="견적 목록" subtitle="Estimate도 Contract와 동일하게 Project 소유입니다.">
      <ProjectDetailLayout activeLabel="계약/견적" projectId={projectId}>
        <section className="card">
          <div className="card-head">
            <div>
              <p className="card-eyebrow">Project Detail &gt; Estimates</p>
              <h3>견적서 허브</h3>
            </div>
            <Link className="inline-link" href={`/projects/${projectId}/estimates/new`}>
              신규 견적 초안
            </Link>
          </div>
        </section>
        <EstimateTable items={pageData.estimates} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
