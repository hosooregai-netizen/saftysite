import Link from "next/link";

import type { SafetyHealthLedgerListItem } from "../../packages/contracts/src";
import { LedgerStatusBadge } from "./ledger-status-badge";

export function SafetyHealthLedgerTable({ items }: { items: SafetyHealthLedgerListItem[] }) {
  return (
    <section className="panel report-table-panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">SafetyHealthLedgerTable</p>
          <h3 className="panel-title">안전보건대장 목록</h3>
        </div>
        <div className="badge-row">
          <span className="pill outline">Project Ledger</span>
          <span className="pill outline">장기 누적 원장</span>
        </div>
      </div>
      <table className="data-table report-table">
        <thead>
          <tr>
            <th>제목</th>
            <th>템플릿</th>
            <th>상태</th>
            <th>누락</th>
            <th>경고</th>
            <th>버전</th>
            <th>수정일</th>
            <th>바로가기</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.ledger.id}>
              <td>
                <div className="report-table-title">
                  <strong>{item.ledger.title}</strong>
                  <span className="table-subcopy">프로젝트 전체 기간 누적 대장 · 최신 snapshot 기준 검토</span>
                </div>
              </td>
              <td>{item.ledger.templateId}</td>
              <td><LedgerStatusBadge label={item.ledger.status} /></td>
              <td>
                <span className={item.missingRequiredCount > 0 ? "ledger-metric danger" : "ledger-metric"}>
                  {item.missingRequiredCount}건
                </span>
              </td>
              <td>
                <span className={item.warningCount > 0 ? "ledger-metric warning" : "ledger-metric"}>
                  {item.warningCount}건
                </span>
              </td>
              <td>{item.latestVersion?.versionNo ?? "-"}</td>
              <td>{item.ledger.updatedAt.slice(0, 10)}</td>
              <td>
                <div className="report-row-actions">
                  <Link className="inline-link" href={`/documents/safety-health-ledgers/${item.ledger.id}`}>상세</Link>
                  <Link className="inline-link" href={`/documents/safety-health-ledgers/${item.ledger.id}/edit`}>편집</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
