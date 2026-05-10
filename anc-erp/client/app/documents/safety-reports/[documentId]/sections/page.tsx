import { ErpShell } from "../../../../../components/erp-shell";
import { RefreshLinkedDataButton } from "../../../../../components/refresh-linked-data-button";
import { SectionStatusTable } from "../../../../../components/section-status-table";
import { loadSafetyReportDetailPageData } from "../../../../../lib/safety-report-page-data";

type SafetyReportSectionsPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function SafetyReportSectionsPage({
  params,
}: SafetyReportSectionsPageProps) {
  const { documentId } = await params;
  const pageData = await loadSafetyReportDetailPageData(documentId);

  return (
    <ErpShell
      title={`섹션 관리 · ${documentId}`}
      subtitle="section status, 재생성, updatedAt을 함께 보면서 linked data drift를 점검합니다."
    >
      <div className="section-stack">
        <RefreshLinkedDataButton documentId={documentId} />
        <SectionStatusTable documentId={documentId} sections={pageData.detail.sections} />
      </div>
    </ErpShell>
  );
}
