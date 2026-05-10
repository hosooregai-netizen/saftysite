import { ScheduleCoordinationMailComposer } from "../../../../components/schedule-coordination-mail-composer";
import { ErpShell } from "../../../../components/erp-shell";
import { loadScheduleCoordinationMailComposerPageData } from "../../../../lib/mail-page-data";

type InspectionMailPageProps = {
  params: Promise<{ inspectionRoundId: string }>;
};

export default async function InspectionMailPage({ params }: InspectionMailPageProps) {
  const { inspectionRoundId } = await params;
  const pageData = await loadScheduleCoordinationMailComposerPageData(inspectionRoundId);

  return (
    <ErpShell title={`점검회차 메일 · ${inspectionRoundId}`} subtitle="InspectionRound linked communication flow입니다.">
      <ScheduleCoordinationMailComposer draft={pageData.draft} templates={pageData.templates} />
    </ErpShell>
  );
}
