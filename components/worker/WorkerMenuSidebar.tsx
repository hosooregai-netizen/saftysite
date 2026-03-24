'use client';

import type { ReactNode } from 'react';
import { useWorkerShellSidebar } from '@/components/worker/WorkerShellSidebarContext';
import layoutStyles from '@/components/worker/WorkerShellLayout.module.css';

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 7.5L9 12l5 4.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WorkerMenuSidebar({ children }: { children: ReactNode }) {
  const { collapsed, expandSidebar, toggleCollapsed } = useWorkerShellSidebar();

  return (
    <aside
      className={[
        layoutStyles.menuSidebar,
        collapsed ? layoutStyles.menuSidebarCollapsed : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (collapsed) expandSidebar();
      }}
    >
      <button
        type="button"
        className={[
          layoutStyles.sidebarToggle,
          collapsed ? layoutStyles.sidebarToggleCollapsed : layoutStyles.sidebarToggleExpanded,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(event) => {
          event.stopPropagation();
          toggleCollapsed();
        }}
        aria-expanded={!collapsed}
        aria-controls="worker-menu-nav-panel"
        aria-label={collapsed ? '메뉴 펼치기' : undefined}
        title={collapsed ? '메뉴 펼치기' : '메뉴 닫기'}
      >
        {collapsed ? (
          <HamburgerIcon className={layoutStyles.sidebarToggleIcon} />
        ) : (
          <>
            <ChevronLeftIcon className={layoutStyles.sidebarToggleIcon} />
            <span className={layoutStyles.sidebarToggleLabel}>메뉴 닫기</span>
          </>
        )}
      </button>
      <div
        className={collapsed ? layoutStyles.menuSidebarPanelHidden : undefined}
        aria-hidden={collapsed}
      >
        {children}
      </div>
    </aside>
  );
}
