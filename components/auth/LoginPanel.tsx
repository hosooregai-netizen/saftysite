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
  description = '배정 현장과 보고서를 불러오려면 API 서버 계정으로 로그인해 주세요.',
}: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <main className="app-page">
      <div className="app-container">
        <section className={`app-shell ${styles.shell}`}>
          <div className={styles.hero}>
            <span className="app-chip">Safety API</span>
            <span className="app-chip">현장 보고서 연동</span>
          </div>

          <div className={styles.content}>
            <div className={styles.copy}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span className={styles.label}>이메일</span>
                <input
                  type="email"
                  className="app-input"
                  value={email}
                  autoComplete="username"
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>비밀번호</span>
                <input
                  type="password"
                  className="app-input"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                />
              </label>

              {localError || error ? (
                <p className={styles.error}>{localError || error}</p>
              ) : null}

              <button
                type="submit"
                className="app-button app-button-primary"
                disabled={busy}
              >
                {busy ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
