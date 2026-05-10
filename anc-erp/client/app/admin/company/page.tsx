import { LogoUploader, SealUploader } from "../../../components/admin-governance-components";
import { CompanyProfileForm } from "../../../components/company-profile-form";
import { ErpShell } from "../../../components/erp-shell";
import { loadAdminCompanyPageData } from "../../../lib/admin-page-data";

export default async function AdminCompanyPage() {
  const pageData = await loadAdminCompanyPageData();
  return (
    <ErpShell title="회사 정보" subtitle="문서 footer, 메일 footer, 로고/직인 파일 등 전역 회사 기본값을 관리합니다.">
      <CompanyProfileForm companyProfile={pageData.companyProfile} />
      <LogoUploader companyProfile={pageData.companyProfile} />
      <SealUploader companyProfile={pageData.companyProfile} />
    </ErpShell>
  );
}
