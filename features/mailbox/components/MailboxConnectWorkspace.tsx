'use client';

import localStyles from './MailboxPanel.module.css';

interface MailboxConnectWorkspaceProps {
  accountStateLoading: boolean;
  googleProviderStatusDetail: string;
  googleProviderStatusLabel: string;
  mode: 'gate' | 'prompt';
  naverProviderStatusDetail: string;
  naverProviderStatusLabel: string;
  oauthProvider: string | null;
  onConnectGoogle: () => void;
  onConnectNaver: () => void;
  onRefreshAccountState: () => void;
}

export function MailboxConnectWorkspace({
  accountStateLoading,
  googleProviderStatusDetail,
  googleProviderStatusLabel,
  mode,
  naverProviderStatusDetail,
  naverProviderStatusLabel,
  oauthProvider,
  onConnectGoogle,
  onConnectNaver,
  onRefreshAccountState,
}: MailboxConnectWorkspaceProps) {
  const isPrompt = mode === 'prompt';

  return (
    <div
      className={localStyles.accountWorkspace}
      data-mailbox-connect-prompt={isPrompt ? 'true' : undefined}
      data-mailbox-connect-gate={!isPrompt ? 'true' : undefined}
    >
      <article className={localStyles.accountCard}>
        <div className={localStyles.panelHeader}>
          <div className={localStyles.panelHeading}>
            <strong className={localStyles.accountTitle}>
              {isPrompt ? '개인 메일 계정 추가 연결' : '메일 계정 로그인'}
            </strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '현재는 공용 메일함만 연결되어 있습니다. 개인 지메일 또는 네이버 메일을 추가로 연결하면 개인 수신/발신 흐름까지 함께 사용할 수 있습니다.'
                : '메일 계정을 연결하면 받은편지함, 보낸편지함, 보고서 발송까지 한 화면에서 이어서 사용할 수 있습니다.'}
            </span>
          </div>
          <button
            type="button"
            className={`app-button app-button-secondary ${localStyles.inlineActionButton}`}
            onClick={onRefreshAccountState}
            disabled={accountStateLoading}
          >
            상태 새로 고침
          </button>
        </div>
      </article>

      <article className={localStyles.accountCard}>
        <div className={localStyles.panelHeader}>
          <div className={localStyles.panelHeading}>
            <strong className={localStyles.accountTitle}>지메일 로그인</strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '개인 지메일 계정을 추가 연결합니다.'
                : '구글 메일 계정을 연결해 받은편지함과 보고서 메일 발송 흐름을 바로 사용할 수 있습니다.'}
            </span>
          </div>
          <span className={localStyles.inlineMeta}>{googleProviderStatusLabel}</span>
        </div>
        {googleProviderStatusDetail ? (
          <span className={localStyles.accountMeta}>{googleProviderStatusDetail}</span>
        ) : null}
        <div className={localStyles.sectionActions}>
          <button
            type="button"
            className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
            onClick={onConnectGoogle}
            disabled={oauthProvider === 'google'}
          >
            {oauthProvider === 'google' ? '이동 중...' : '지메일 로그인'}
          </button>
        </div>
      </article>

      <article className={localStyles.accountCard}>
        <div className={localStyles.panelHeader}>
          <div className={localStyles.panelHeading}>
            <strong className={localStyles.accountTitle}>네이버 로그인</strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '개인 네이버 메일 계정을 추가 연결합니다.'
                : '네이버 메일 계정을 연결해 수신 메일과 발송 이력을 같은 메일함에서 관리할 수 있습니다.'}
            </span>
          </div>
          <span className={localStyles.inlineMeta}>{naverProviderStatusLabel}</span>
        </div>
        {naverProviderStatusDetail ? (
          <span className={localStyles.accountMeta}>{naverProviderStatusDetail}</span>
        ) : null}
        <div className={localStyles.sectionActions}>
          <button
            type="button"
            className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
            onClick={onConnectNaver}
            disabled={oauthProvider === 'naver_mail'}
          >
            {oauthProvider === 'naver_mail' ? '이동 중...' : '네이버 로그인'}
          </button>
        </div>
      </article>
    </div>
  );
}
