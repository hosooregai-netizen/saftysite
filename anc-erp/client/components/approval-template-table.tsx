import type { ApprovalTemplateDetailResponse } from "../../packages/contracts/src";

type ApprovalTemplateTableProps = {
  items: ApprovalTemplateDetailResponse[];
};

export function ApprovalTemplateTable({ items }: ApprovalTemplateTableProps) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ApprovalTemplateTable</p>
          <h3 className="panel-title">결재 템플릿 표</h3>
        </div>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>이름</span>
          <span>문서 유형</span>
          <span>상태</span>
        </div>
        {items.map((item) => (
          <div className="table-row" key={item.template.id}>
            <span className="approval-table-document">
              <strong>{item.template.name}</strong>
              <small>{item.steps.length}단계</small>
            </span>
            <span>{item.template.documentType}</span>
            <span>{item.template.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
