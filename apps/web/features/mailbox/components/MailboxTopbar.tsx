'use client';

import styles from './MailboxShell.module.css';
import { MailboxIcon } from './MailboxIcon';

export function MailboxTopbar({
  accountLabel,
  canCompose,
  onOpenAccount,
  onOpenCompose,
  onOpenDrawer,
  onOpenWorkMenu,
  onSync,
  query,
  setQuery,
  statusLabel,
  statusTone = 'muted',
}: {
  accountLabel: string;
  canCompose: boolean;
  onOpenAccount: () => void;
  onOpenCompose: () => void;
  onOpenDrawer: () => void;
  onOpenWorkMenu: () => void;
  onSync: () => void;
  query: string;
  setQuery: (value: string) => void;
  statusLabel: string;
  statusTone?: 'muted' | 'success' | 'warning';
}) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLead}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="메일함 탐색 열기"
          onClick={onOpenDrawer}
        >
          <MailboxIcon name="menu" />
        </button>
        <div className={styles.brandLockup}>
          <div className={styles.brandMark} aria-hidden="true">
            <MailboxIcon name="mail" size={22} />
          </div>
          <div className={styles.brandText}>
            <strong>대한안전산업연구원</strong>
            <span>메일함</span>
          </div>
        </div>
      </div>

      <label className={styles.topbarSearch} aria-label="메일 검색">
        <MailboxIcon name="search" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="메일 제목, 본문, 주소, 현장 키워드 검색"
        />
      </label>

      <div className={styles.topbarActions}>
        <div className={styles.topbarStatusRow}>
          <span
            className={`${styles.topbarStatusBadge} ${
              statusTone === 'success'
                ? styles.statusSuccess
                : statusTone === 'warning'
                  ? styles.statusWarning
                  : styles.statusMuted
            }`}
          >
            {statusLabel}
          </span>
          <span className={styles.topbarStatusHint}>{accountLabel}</span>
        </div>
        <button
          type="button"
          className={styles.topbarSecondaryButton}
          aria-label="업무 메뉴 열기"
          onClick={onOpenWorkMenu}
        >
          <MailboxIcon name="menu" />
          <span>업무 메뉴</span>
        </button>
        <button
          type="button"
          className={styles.topbarSecondaryButton}
          aria-label="메일 동기화"
          onClick={onSync}
        >
          <MailboxIcon name="sync" />
          <span>동기화</span>
        </button>
        <button
          type="button"
          className={styles.topbarPrimaryButton}
          aria-label="새 메일 작성"
          onClick={onOpenCompose}
          disabled={!canCompose}
        >
          <MailboxIcon name="plus" />
          <span>새 메일</span>
        </button>
        <button
          type="button"
          className={styles.topbarIconButton}
          aria-label="계정 열기"
          onClick={onOpenAccount}
        >
          <MailboxIcon name="user" />
        </button>
      </div>
    </header>
  );
}

export default MailboxTopbar;
