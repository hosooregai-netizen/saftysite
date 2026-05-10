import Link from "next/link";

import type { FindingListItem } from "../../packages/contracts/src";
import { FindingRiskBadge } from "./finding-risk-badge";
import { FindingStatusBadge } from "./finding-status-badge";
import { StatusBadge } from "./status-badge";

type FindingTableProps = {
  items: FindingListItem[];
  title?: string;
};

export function FindingTable({ items, title = "지적사항 목록" }: FindingTableProps) {
  const warningLabelMap: Record<string, string> = {
    findingPhotoMissing: "지적사진 누락",
    actionPhotoMissing: "조치사진 누락",
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Finding Table</p>
          <h3>{title}</h3>
          <p>회차 원본 지적사항, 조치 상태, 사진 연결 상태를 한 표에서 빠르게 읽도록 구성했습니다.</p>
        </div>
        <StatusBadge tone="info" label={`${items.length}건`} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>지적사항</th>
            <th>발주처</th>
            <th>위험유형</th>
            <th>조치요청</th>
            <th>사진</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.finding.id}>
              <td>
                <Link className="inline-link strong" href={`/findings/${item.finding.id}`}>
                  {item.finding.title}
                </Link>
                <div className="table-subtext">{item.finding.detail}</div>
                <div className="badge-row">
                  <StatusBadge tone="info" label={item.finding.sourceType ?? "manual"} />
                  <StatusBadge
                    tone={item.finding.reportInclude ? "submitted" : "review"}
                    label={item.finding.reportInclude ? "보고서 반영" : "내부 검토"}
                  />
                </div>
              </td>
              <td>{item.ownerDisplayName ?? "-"}</td>
              <td>
                <FindingRiskBadge riskType={item.finding.riskType} />
              </td>
              <td>
                {item.finding.requiredAction || "-"}
                <div className="table-subtext">기한: {item.finding.dueDate ?? "미정"}</div>
                {item.correctiveActionStatus ? (
                  <div className="badge-row">
                    <StatusBadge tone="review" label={`조치현황 ${item.correctiveActionStatus}`} />
                  </div>
                ) : null}
              </td>
              <td>
                <div className="status-stack">
                  <StatusBadge tone="review" label={`지적 ${item.findingPhotoCount}장`} />
                  <StatusBadge
                    tone={item.actionPhotoCount > 0 ? "success" : "warning"}
                    label={`조치 ${item.actionPhotoCount}장`}
                  />
                </div>
              </td>
              <td>
                <div className="status-stack">
                  <FindingStatusBadge status={item.finding.status} />
                  {item.warnings.map((warning, index) => (
                    <StatusBadge
                      key={`${warning}-${index}`}
                      tone={warning.includes("Missing") ? "warning" : "info"}
                      label={warningLabelMap[warning] ?? warning}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
