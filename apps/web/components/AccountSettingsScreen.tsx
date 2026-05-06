'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  canUseWorkspaceServerApis,
  isAnonymousSession,
  peekCachedSession,
  type DemoSession,
} from '@/lib/reportApi';
import { beginGoogleWorkspaceAuth } from '@/lib/sessionAuthFlow';

const packages = [
  { id: 'free', name: '무료 시작', amount: '0원', credits: '2건', note: '워크스페이스 생성 시 즉시 지급' },
  { id: 'starter-10', name: '10건 팩', amount: '30,000원', credits: '10건', note: '기본 팩' },
  { id: 'team-30', name: '30건 팩', amount: '90,000원', credits: '30건', note: '월간 운영' },
  { id: 'agency-100', name: '100건 팩', amount: '300,000원', credits: '100건', note: '대량 처리' },
] as const;

export function AccountSettingsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const billingNotice = searchParams.get('billingNotice') || '';
  const billingError = searchParams.get('billingError') || '';
  const authError = searchParams.get('authError') || '';
  const authRequired = searchParams.get('auth') === 'required';
  const intent = searchParams.get('intent') || '';
  const intentPackage = searchParams.get('package') || '';
  const next = searchParams.get('next') || '';
  const canPurchase = canUseWorkspaceServerApis(session);

  useEffect(() => {
    setSession(peekCachedSession());
  }, [searchParams]);

  useEffect(() => {
    if (!canPurchase || intent !== 'billing' || !intentPackage) {
      return;
    }
    router.replace(`/billing/checkout?package=${encodeURIComponent(intentPackage)}`);
  }, [canPurchase, intent, intentPackage, router]);

  useEffect(() => {
    if (!canPurchase || intent || !authRequired || !next) {
      return;
    }
    router.replace(next);
  }, [authRequired, canPurchase, intent, next, router]);

  const handleGoogleAuth = async () => {
    setAuthBusy(true);
    try {
      if (canPurchase) {
        router.push('/account#account');
        return;
      }
      const currentSession: DemoSession | null = peekCachedSession() ?? session;
      const nextPath =
        intent === 'billing' && intentPackage
          ? `/billing/checkout?package=${encodeURIComponent(intentPackage)}`
          : next || '/account#account';
      const anonymousToken =
        currentSession && isAnonymousSession(currentSession) ? currentSession.token : null;
      await beginGoogleWorkspaceAuth({
        anonymousToken,
        nextPath,
      });
    } catch (error) {
      router.replace(
        `/account?authError=${encodeURIComponent(
          error instanceof Error ? error.message : '구글 로그인으로 이동하지 못했습니다.',
        )}#account`,
      );
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="erp-page">
      <section className="page-header-card" id="account">
        <div>
          <span className="page-kicker">Settings</span>
          <h1 className="page-title">설정</h1>
          <p className="page-meta-line">구글 계정 연결과 결제만 간단하게 관리합니다.</p>
        </div>
      </section>

      {billingNotice ? <div className="row-meta">{billingNotice}</div> : null}
      {billingError ? <div className="row-meta">{billingError}</div> : null}
      {authError ? <div className="row-meta">{authError}</div> : null}
      {authRequired && !canPurchase ? (
        <div className="row-meta">계정 연결 후 계속 진행합니다.</div>
      ) : null}

      <section className="erp-two-column">
        <article className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2>계정 연결</h2>
              <p className="page-meta-line">
                {canPurchase
                  ? '현재 계정으로 결제와 작업공간 동기화를 계속 사용할 수 있습니다.'
                  : '비로그인 상태에서 만든 자료는 구글 로그인 후 현재 계정 작업공간으로 이어집니다.'}
              </p>
            </div>
          </div>

          <dl className="detail-grid">
            <div>
              <dt>계정 상태</dt>
              <dd>{canPurchase ? '연결됨' : '미연결'}</dd>
            </div>
            <div>
              <dt>표시 이름</dt>
              <dd>{session?.userName || '-'}</dd>
            </div>
            <div>
              <dt>작업공간</dt>
              <dd>{session?.workspaceName || '-'}</dd>
            </div>
            <div>
              <dt>로그인 방식</dt>
              <dd>Google</dd>
            </div>
          </dl>

          {!canPurchase ? (
            <div className="workspace-header-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => void handleGoogleAuth()}
                disabled={authBusy}
              >
                {authBusy ? '이동 중...' : 'Google로 계속'}
              </button>
            </div>
          ) : null}
        </article>

        <article className="erp-panel" id="billing">
          <div className="erp-panel-header">
            <div>
              <h2>결제/크레딧</h2>
              <p className="page-meta-line">
                패키지를 선택하면 결제 준비 화면으로 이동합니다.
              </p>
            </div>
          </div>
          <div className="package-grid">
            {packages.map((item) => (
              <article key={item.id} className="package-card settings-package-card">
                <span className="page-kicker">{item.credits}</span>
                <h3>{item.name}</h3>
                <strong className="package-amount">{item.amount}</strong>
                <p>{item.note}</p>
                {item.id === 'free' ? (
                  <button type="button" className="erp-button erp-button-secondary" disabled>
                    기본 제공
                  </button>
                ) : (
                  <button
                    type="button"
                    className="erp-button erp-button-primary"
                    onClick={() => {
                      if (canPurchase) {
                        router.push(`/billing/checkout?package=${item.id}`);
                        return;
                      }
                      router.push(
                        `/account?auth=required&intent=billing&package=${encodeURIComponent(item.id)}#billing`,
                      );
                    }}
                  >
                    결제하기
                  </button>
                )}
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
