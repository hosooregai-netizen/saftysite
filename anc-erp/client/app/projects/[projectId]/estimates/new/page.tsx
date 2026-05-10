import { ErpShell } from "../../../../../components/erp-shell";
import { EstimateForm } from "../../../../../components/estimate-form";
import { EstimateItemTable } from "../../../../../components/estimate-item-table";
import { ProjectDetailLayout } from "../../../../../components/project-detail-layout";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function NewEstimatePage({ params }: PageProps) {
  const { projectId } = await params;
  const estimate = {
    id: "estimate-draft-new",
    projectId,
    title: "",
    serviceName: "",
    validUntil: null,
    status: "draft" as const,
    supplyAmount: 0,
    vatAmount: 0,
    totalAmount: 0,
    items: [],
    createdAt: "",
    updatedAt: "",
  };

  return (
    <ErpShell title="신규 견적 초안" subtitle="견적서는 Project 하위 초안으로 작성한 뒤 Contract로 전환합니다.">
      <ProjectDetailLayout activeLabel="계약/견적" projectId={projectId}>
        <EstimateForm estimate={estimate} />
        <EstimateItemTable items={estimate.items} />
      </ProjectDetailLayout>
    </ErpShell>
  );
}
