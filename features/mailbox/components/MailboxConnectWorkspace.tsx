'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import localStyles from './MailboxPanel.module.css';
import type { NaverMailConnectInput } from './mailboxWorkspaceContentTypes';

interface MailboxConnectWorkspaceProps {
  accountStateLoading: boolean;
  googleProviderStatusDetail: string;
  googleProviderStatusLabel: string;
  mode: 'gate' | 'prompt';
  naverWorksProviderStatusDetail: string;
  naverWorksProviderStatusLabel: string;
  oauthProvider: string | null;
  onConnectGoogle: () => void;
  onConnectNaver: (input: NaverMailConnectInput) => void | Promise<void>;
  onConnectNaverWorks: () => void;
  onRefreshAccountState: () => void;
}

export function MailboxConnectWorkspace({
  accountStateLoading,
  googleProviderStatusDetail,
  googleProviderStatusLabel,
  mode,
  naverWorksProviderStatusDetail,
  naverWorksProviderStatusLabel,
  oauthProvider,
  onConnectGoogle,
  onConnectNaver,
  onConnectNaverWorks,
  onRefreshAccountState,
}: MailboxConnectWorkspaceProps) {
  const [naverEmail, setNaverEmail] = useState('');
  const [naverDisplayName, setNaverDisplayName] = useState('');
  const [naverAppPassword, setNaverAppPassword] = useState('');
  const isPrompt = mode === 'prompt';
  const isNaverConnecting = oauthProvider === 'naver_mail';

  const handleNaverSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onConnectNaver({
      appPassword: naverAppPassword.trim(),
      displayName: naverDisplayName.trim(),
      email: naverEmail.trim(),
    });
  };

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
                ? '현재는 공용 메일함만 연결되어 있습니다. 개인 지메일, 네이버웍스 또는 네이버 메일 IMAP/SMTP 계정을 추가로 연결하면 현재 사용자에게 귀속된 개인 수신/발신 흐름까지 함께 사용할 수 있습니다.'
                : '메일 계정을 연결하면 현재 로그인한 사용자에게 귀속된 받은편지함, 보낸편지함, 보고서 발송 흐름을 한 화면에서 이어서 사용할 수 있습니다.'}
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
            <strong className={localStyles.accountTitle}>네이버웍스 로그인</strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '현재 사용자에게 연결될 네이버웍스 메일 계정을 추가합니다.'
                : '네이버웍스 조직 계정을 연결해 보고서 메일 발송 흐름을 사용할 수 있습니다.'}
            </span>
          </div>
          <span className={localStyles.inlineMeta}>{naverWorksProviderStatusLabel}</span>
        </div>
        {naverWorksProviderStatusDetail ? (
          <span className={localStyles.accountMeta}>{naverWorksProviderStatusDetail}</span>
        ) : null}
        <div className={localStyles.sectionActions}>
          <button
            type="button"
            className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
            onClick={onConnectNaverWorks}
            disabled={oauthProvider === 'naver_works'}
          >
            {oauthProvider === 'naver_works' ? '이동 중...' : '네이버웍스 로그인'}
          </button>
        </div>
      </article>

      <article className={localStyles.accountCard}>
        <div className={localStyles.panelHeader}>
          <div className={localStyles.panelHeading}>
            <strong className={localStyles.accountTitle}>지메일 로그인</strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '현재 사용자에게 연결될 개인 지메일 계정을 추가합니다.'
                : '구글 메일 계정을 현재 사용자 계정에 연결해 받은편지함과 보고서 메일 발송 흐름을 바로 사용할 수 있습니다.'}
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
            <strong className={localStyles.accountTitle}>네이버 메일 IMAP/SMTP 연결</strong>
            <span className={localStyles.accountMeta}>
              {isPrompt
                ? '현재 사용자에게 연결될 개인 네이버 메일 계정을 메일 서버 인증 방식으로 추가합니다.'
                : '네이버 메일 환경설정에서 IMAP/SMTP 사용함을 켜고 애플리케이션 전용 비밀번호를 생성한 뒤 연결합니다.'}
            </span>
          </div>
          <span className={localStyles.inlineMeta}>IMAP/SMTP</span>
        </div>
        <span className={localStyles.accountMeta}>
          OAuth 프로필 이메일 동의와 무관하게, 메일 송수신에는 네이버 메일 주소와 앱 비밀번호가 필요합니다.
        </span>
        <form className={localStyles.fieldStack} onSubmit={handleNaverSubmit}>
          <label className={localStyles.field}>
            <span className={localStyles.fieldLabel}>네이버 메일 주소</span>
            <input
              className="app-input"
              type="email"
              value={naverEmail}
              onChange={(event) => setNaverEmail(event.target.value)}
              placeholder="name@naver.com"
              autoComplete="email"
              required
            />
          </label>
          <label className={localStyles.field}>
            <span className={localStyles.fieldLabel}>보내는 이름</span>
            <input
              className="app-input"
              value={naverDisplayName}
              onChange={(event) => setNaverDisplayName(event.target.value)}
              placeholder="메일에 표시할 이름"
              autoComplete="name"
            />
          </label>
          <label className={localStyles.field}>
            <span className={localStyles.fieldLabel}>애플리케이션 전용 비밀번호</span>
            <input
              className="app-input"
              type="password"
              value={naverAppPassword}
              onChange={(event) => setNaverAppPassword(event.target.value)}
              placeholder="네이버 메일에서 생성한 앱 비밀번호"
              autoComplete="new-password"
              required
            />
          </label>
          <button
            type="submit"
            className={`app-button app-button-primary ${localStyles.primaryActionButton}`}
            disabled={isNaverConnecting}
          >
            {isNaverConnecting ? '연결 중...' : '네이버 메일 연결'}
          </button>
        </form>
      </article>
    </div>
  );
}
