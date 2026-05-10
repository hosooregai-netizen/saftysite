import type { Contract, ContractParty, PaymentTerm } from "../../packages/contracts/src";
import { formatCurrency } from "../lib/project-demo-data";
import { ContractStatusBadge } from "./contract-status-badge";
import { StatusBadge } from "./status-badge";

export function ContractAmountSummary({
  contract,
  parties = [],
  paymentTerms = [],
}: {
  contract: Contract;
  parties?: ContractParty[];
  paymentTerms?: PaymentTerm[];
}) {
  const shareAmountSum = parties.reduce((sum, item) => sum + (item.shareAmount ?? 0), 0);
  const paymentAmountSum = paymentTerms.reduce((sum, item) => sum + item.amount, 0);
  const splitTone =
    parties.length === 0 || shareAmountSum === contract.contractAmount ? "success" : "warning";
  const paymentTone =
    paymentTerms.length === 0 || paymentAmountSum === contract.contractAmount ? "success" : "warning";

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">ContractAmountSummary</p>
          <h3>계약 금액 요약</h3>
          <p>VAT 포함 여부, 지급조건 합계, 발주처별 분담금액 합계를 함께 확인합니다.</p>
        </div>
        <div className="badge-row">
          <StatusBadge
            tone={contract.vatIncluded ? "info" : "warning"}
            label={contract.vatIncluded ? "VAT 포함" : "VAT 별도"}
          />
          <ContractStatusBadge status={contract.status} />
        </div>
      </div>
      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">총 계약금액</p>
          <p className="stat-value">{formatCurrency(contract.contractAmount)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">공급가액</p>
          <p className="stat-value">{formatCurrency(contract.supplyAmount)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">VAT</p>
          <p className="stat-value">{formatCurrency(contract.vatAmount)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">점검횟수</p>
          <p className="stat-value">{contract.inspectionCount ?? "-"}</p>
        </article>
      </div>
      <div className="contract-health-grid">
        <article className="contract-health-card">
          <div className="contract-health-head">
            <strong>지급조건 합계</strong>
            <StatusBadge tone={paymentTone} label={paymentTone === "success" ? "일치" : "불일치"} />
          </div>
          <p>{formatCurrency(paymentAmountSum || contract.contractAmount)}</p>
          <span>계약금액 대비 {formatCurrency(contract.contractAmount)}</span>
        </article>
        <article className="contract-health-card">
          <div className="contract-health-head">
            <strong>발주처 분담 합계</strong>
            <StatusBadge tone={splitTone} label={splitTone === "success" ? "일치" : "검토 필요"} />
          </div>
          <p>{formatCurrency(shareAmountSum || contract.contractAmount)}</p>
          <span>복수 발주처 split 검증</span>
        </article>
      </div>
    </section>
  );
}

export function ContractSummaryCard({
  contract,
  clientNames = [],
}: {
  contract: Contract;
  clientNames?: string[];
}) {
  return (
    <section className="card contract-summary-card">
      <div className="card-head contract-summary-head">
        <div>
          <p className="card-eyebrow">ContractSummaryCard</p>
          <h3>{contract.contractTitle}</h3>
          <p>{contract.serviceName}</p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>
      <div className="badge-row" style={{ marginBottom: 16 }}>
        <StatusBadge tone="info" label={contract.contractType} />
        <StatusBadge tone="submitted" label={contract.finalFileId ? "최종본 연결" : "최종본 없음"} />
        <StatusBadge tone={contract.signedFileId ? "success" : "warning"} label={contract.signedFileId ? "날인본 연결" : "날인본 필요"} />
      </div>
      <table className="table">
        <tbody>
          <tr>
            <th>발주처</th>
            <td>{clientNames.join(", ") || "미설정"}</td>
          </tr>
          <tr>
            <th>용역범위</th>
            <td>{contract.serviceScope}</td>
          </tr>
          <tr>
            <th>계약기간</th>
            <td>{contract.contractStartDate ?? "-"} ~ {contract.contractEndDate ?? "-"}</td>
          </tr>
          <tr>
            <th>산출물</th>
            <td>{contract.deliverables.join(", ") || "-"}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
