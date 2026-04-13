'use client';

import Link from 'next/link';
import styles from './WorkerMenu.module.css';
import type { WorkerTopLevelMenuItem } from './workerMenuConfig';
import { joinWorkerMenuClassNames } from './workerMenuHelpers';

interface WorkerMenuTreeProps {
  collapsed: boolean;
  items: WorkerTopLevelMenuItem[];
  onNavClick?: () => void;
}

export function WorkerMenuTree({
  collapsed,
  items,
  onNavClick,
}: WorkerMenuTreeProps) {
  return (
    <div className={styles.menuList}>
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length);
        const showChildren = !collapsed && hasChildren && item.expandMode === 'always'
          ? true
          : !collapsed && hasChildren && item.active;
        const menuButtonClassName = joinWorkerMenuClassNames(
          styles.menuButton,
          hasChildren && styles.menuButtonGrouped,
          item.active && styles.menuButtonActive,
          collapsed && styles.menuButtonCollapsed,
          !item.href && styles.menuButtonStatic,
        );

        const menuButtonContent = collapsed ? (
          <>
            <span className={styles.menuGlyph} aria-hidden="true">
              {item.label.trim().charAt(0) || '메'}
            </span>
            <span className={styles.srOnly}>{item.label}</span>
          </>
        ) : (
          <span className={styles.menuLabel}>{item.label}</span>
        );

        return (
          <div
            key={`${item.label}-${item.href ?? 'group'}`}
            className={joinWorkerMenuClassNames(
              styles.menuTreeItem,
              showChildren && styles.menuTreeItemExpanded,
            )}
          >
            {item.href ? (
              <Link
                href={item.href}
                className={menuButtonClassName}
                onClick={onNavClick}
                title={collapsed ? item.label : undefined}
              >
                {menuButtonContent}
              </Link>
            ) : (
              <div className={menuButtonClassName} title={collapsed ? item.label : undefined}>
                {menuButtonContent}
              </div>
            )}

            {showChildren ? (
              <div
                className={styles.menuTreeChildren}
                role="group"
                aria-label={`${item.label} 하위 메뉴`}
              >
                {item.children?.map((child) => (
                  <Link
                    key={`${item.label}-${child.href}`}
                    href={child.href}
                    className={joinWorkerMenuClassNames(
                      styles.subMenuButton,
                      child.active && styles.subMenuButtonActive,
                    )}
                    onClick={onNavClick}
                  >
                    <span className={styles.subMenuLabel}>{child.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
