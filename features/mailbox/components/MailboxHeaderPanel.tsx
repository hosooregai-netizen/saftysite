'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { MailAccount } from '@/types/mail';
import type {
  MailboxSyncStatusSummary,
  MailboxTab,
  MailboxView,
} from './mailboxPanelTypes';
import { MAILBOX_TAB_META } from './mailboxPanelTypes';
import localStyles from './MailboxPanel.module.css';

interface MailboxHeaderPanelProps {
  accountStateLoading: boolean;
  disconnectableAccount: MailAccount | null;
  hasMultipleAccounts: boolean;
  listScopeMeta: string[];
  mailboxLead: string;
  query: string;
  selectedAccountId: string;
  selectableAccounts: MailAccount[];
  showMailboxConnectGate: boolean;
  syncStatusSummary: MailboxSyncStatusSummary | null;
  tab: MailboxTab;
  view: MailboxView;
  onChangeAccountId: (value: string) => void;
  onChangeMailboxTab: (tab: MailboxTab) => void;
  onChangeQuery: (value: string) => void;
  onDisconnectSelectedAccount: () => void;
  onOpenCompose: () => void;
  onSync: () => void;
}

export function MailboxHeaderPanel({
  accountStateLoading,
  disconnectableAccount,
  hasMultipleAccounts,
  listScopeMeta,
  mailboxLead,
  query,
  selectedAccountId,
  selectableAccounts,
  showMailboxConnectGate,
  syncStatusSummary,
  tab,
  view,
  onChangeAccountId,
  onChangeMailboxTab,
  onChangeQuery,
  onDisconnectSelectedAccount,
  onOpenCompose,
  onSync,
}: MailboxHeaderPanelProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionHeaderActions} ${localStyles.headerToolbar}`}>
          <div className={localStyles.headerPrimaryRow}>
            <div className={localStyles.sectionHeaderMeta}>
              <h2 className={styles.sectionTitle}>통합 메일함</h2>
              <p className={localStyles.sectionLead}>{mailboxLead}</p>
            </div>
            <div className={localStyles.headerUtilityGroup}>
              {!showMailboxConnectGate && view === 'list' ? (
                <input
                  aria-label="메일 검색"
                  className={`app-input ${localStyles.searchField}`}
                  value={query}
                  onChange={(event) => onChangeQuery(event.target.value)}
                  placeholder="제목, 본문, 주소 검색"
                />
              ) : null}
              <div className={localStyles.headerPrimaryActions}>
                <button
                  type="button"
                  className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                  onClick={onSync}
                >
                  새로 고침
                </button>
                {!showMailboxConnectGate ? (
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.composeHeaderButton}`}
                    onClick={onOpenCompose}
                  >
                    메일 보내기
                  </button>
                ) : null}
                {!showMailboxConnectGate && disconnectableAccount ? (
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${localStyles.headerActionButton}`}
                    onClick={onDisconnectSelectedAccount}
                    disabled={accountStateLoading}
                  >
                    메일 로그아웃
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {!showMailboxConnectGate && view === 'list' && (hasMultipleAccounts || listScopeMeta.length > 0) ? (
            <div className={localStyles.headerSecondaryRow}>
              {hasMultipleAccounts ? (
                <select
                  className={`app-select ${localStyles.accountFilter}`}
                  value={selectedAccountId}
                  onChange={(event) => onChangeAccountId(event.target.value)}
                >
                  <option value="">전체 계정</option>
                  {selectableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.mailboxLabel}
                    </option>
                  ))}
                </select>
              ) : null}
              {hasMultipleAccounts && listScopeMeta.length > 0 ? (
                <span className={localStyles.headerScope}>{listScopeMeta.join(' · ')}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {!showMailboxConnectGate && view === 'list' && listScopeMeta.length > 0 ? (
        <div className={localStyles.scopeRow}>
          <span className={localStyles.scopeKicker}>현재 범위</span>
          <strong className={localStyles.scopeValue}>{MAILBOX_TAB_META[tab].title}</strong>
          <span className={localStyles.scopeText}>{listScopeMeta.join(' · ')}</span>
        </div>
      ) : null}
      {!showMailboxConnectGate && view === 'list' ? (
        <div className={localStyles.tabRail}>
          {(['all', 'inbox', 'sent'] as MailboxTab[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`${localStyles.tabButton} ${tab === item ? localStyles.tabButtonActive : ''}`}
              onClick={() => onChangeMailboxTab(item)}
            >
              <span className={localStyles.tabButtonBullet} aria-hidden="true" />
              <span className={localStyles.tabButtonLabel}>{MAILBOX_TAB_META[item].title}</span>
            </button>
          ))}
        </div>
      ) : null}
      {!showMailboxConnectGate && view === 'list' && syncStatusSummary ? (
        <div
          className={`${localStyles.syncStatusBanner} ${
            syncStatusSummary.tone === 'error'
              ? localStyles.syncStatusBannerError
              : syncStatusSummary.tone === 'ready'
                ? localStyles.syncStatusBannerReady
                : localStyles.syncStatusBannerProgress
          }`}
        >
          <strong className={localStyles.syncStatusTitle}>{syncStatusSummary.title}</strong>
          <span className={localStyles.syncStatusText}>{syncStatusSummary.description}</span>
        </div>
      ) : null}
    </>
  );
}
