import Link from "next/link";

import type { DocumentTemplateListItem } from "../../packages/contracts/src";
import { StatusBadge } from "./status-badge";

function getTemplateTone(status: DocumentTemplateListItem["template"]["status"]) {
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

export function TemplateTable({ items }: { items: DocumentTemplateListItem[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">TemplateTable</p>
          <h3 className="panel-title">문서 템플릿 목록</h3>
          <p className="card-copy">문서 유형, 현재 버전, 변수 추출 상태를 함께 보고 publish 가능한지 빠르게 판단합니다.</p>
        </div>
      </div>
      <div className="admin-filter-row">
        <span className="switcher">published 우선</span>
        <span className="switcher">review 추적</span>
        <span className="switcher">owner-specific 변수 확인</span>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>템플릿</span>
          <span>버전/섹션/검증</span>
          <span>상태</span>
        </div>
        {items.map((item) => (
          <div className="table-row" key={item.template.id}>
            <span className="approval-table-document">
              <strong>
                <Link href={`/admin/document-templates/${item.template.id}`}>{item.template.name}</Link>
              </strong>
              <small>{item.template.documentType}</small>
            </span>
            <span>
              <strong>v{item.currentVersion?.versionNo ?? "-"}</strong> / {item.sectionCount} sections / {item.variableCount} vars
              <small className="table-subtext">
                검증 {item.currentVersion?.validationPassed ? "완료" : "대기"} / 미리보기 {item.currentVersion?.previewPassed ? "완료" : "대기"}
              </small>
            </span>
            <span className="status-stack">
              <StatusBadge tone={getTemplateTone(item.template.status)} label={item.template.status} />
              <small className="table-subtext">{item.currentVersion?.publishedBy ?? item.template.updatedAt}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
