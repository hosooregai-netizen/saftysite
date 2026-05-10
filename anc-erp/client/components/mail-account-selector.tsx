import type { MailAccount } from "../../packages/contracts/src";
import { MailSyncStatusBadge } from "./mail-sync-status-badge";

export function MailAccountSelector({ accounts }: { accounts: MailAccount[] }) {
  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">Mail Accounts</p>
          <h3 className="panel-title">연결 계정</h3>
        </div>
      </div>
      <div className="stack-list">
        {accounts.length === 0 ? <p className="empty-state">연결된 메일 계정이 없습니다.</p> : null}
        {accounts.map((account) => (
          <article className="mini-card" key={account.id}>
            <div className="utility-row" style={{ justifyContent: "space-between" }}>
              <strong>{account.displayName}</strong>
              <MailSyncStatusBadge accountId={account.id} status={account.isConnected ? "completed" : account.mode} />
            </div>
            <p className="muted">{account.email}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
