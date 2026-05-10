import { PhraseEditor, UsageTemplateList } from "../../../components/admin-governance-components";
import { ErpShell } from "../../../components/erp-shell";
import { PhraseTable } from "../../../components/phrase-table";
import { loadAdminPhrasesPageData } from "../../../lib/admin-page-data";

export default async function AdminPhraseLibraryPage() {
  const pageData = await loadAdminPhrasesPageData();
  return (
    <ErpShell title="표준 문구" subtitle="반복 사용되는 안내 문구와 draft-safe 문구를 중앙 라이브러리로 관리합니다.">
      <PhraseTable phrases={pageData.phrases} />
      {pageData.phrases[0] ? <PhraseEditor phrase={pageData.phrases[0]} /> : null}
      <UsageTemplateList phrases={pageData.phrases} />
    </ErpShell>
  );
}
