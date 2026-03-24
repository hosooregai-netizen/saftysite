'use client';

import type { ReactNode } from 'react';
import { useWorkerShellSidebar } from '@/components/worker/WorkerShellSidebarContext';
import layoutStyles from '@/components/worker/WorkerShellLayout.module.css';

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
        className={layoutStyles.sidebarToggle}
        onClick={(event) => {
          event.stopPropagation();
          toggleCollapsed();
        }}
        aria-expanded={!collapsed}
        aria-controls="worker-menu-nav-panel"
        title={collapsed ? '메뉴 펼치기' : '메뉴 접기 (아이콘만)'}
      >
        {collapsed ? '»' : '«'}
      </button>
      {children}
    </aside>
  );
}
