import Link from "next/link";

import { ErpShell } from "../../../../../../components/erp-shell";
import { OwnerReportBranchNotice } from "../../../../../../components/owner-report-branch-notice";
import { SafetyReportSummaryCard } from "../../../../../../components/safety-report-summary-card";
import { StatusBadge } from "../../../../../../components/status-badge";
import { loadOwnerReportTaskDocumentPageData } from "../../../../../../lib/safety-report-page-data";

type OwnerReportTaskDocumentPageProps = {
  params: Promise<{ inspectionRoundId: string; ownerReportTaskId: string }>;
};

export default async function OwnerReportTaskDocumentPage({
  params,
}: OwnerReportTaskDocumentPageProps) {
  const { inspectionRoundId, ownerReportTaskId } = await params;
  const pageData = await loadOwnerReportTaskDocumentPageData(inspectionRoundId, ownerReportTaskId);
  const ownerTask = pageData.ownerTask;

  return (
    <ErpShell
      title={`발주처 보고서 작업 · ${ownerReportTaskId}`}
      subtitle="InspectionRound의 owner report task에서 직접 문서 생성·검토·제출 흐름으로 진입합니다."
    >
      <div className="section-stack">
        <section className="hero-card">
          <div className="hero-head">
            <div>
              <p className="card-eyebrow">Owner Report Task</p>
              <h2 className="hero-title">{ownerTask?.ownerDisplayName ?? ownerReportTaskId}</h2>
              <p className="hero-subtitle">
                발주처 업무 상태와 문서 instance를 같은 화면에서 확인하고 바로 보고서 상세로 이어집니다.
              </p>
            </div>
            <div className="hero-badges">
              <StatusBadge tone="info" label={inspectionRoundId} />
              <StatusBadge tone="review" label={ownerTask?.status ?? "not_started"} />
            </div>
          </div>
        </section>
        <OwnerReportBranchNotice
          ownerDisplayName={ownerTask?.ownerDisplayName ?? "미지정"}
          ownerPartyId={ownerTask?.ownerPartyId ?? "미지정"}
        />
        <SafetyReportSummaryCard detail={pageData.detail} />
        <Link className="primary-button" href={`/documents/safety-reports/${pageData.detail.document.id}`}>
          문서 상세로 이동
        </Link>
      </div>
    </ErpShell>
  );
}

