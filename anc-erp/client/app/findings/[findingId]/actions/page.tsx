import { ActionRequestMailButton } from "../../../../components/action-request-mail-button";
import { CorrectiveActionForm } from "../../../../components/corrective-action-form";
import { CorrectiveActionTable } from "../../../../components/corrective-action-table";
import { ErpShell } from "../../../../components/erp-shell";
import { VerificationPanel } from "../../../../components/verification-panel";
import { loadFindingDetailPageData } from "../../../../lib/finding-page-data";

type FindingActionsPageProps = {
  params: Promise<{ findingId: string }>;
};

export default async function FindingActionsPage({ params }: FindingActionsPageProps) {
  const { findingId } = await params;
  const pageData = await loadFindingDetailPageData(findingId);
  const firstAction = pageData.detail.correctiveActions[0];

  return (
    <ErpShell
      title={`조치현황 · ${pageData.detail.finding.title}`}
      subtitle="시공사 조치 등록, 확인, 반려와 메일 초안을 함께 검토합니다."
    >
      <section className="feature-split">
        <div className="section-stack">
          <CorrectiveActionForm
            findingId={pageData.detail.finding.id}
            findingTitle={pageData.detail.finding.title}
            action={firstAction}
          />
          <CorrectiveActionTable actions={pageData.detail.correctiveActions} />
        </div>
        <div className="section-stack">
          <VerificationPanel actions={pageData.detail.correctiveActions} />
          <ActionRequestMailButton
            contractorContactId="contact-contractor-001"
            draft={null}
            findingIds={[pageData.detail.finding.id]}
            inspectionRoundId={pageData.detail.finding.inspectionRoundId}
            ownerPartyId={pageData.detail.finding.ownerPartyId ?? null}
            projectId={pageData.detail.finding.projectId}
          />
        </div>
      </section>
    </ErpShell>
  );
}
