'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setLocalError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLocalError(null);

    try {
      await onSubmit({ email, password });
    } catch {
      // 상위 상태에서 오류를 표시합니다.
    }
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

