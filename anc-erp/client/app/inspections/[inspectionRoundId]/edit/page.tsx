import { ErpShell } from "../../../../components/erp-shell";
import { InspectionRescheduleModal } from "../../../../components/inspection-reschedule-modal";
import { InspectionRoundForm } from "../../../../components/inspection-round-form";
import { loadInspectionRoundCreateData, loadInspectionRoundDetailData } from "../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionRoundEditPage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const detail = await loadInspectionRoundDetailData(inspectionRoundId);
  const createData = await loadInspectionRoundCreateData(detail.detail.project.id);
  return (
    <ErpShell title="점검회차 수정" subtitle="점검일, 확인자, 상태 변경은 round update와 reschedule log를 분리해서 관리합니다.">
      <InspectionRoundForm
        round={detail.detail.round}
        contacts={createData.contacts}
        projectParties={createData.projectParties}
        projectId={detail.detail.project.id}
        inspectionRoundId={inspectionRoundId}
      />
      <InspectionRescheduleModal inspectionRoundId={inspectionRoundId} logs={detail.detail.rescheduleLogs} />
    </ErpShell>
  );
}
