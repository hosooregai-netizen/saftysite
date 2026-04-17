'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { cx } from './domain';
import { useReverseApp } from './state';

export function buttonClass(variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary') {
  return cx(
    'button',
    variant === 'primary' && 'button-primary',
    variant === 'secondary' && 'button-secondary',
    variant === 'ghost' && 'button-ghost',
    variant === 'danger' && 'button-danger',
  );
}

function navGroups() {
  return [
    {
      label: 'Controller',
      links: [
        { href: '/admin', label: '개요', exact: true },
        { href: '/admin/schedules', label: '일정' },
        { href: '/admin/sites', label: '현장' },
        { href: '/admin/reports', label: '보고서' },
        { href: '/admin/report-open', label: 'Legacy Open' },
      ],
    },
    {
      label: 'Worker',
      links: [
        { href: '/calendar', label: '내 일정' },
        { href: '/sites/site-alpha', label: '현장 허브' },
        { href: '/sessions/legacy%3Aalpha-2026-01', label: '세션' },
        { href: '/sites/site-alpha/quarterly/2026-Q1', label: '분기 보고서' },
        { href: '/sites/site-beta/bad-workplace/2026-03', label: '취약 현장' },
      ],
    },
    {
      label: 'Mobile',
      links: [
        { href: '/mobile/sites/site-alpha', label: '모바일 허브' },
        { href: '/mobile/sessions/session-alpha-02', label: '모바일 세션' },
        { href: '/mobile/sites/site-alpha/photos', label: '모바일 사진' },
      ],
    },
  ];
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
}

export function AppShell({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { state, currentUser, setCurrentUserId, resetState } = useReverseApp();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">reverse spec service</p>
          <Link href="/" className="brand-link">
            Reverse Rebuild
          </Link>
          <p className="muted">
            기존 코드와 분리된 하위 앱에서 관리자/작업자 흐름을 다시 조합했습니다.
          </p>
        </div>

        <div className="sidebar-controls">
          <label className="field-label" htmlFor="user-switcher">
            사용자 전환
          </label>
          <select
            id="user-switcher"
            className="input"
            value={currentUser.id}
            onChange={(event) => setCurrentUserId(event.target.value)}
          >
            {state.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} · {user.role === 'admin' ? '관리자' : '작업자'}
              </option>
            ))}
          </select>
          <button type="button" className={buttonClass('ghost')} onClick={resetState}>
            데모 상태 초기화
          </button>
        </div>

        <nav className="sidebar-nav">
          {navGroups().map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-label">{group.label}</p>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx('nav-link', isActive(pathname, link.href, link.exact) && 'nav-link-active')}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="screen-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="screen-description">{description}</p> : null}
      </div>
      {actions ? <div className="screen-actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('panel', className)}>
      {(title || description || actions) && (
        <div className="panel-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p className="panel-description">{description}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; hint?: string; tone?: 'normal' | 'warning' | 'accent' }[];
}) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <article key={item.label} className={cx('stat-card', item.tone === 'warning' && 'stat-card-warning')}>
          <p className="stat-label">{item.label}</p>
          <strong className="stat-value">{item.value}</strong>
          {item.hint ? <p className="muted">{item.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  return <span className={cx('badge', `badge-${tone}`)}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            {description ? <p className="panel-description">{description}</p> : null}
          </div>
          <button type="button" className={buttonClass('ghost')} onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Notice({ message, tone = 'info' }: { message?: string; tone?: 'info' | 'warning' | 'danger' }) {
  if (!message) {
    return null;
  }

  return <div className={cx('notice', `notice-${tone}`)}>{message}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

