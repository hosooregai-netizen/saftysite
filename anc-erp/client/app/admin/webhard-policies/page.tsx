import { ErpShell } from "../../../components/erp-shell";
import { WebhardPolicyPanel } from "../../../components/webhard-policy-panel";
import { loadAdminWebhardPolicyPageData } from "../../../lib/admin-page-data";

export default async function AdminWebhardPoliciesPage() {
  const pageData = await loadAdminWebhardPolicyPageData();
  return (
    <ErpShell title="웹하드 정책" subtitle="공유 만료일, generated/submission 폴더명, 최종본 잠금 정책을 중앙에서 통제합니다.">
      <WebhardPolicyPanel policy={pageData.policy} />
    </ErpShell>
  );
}
