import { ErpShell } from "../../../../../components/erp-shell";
import { SubmissionPackageBuilder } from "../../../../../components/submission-package-builder";
import { SubmissionReadinessPanel } from "../../../../../components/submission-readiness-panel";
import { loadDocumentSubmissionPageData } from "../../../../../lib/approval-page-data";

type DocumentSubmissionNewPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentSubmissionNewPage({ params }: DocumentSubmissionNewPageProps) {
  const { documentId } = await params;
  const pageData = await loadDocumentSubmissionPageData(documentId);

  return (
    <ErpShell title={`New Submission: ${documentId}`} subtitle="신규 제출 패키지 생성 화면입니다.">
      <SubmissionReadinessPanel readiness={pageData.readiness} />
      <SubmissionPackageBuilder
        documentId={documentId}
        mainFileId={pageData.readiness.package?.mainFileId ?? pageData.readiness.document.exportedFileId}
        packageId={pageData.readiness.package?.id}
      />
    </ErpShell>
  );
}
