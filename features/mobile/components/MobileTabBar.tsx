'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileTabBar.module.css';

export interface TabItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive?: boolean;
}

export function MobileTabBar({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav className={styles.tabBar}>
      {tabs.map((tab) => {
        const active = tab.isActive !== undefined ? tab.isActive : pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`${styles.tabItem} ${active ? styles.active : ''}`}
            onClick={(e) => {
              if (tab.href === '#') {
                e.preventDefault();
                alert('아직 구현되지 않은 기능입니다.');
              }
            }}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
