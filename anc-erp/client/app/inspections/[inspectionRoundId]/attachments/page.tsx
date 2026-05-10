import { ErpShell } from "../../../../components/erp-shell";
import { WorkScheduleAttachmentPanel } from "../../../../components/work-schedule-attachment-panel";
import { WorkSchedulePreview } from "../../../../components/work-schedule-preview";
import { loadInspectionRoundDetailData } from "../../../../lib/inspection-page-data";

type PageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionAttachmentsPage({ params }: PageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadInspectionRoundDetailData(inspectionRoundId);
  return (
    <ErpShell title="공사일정 첨부" subtitle="공정표 파일도 inspectionRoundId와 projectId 연결을 유지한 채 관리합니다.">
      <WorkScheduleAttachmentPanel inspectionRoundId={inspectionRoundId} items={pageData.detail.attachments} />
      <WorkSchedulePreview item={pageData.detail.attachments[0] ?? null} />
    </ErpShell>
  );
}
