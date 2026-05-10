import Link from "next/link";

import type { PromptListItem } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

function getPromptTone(status: PromptListItem["prompt"]["status"]) {
  switch (status) {
    case "published":
      return "success";
    case "review":
      return "warning";
    case "draft":
      return "review";
    case "deprecated":
    case "archived":
      return "danger";
    default:
      return "neutral";
  }
}

export function PromptTable({ items }: { items: PromptListItem[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">PromptTable</p>
          <h3 className="panel-title">프롬프트 목록</h3>
          <p className="card-copy">feature별 service AI 프롬프트와 최근 테스트 실행 이력을 같이 보여줍니다.</p>
        </div>
      </div>
      <div className="admin-filter-row">
        <span className="switcher">service_ai 중심</span>
        <span className="switcher">실패 테스트 우선</span>
        <span className="switcher">reverse/design 분리</span>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>프롬프트</span>
          <span>타입/feature</span>
          <span>테스트/상태</span>
        </div>
        {items.map((item) => (
          <div className="table-row" key={item.prompt.id}>
            <span className="approval-table-document">
              <strong>
                <Link href={`/admin/prompts/${item.prompt.id}`}>{item.prompt.name}</Link>
              </strong>
              <small>{item.prompt.promptKey}</small>
            </span>
            <span>
              <strong>{item.prompt.promptType}</strong> / {item.prompt.featureId}
              <small className="table-subtext">최근 테스트 {item.currentVersion?.lastTestRunAt ?? "미실행"}</small>
            </span>
            <span className="status-stack">
              <StatusBadge tone={getPromptTone(item.prompt.status)} label={item.prompt.status} />
              <small className="table-subtext">{item.testCaseCount} cases / {item.runLogCount} logs</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
