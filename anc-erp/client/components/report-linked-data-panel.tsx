import Link from "next/link";

import type { SafetyReportDetailResponse } from "../../packages/contracts/src";

type ReportLinkedDataPanelProps = {
  detail: SafetyReportDetailResponse;
};

export function ReportLinkedDataPanel({ detail }: ReportLinkedDataPanelProps) {
  return (
    <section className="panel report-linked-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Linked Data</p>
          <h3 className="panel-title">원본 연결 상태</h3>
        </div>
      </div>
      <div className="ops-card-list report-linked-grid">
        <article className="ops-item">
          <strong>체크리스트</strong>
          <span>{detail.linkedDataSummary.checklistResults}건</span>
        </article>
        <article className="ops-item">
          <strong>지적사항 / 조치</strong>
          <span>{detail.linkedDataSummary.findings}건</span>
        </article>
        <article className="ops-item">
          <strong>사진대지 / 산안비</strong>
          <span>
            {detail.linkedDataSummary.photoLedgers} / {detail.linkedDataSummary.safetyCostUsages}
          </span>
        </article>
        <article className="ops-item">
          <strong>일정 첨부</strong>
          <span>{detail.linkedDataSummary.attachments}건</span>
        </article>
        <article className="ops-item">
          <strong>발주처 업무</strong>
          <span>
            {detail.linkedOwnerReportTask ? (
              <Link
                className="inline-link"
                href={`/inspections/${detail.document.inspectionRoundId}/owner-reports/${detail.linkedOwnerReportTask.id}/document`}
              >
                {detail.linkedOwnerReportTask.ownerDisplayName}
              </Link>
            ) : (
              "미연결"
            )}
          </span>
        </article>
      </div>
    </section>
  );
}
