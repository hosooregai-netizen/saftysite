import type { MailAccount } from "../../packages/contracts/src";
import { MailAccountSelector } from "./mail-account-selector";
import { MailFolderList } from "./mail-folder-list";
import { MailSearchBar } from "./mail-search-bar";
import { ProjectMailFilter } from "./project-mail-filter";

export function MailLeftPane({
  accounts,
  currentFolder,
  projectId,
}: {
  accounts: MailAccount[];
  currentFolder?: string;
  projectId?: string | null;
}) {
  return (
    <>
      <section className="panel mailbox-left-hero">
        <p className="card-eyebrow">Mailbox Workspace</p>
        <h3 className="panel-title">프로젝트 커뮤니케이션 허브</h3>
        <p className="muted">
          받은 메일, 보낸 메일, 제출 메일, 조치요청 메일을 같은 링크 규칙으로 검토합니다.
        </p>
        <div className="mailbox-flag-list">
          <span className="status info">{currentFolder ?? "inbox"}</span>
          <span className="status review">{accounts.length} accounts</span>
        </div>
      </section>
      <ProjectMailFilter projectId={projectId} />
      <MailSearchBar />
      <MailFolderList currentFolder={currentFolder} />
      <MailAccountSelector accounts={accounts} />
    </>
  );
}
