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
  naverWorksProviderStatusDetail: string;
  naverWorksProviderStatusLabel: string;
  naverWorksProviderStatusTone: MailboxStatusTone;
  oauthProvider: string | null;
  onConnectGoogle: () => void;
  onConnectNaverWorks: () => void;
  onRefreshAccountState: () => void;
}

export function MailboxConnectWorkspace({
  accountStateLoading,
  googleProviderStatusDetail,
  googleProviderStatusLabel,
  googleProviderStatusTone,
  mode,
  naverWorksProviderStatusDetail,
  naverWorksProviderStatusLabel,
  naverWorksProviderStatusTone,
  oauthProvider,
  onConnectGoogle,
  onConnectNaverWorks,
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
                ? '현재는 공용 메일만 연결되어 있습니다. 개인 지메일이나 네이버웍스 계정을 추가로 연결하면 현재 사용자 기준의 개인 수신과 발송 흐름까지 함께 사용할 수 있습니다.'
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

      <section className={`${styles.tableShell} ${localStyles.workspaceSection}`}>
        <div className={`${styles.tableWrap} ${localStyles.connectTableWrap}`}>
          <table className={`${styles.table} ${localStyles.connectTable}`}>
            <thead>
              <tr>
                <th>서비스</th>
                <th>상태</th>
                <th>안내</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className={localStyles.connectProviderCell}>
                    <span className={styles.tablePrimary}>네이버웍스</span>
                    <span className={localStyles.threadMeta}>NAVER WORKS</span>
                  </div>
                </td>
                <td>
                  <span
                    className={[
                      localStyles.connectStatusBadge,
                      naverWorksProviderStatusTone === 'error'
                        ? localStyles.connectStatusError
                        : naverWorksProviderStatusTone === 'ready'
                          ? localStyles.connectStatusReady
                          : localStyles.connectStatusProgress,
                    ].join(' ')}
                  >
                    {naverWorksProviderStatusLabel}
                  </span>
                </td>
                <td>
                  <span className={localStyles.accountMeta}>
                    {naverWorksProviderStatusDetail ||
                      (isPrompt
                        ? '현재 사용자에게 연결할 네이버웍스 메일 계정을 추가합니다.'
                        : '네이버웍스 조직 계정을 연결해 보고서 메일 발송 흐름에 사용합니다.')}
                  </span>
                </td>
                <td className={localStyles.connectActionCell}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                    onClick={onConnectNaverWorks}
                    disabled={oauthProvider === 'naver_works'}
                  >
                    {oauthProvider === 'naver_works' ? '이동 중..' : '네이버웍스 로그인'}
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div className={localStyles.connectProviderCell}>
                    <span className={styles.tablePrimary}>지메일</span>
                    <span className={localStyles.threadMeta}>Google</span>
                  </div>
                </td>
                <td>
                  <span
                    className={[
                      localStyles.connectStatusBadge,
                      googleProviderStatusTone === 'error'
                        ? localStyles.connectStatusError
                        : googleProviderStatusTone === 'ready'
                          ? localStyles.connectStatusReady
                          : localStyles.connectStatusProgress,
                    ].join(' ')}
                  >
                    {googleProviderStatusLabel}
                  </span>
                </td>
                <td>
                  <span className={localStyles.accountMeta}>
                    {googleProviderStatusDetail ||
                      (isPrompt
                        ? '현재 사용자에게 연결할 개인 지메일 계정을 추가합니다.'
                        : '구글 메일 계정을 현재 사용자 계정에 연결해 받은 메일과 보고서 메일 발송 흐름에 바로 사용합니다.')}
                  </span>
                </td>
                <td className={localStyles.connectActionCell}>
                  <button
                    type="button"
                    className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
                    onClick={onConnectGoogle}
                    disabled={oauthProvider === 'google'}
                  >
                    {oauthProvider === 'google' ? '이동 중..' : '지메일 로그인'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
