import { ErpShell } from "../../../../components/erp-shell";
import { SubmissionDetailCard } from "../../../../components/submission-detail-card";
import { SubmissionMailDraftPanel } from "../../../../components/submission-mail-draft-panel";
import { loadSubmissionDetailPageData } from "../../../../lib/approval-page-data";

type SubmissionConfirmationPageProps = {
  params: Promise<{ submissionId: string }>;
};

export default async function SubmissionConfirmationPage({ params }: SubmissionConfirmationPageProps) {
  const { submissionId } = await params;
  const pageData = await loadSubmissionDetailPageData(submissionId);

  return (
    <ErpShell title={`Submission Confirmation: ${submissionId}`} subtitle="발주처 수령 확인, 보완 요청, 보관 처리를 위한 확인 화면입니다.">
      <SubmissionDetailCard detail={pageData.detail} />
      <SubmissionMailDraftPanel submissionId={submissionId} />
    </ErpShell>
  );
}
