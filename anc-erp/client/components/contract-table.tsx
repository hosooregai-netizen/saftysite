import Link from "next/link";

import type { ContractListItem } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { ContractStatusBadge } from "./contract-status-badge";
import { StatusBadge } from "./status-badge";

export function ContractTable({ items }: { items: ContractListItem[] }) {
  if (items.length === 0) {
    return (
      <section className="card empty-state-card">
        <div className="card-head">
          <div>
            <p className="card-eyebrow">ContractTable</p>
            <h3>등록된 계약서가 없습니다.</h3>
            <p>프로젝트 원장 정보를 기반으로 기술용역계약서 또는 견적서를 생성하세요.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractTable</p>
          <h3>프로젝트 계약 목록</h3>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>계약명</th>
            <th>유형</th>
            <th>발주처</th>
            <th>계약상대자</th>
            <th>금액</th>
            <th>계약기간</th>
            <th>지급조건</th>
            <th>문서상태</th>
            <th>파일상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.contract.id}>
              <td>
                <Link className="inline-link" href={`/contracts/${item.contract.id}`}>
                  {item.contract.contractTitle}
                </Link>
              </td>
              <td>{item.contract.contractType}</td>
              <td>{item.clientNames.join(", ")}</td>
              <td>A&C기술사사무소</td>
              <td>{formatCurrency(item.contract.contractAmount)}</td>
              <td>
                {item.contract.contractStartDate ?? "-"} ~ {item.contract.contractEndDate ?? "-"}
              </td>
              <td>
                <div className="status-stack">
                  <span>{item.paymentTermCount}건</span>
                  <StatusBadge
                    tone={item.warnings.includes("paymentTermAmountMismatch") ? "warning" : "success"}
                    label={item.warnings.includes("paymentTermAmountMismatch") ? "합계 불일치" : "합계 일치"}
                  />
                </div>
              </td>
              <td><ContractStatusBadge status={item.contract.status} /></td>
              <td>
                <div className="status-stack">
                  <StatusBadge tone={item.contract.finalFileId ? "submitted" : "neutral"} label={item.contract.finalFileId ? "최종본" : "최종본 없음"} />
                  <StatusBadge tone={item.contract.signedFileId ? "success" : "warning"} label={item.contract.signedFileId ? "날인본" : "날인본 대기"} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
