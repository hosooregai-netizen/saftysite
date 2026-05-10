import { ErpShell } from "../../../components/erp-shell";
import { MailTemplateEditor } from "../../../components/mail-template-editor";
import { loadAdminMailTemplatesPageData } from "../../../lib/admin-page-data";

export default async function AdminMailTemplatesPage() {
  const pageData = await loadAdminMailTemplatesPageData();
  return (
    <ErpShell title="메일 템플릿" subtitle="메일 발송 문구는 Admin module에서 관리하되, 실제 발송 소유권은 mailbox와 submission 흐름에 남깁니다.">
      {pageData.templates.map((template) => (
        <MailTemplateEditor key={template.id} template={template} mode="admin" />
      ))}
    </ErpShell>
  );
}
