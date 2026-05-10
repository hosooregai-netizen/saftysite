import { ErpShell } from "../../../../components/erp-shell";
import { OwnerReportStatusMatrix } from "../../../../components/owner-report-status-matrix";
import { OwnerReportTaskList } from "../../../../components/owner-report-task-list";
import { loadInspectionRoundDetailData } from "../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionOwnerReportsPage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadInspectionRoundDetailData(inspectionRoundId);
  return (
    <ErpShell title="발주처별 보고서" subtitle="같은 점검회차 안에서 ownerPartyId별 문서 작업 상태를 분리해서 관리합니다.">
      <OwnerReportTaskList items={pageData.detail.ownerReportTasks} />
      <OwnerReportStatusMatrix items={pageData.detail.ownerReportTasks} />
    </ErpShell>
  );
}
