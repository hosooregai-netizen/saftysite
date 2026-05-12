'use client';

import styles from '@/features/admin/sections/AdminSectionShared.module.css';
import type { MailboxStatusTone } from './mailboxPanelTypes';
import localStyles from './MailboxPanel.module.css';

interface MailboxConnectWorkspaceProps {
  accountStateLoading: boolean;
  googleProviderStatusDetail: string;
  googleProviderStatusLabel: string;
  googleProviderStatusTone: MailboxStatusTone;
  mode: 'gate' | 'prompt';
  oauthProvider: string | null;
  onConnectGoogle: () => void;
  onRefreshAccountState: () => void;
}

function connectStatusClass(tone: MailboxStatusTone) {
  return [
    localStyles.connectStatusBadge,
    tone === 'error'
      ? localStyles.connectStatusError
      : tone === 'ready'
        ? localStyles.connectStatusReady
        : localStyles.connectStatusProgress,
  ].join(' ');
}

export function MailboxConnectWorkspace({
  accountStateLoading,
  googleProviderStatusDetail,
  googleProviderStatusLabel,
  googleProviderStatusTone,
  mode,
  oauthProvider,
  onConnectGoogle,
  onRefreshAccountState,
}: MailboxConnectWorkspaceProps) {
  const isPrompt = mode === 'prompt';

  return (
    <div
      className={localStyles.connectWorkspace}
      data-mailbox-connect-prompt={isPrompt ? 'true' : undefined}
      data-mailbox-connect-gate={!isPrompt ? 'true' : undefined}
    >
      <section className={`${styles.tableShell} ${localStyles.workspaceSection}`}>
        <div className={localStyles.mailTableHeader}>
          <div className={localStyles.mailTableHeaderMeta}>
            <strong className={localStyles.panelTitle}>
              {isPrompt ? '개인 메일 계정 추가 연결' : '메일 계정 로그인'}
            </strong>
            <span className={localStyles.panelDescription}>
              {isPrompt
                ? '현재는 공용 메일만 연결되어 있습니다. 개인 지메일 계정을 추가로 연결하면 현재 사용자 기준의 개인 수신과 발송 흐름까지 함께 사용할 수 있습니다.'
                : '메일 계정을 연결하면 현재 로그인한 사용자 기준의 받은 메일, 보낸 메일, 보고서 발송 흐름을 한 화면에서 이어서 사용할 수 있습니다.'}
            </span>
          </div>
          <div className={localStyles.sectionActions}>
            <button
              type="button"
              className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
              onClick={onRefreshAccountState}
              disabled={accountStateLoading}
            >
              상태 새로 고침
            </button>
          </div>
        </div>
      </section>

      <section className={`${styles.tableShell} ${localStyles.workspaceSection} ${localStyles.connectTableSection}`}>
        <div className={localStyles.connectList} role="table" aria-label="연결 가능한 메일 계정">
          <div className={`${localStyles.connectListRow} ${localStyles.connectListHeader}`} role="row">
            <span role="columnheader">서비스</span>
            <span role="columnheader">상태</span>
            <span role="columnheader">안내</span>
            <span role="columnheader">처리</span>
          </div>

          <div className={localStyles.connectListRow} role="row">
            <div className={localStyles.connectProviderCell} role="cell">
              <span className={styles.tablePrimary}>지메일</span>
              <span className={localStyles.threadMeta}>Google</span>
            </div>
            <div role="cell">
              <span className={connectStatusClass(googleProviderStatusTone)}>
                {googleProviderStatusLabel}
              </span>
            </div>
            <div role="cell">
              <span className={localStyles.accountMeta}>
                {googleProviderStatusDetail ||
                  (isPrompt
                    ? '현재 사용자에게 연결할 개인 지메일 계정을 추가합니다.'
                    : '구글 메일 계정을 연결해 받은 메일과 보고서 메일 발송 흐름을 바로 사용합니다.')}
              </span>
            </div>
            <div className={localStyles.connectActionCell} role="cell">
              <button
                type="button"
                className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                onClick={onConnectGoogle}
                disabled={oauthProvider === 'google'}
              >
                {oauthProvider === 'google' ? '이동 중..' : '지메일 로그인'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
