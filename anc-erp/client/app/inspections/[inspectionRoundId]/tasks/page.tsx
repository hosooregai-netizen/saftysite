import { ErpShell } from "../../../../components/erp-shell";
import { InspectionReminderPanel } from "../../../../components/inspection-reminder-panel";
import { InspectionTaskChecklist } from "../../../../components/inspection-task-checklist";
import { loadInspectionRoundDetailData } from "../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionTasksPage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadInspectionRoundDetailData(inspectionRoundId);
  return (
    <ErpShell title="회차 업무" subtitle="D-30부터 제출까지의 round task를 inspectionRoundId 기준으로 묶어 관리합니다.">
      <InspectionReminderPanel items={pageData.detail.tasks} />
      <InspectionTaskChecklist items={pageData.detail.tasks} />
    </ErpShell>
  );
}
