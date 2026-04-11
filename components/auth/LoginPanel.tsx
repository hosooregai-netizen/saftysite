'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  clearAutoLoginSuppression,
  clearRememberedLoginCredentials,
  isAutoLoginSuppressed,
  readRememberedLoginCredentials,
  writeRememberedLoginCredentials,
} from '@/lib/auth/loginCredentialsStorage';
import styles from './LoginPanel.module.css';

interface LoginPanelProps {
  busy?: boolean;
  error?: string | null;
  onSubmit: (input: { email: string; password: string }) => Promise<void>;
  title?: string;
  description?: string;
}

export default function LoginPanel({
  busy = false,
  error = null,
  onSubmit,
  title = '업무 시스템 로그인',
  description,
}: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(true);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(null);
  const autoLoginAttemptedRef = useRef(false);

  useEffect(() => {
    const remembered = readRememberedLoginCredentials();
    const frameId = window.requestAnimationFrame(() => {
      if (remembered) {
        setEmail(remembered.email);
        setPassword(remembered.password);
        setRememberCredentials(remembered.rememberCredentials);
        setSavedAtLabel(new Date(remembered.savedAt).toLocaleString('ko-KR'));
      }
      setCredentialsLoaded(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setLocalError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLocalError(null);

    try {
      await onSubmit({ email, password });
      clearAutoLoginSuppression();
      if (rememberCredentials) {
        writeRememberedLoginCredentials({
          email: email.trim(),
          password,
          rememberCredentials: true,
        });
        setSavedAtLabel(new Date().toLocaleString('ko-KR'));
      } else {
        clearRememberedLoginCredentials();
        setSavedAtLabel(null);
      }
    } catch {
      // 상위 상태에서 오류를 표시합니다.
    }
  };

  useEffect(() => {
    if (autoLoginAttemptedRef.current) return;
    if (!credentialsLoaded || busy) return;
    if (!rememberCredentials || !email.trim() || !password) return;
    if (isAutoLoginSuppressed()) return;

    autoLoginAttemptedRef.current = true;

    void onSubmit({ email: email.trim(), password })
      .then(() => {
        clearAutoLoginSuppression();
        writeRememberedLoginCredentials({
          email: email.trim(),
          password,
          rememberCredentials: true,
        });
        setSavedAtLabel(new Date().toLocaleString('ko-KR'));
      })
      .catch(() => {
        // 상위 상태에서 오류를 표시합니다.
      });
  }, [busy, credentialsLoaded, email, onSubmit, password, rememberCredentials]);

  const handleClearSavedCredentials = () => {
    clearRememberedLoginCredentials();
    setRememberCredentials(true);
    setEmail('');
    setPassword('');
    setSavedAtLabel(null);
    setLocalError(null);
  };

  return (
    <main className={`app-page ${styles.pageRoot}`}>
      <div className={`app-container ${styles.pageInner}`}>
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.backdrop} aria-hidden="true" />

          <div className={styles.content}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formHeader}>
                <p className={styles.formEyebrow}>Sign in</p>
                <h1 className={styles.formTitle}>{title}</h1>
                {description ? <p className={styles.formDescription}>{description}</p> : null}
              </div>

              <div className={styles.formFields}>
                <label className={styles.field}>
                  <span className={styles.label}>이메일</span>
                  <input
                    type="email"
                    className="app-input"
                    value={email}
                    autoComplete="username"
                    placeholder="name@example.com"
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>비밀번호</span>
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="app-input"
                      value={password}
                      autoComplete="current-password"
                      placeholder="비밀번호를 입력하세요"
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={busy}
                    />
                    <button
                      type="button"
                      className={`app-button app-button-secondary ${styles.visibilityButton}`}
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={busy}
                    >
                      {showPassword ? '숨기기' : '보기'}
                    </button>
                  </div>
                </label>
              </div>

              <div className={styles.preferences}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={rememberCredentials}
                    onChange={(event) => setRememberCredentials(event.target.checked)}
                    disabled={busy}
                  />
                  <span>로그인 정보 기억</span>
                </label>
                {credentialsLoaded && savedAtLabel ? (
                  <button
                    type="button"
                    className={`app-button app-button-secondary ${styles.clearSavedButton}`}
                    onClick={handleClearSavedCredentials}
                    disabled={busy}
                  >
                    저장값 삭제
                  </button>
                ) : null}
              </div>

              {credentialsLoaded && savedAtLabel ? (
                <p className={styles.savedHint}>
                  저장된 로그인 정보가 자동 입력되었습니다. 마지막 저장: {savedAtLabel}
                </p>
              ) : null}

              <p className={styles.securityHint}>
                공유 PC에서는 로그인 정보 기억을 켜지 않는 것을 권장합니다.
              </p>

              {localError || error ? (
                <p className={styles.error}>{localError || error}</p>
              ) : null}

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`app-button app-button-primary ${styles.submitButton}`}
                  disabled={busy}
                >
                  {busy ? '로그인 중...' : '로그인'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
