import { ImpactPanel, LegalClauseApprovalPanel } from "../../../components/admin-governance-components";
import { ErpShell } from "../../../components/erp-shell";
import { LegalClauseTable } from "../../../components/legal-clause-table";
import { loadAdminLegalClausesPageData } from "../../../lib/admin-page-data";

export default async function AdminLegalClausesPage() {
  const pageData = await loadAdminLegalClausesPageData();
  return (
    <ErpShell title="법령 문구" subtitle="review / approve / publish 절차가 필요한 법령 문구 저장소입니다.">
      <LegalClauseTable clauses={pageData.clauses} />
      {pageData.clauses[0] ? <LegalClauseApprovalPanel clause={pageData.clauses[0]} /> : null}
      <ImpactPanel title="legal impact" items={pageData.clauses.map((clause) => `${clause.clauseCode} · ${clause.status}`)} />
    </ErpShell>
  );
}
