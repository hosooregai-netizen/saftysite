'use client';

import type { MailAccount, MailboxBox } from '@/types/mail';
import styles from './MailboxShell.module.css';
import { MailboxIcon } from './MailboxIcon';

const navItems: Array<{ icon: Parameters<typeof MailboxIcon>[0]['name']; label: string; value: MailboxBox }> = [
  { icon: 'inbox', label: '받은편지함', value: 'inbox' },
  { icon: 'send', label: '보낸편지함', value: 'sent' },
  { icon: 'draft', label: '임시보관함', value: 'drafts' },
  { icon: 'star', label: '중요', value: 'starred' },
  { icon: 'trash', label: '휴지통', value: 'trash' },
  { icon: 'mail', label: '전체 메일', value: 'all' },
];

export function MailboxSidebar({
  accounts,
  activeBox,
  onCompose,
  onSelectAccount,
  onSelectBox,
  selectedAccountId,
}: {
  accounts: MailAccount[];
  activeBox: MailboxBox;
  onCompose: () => void;
  onSelectAccount: (value: string) => void;
  onSelectBox: (value: MailboxBox) => void;
  selectedAccountId: string;
}) {
  return (
    <aside className={styles.sidebar}>
      <button type="button" className={styles.sidebarComposeButton} onClick={onCompose}>
        <MailboxIcon name="plus" />
        <span>메일 작성</span>
      </button>

      <section className={styles.sidebarSection}>
        <div className={styles.sidebarSectionHeader}>
          <span className={styles.sidebarSectionLabel}>메일함</span>
        </div>
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.navButton} ${activeBox === item.value ? styles.navButtonActive : ''}`}
              onClick={() => onSelectBox(item.value)}
            >
              <MailboxIcon name={item.icon} size={18} />
              <span className={styles.navButtonLabel}>{item.label}</span>
            </button>
          ))}
        </nav>
      </section>

      <section className={styles.sidebarSection}>
        <div className={styles.sidebarSectionHeader}>
          <span className={styles.sidebarSectionLabel}>연결 계정</span>
        </div>
        <div className={styles.accountList}>
          <button
            type="button"
            className={`${styles.accountButton} ${selectedAccountId === 'all' ? styles.accountButtonActive : ''}`}
            onClick={() => onSelectAccount('all')}
          >
            <MailboxIcon name="mail" size={18} />
            <div className={styles.accountLabelWrap}>
              <span className={styles.accountLabel}>전체 계정</span>
              <span className={styles.accountEmail}>연결된 메일함 전체 보기</span>
            </div>
          </button>

          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              className={`${styles.accountButton} ${selectedAccountId === account.id ? styles.accountButtonActive : ''}`}
              onClick={() => onSelectAccount(account.id)}
            >
              <MailboxIcon name={account.provider === 'google' ? 'mail' : 'inbox'} size={18} />
              <div className={styles.accountLabelWrap}>
                <span className={styles.accountLabel}>{account.mailboxLabel}</span>
                <span className={styles.accountEmail}>{account.email}</span>
                <div className={styles.accountMetaRow}>
                  <span className={`${styles.accountBadge} ${styles.statusMuted}`}>
                    {account.provider === 'google' ? 'Google' : account.provider}
                  </span>
                  <span className={`${styles.accountBadge} ${styles.statusMuted}`}>
                    {account.lastSyncedAt ? `동기화 ${account.lastSyncedAt.slice(5, 16).replace('T', ' ')}` : '연결 완료'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default MailboxSidebar;
