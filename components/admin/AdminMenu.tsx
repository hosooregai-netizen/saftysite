'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  buildSiteBadWorkplaceHref,
  buildSiteHubHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import styles from './AdminMenu.module.css';
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  type AdminSectionKey,
} from '@/lib/admin/adminSections';

function isSiteReportsPath(
  pathname: string | null,
  siteKey: string,
  selectedEntry: string | null,
  selectedAdminSiteId: string | null,
  activeSection: AdminSectionKey,
): boolean {
  if (!pathname) return false;
  return (
    pathname === buildSiteReportsHref(siteKey) ||
    pathname.startsWith('/sessions/') ||
    (pathname === '/admin' &&
      activeSection === 'headquarters' &&
      selectedAdminSiteId === siteKey &&
      selectedEntry !== 'quarterly' &&
      selectedEntry !== 'bad-workplace') ||
    (pathname === buildSiteHubHref(siteKey) &&
      selectedEntry !== 'quarterly' &&
      selectedEntry !== 'bad-workplace')
  );
}

function isQuarterlyPath(pathname: string | null, siteKey: string, selectedEntry: string | null) {
  if (!pathname) return false;
  return (
    pathname.startsWith(`/sites/${encodeURIComponent(siteKey)}/quarterly/`) ||
    pathname === buildSiteQuarterlyListHref(siteKey) ||
    (pathname === buildSiteHubHref(siteKey) && selectedEntry === 'quarterly')
  );
}

function isBadWorkplacePath(
  pathname: string | null,
  siteKey: string,
  selectedEntry: string | null,
) {
  if (!pathname) return false;
  return (
    pathname.startsWith(`/sites/${encodeURIComponent(siteKey)}/bad-workplace/`) ||
    (pathname === buildSiteHubHref(siteKey) && selectedEntry === 'bad-workplace')
  );
}

interface AdminMenuPanelProps {
  activeSection: AdminSectionKey;
  currentSiteKey?: string | null;
  forceExpanded?: boolean;
  onNavClick?: () => void;
  onSelectSection?: (section: AdminSectionKey) => void;
  panelId?: string;
}

interface AdminMenuDrawerProps extends AdminMenuPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AdminMenuPanel({
  activeSection,
  currentSiteKey = null,
  forceExpanded = false,
  onNavClick,
  onSelectSection,
  panelId = 'worker-menu-nav-panel',
}: AdminMenuPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedEntry = searchParams.get('entry');
  const selectedAdminSiteId = searchParams.get('siteId');

  const handleSelect = (section: AdminSectionKey) => {
    if (onSelectSection) {
      onSelectSection(section);
      return;
    }

    onNavClick?.();
  };
  const siteMenuItems = currentSiteKey
    ? [
        {
          label: '기술지도 보고서',
          description: '이 현장의 보고서 목록과 작성 화면',
          href: buildSiteReportsHref(currentSiteKey),
          active: isSiteReportsPath(
            pathname,
            currentSiteKey,
            selectedEntry,
            selectedAdminSiteId,
            activeSection,
          ),
        },
        {
          label: '분기 종합 보고서',
          description: '현장 기준 분기 보고서 작성',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: isQuarterlyPath(pathname, currentSiteKey, selectedEntry),
        },
        {
          label: '불량사업장 신고',
          description: '최근 보고서를 바탕으로 신고서 작성',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: isBadWorkplacePath(pathname, currentSiteKey, selectedEntry),
        },
      ]
    : [];

  return (
    <div className={styles.menuPanel} id={panelId}>
      <section className={styles.menuSection} aria-labelledby="controller-menu-heading">
        <h2 id="controller-menu-heading" className={styles.menuTitle}>
          관리자 메뉴
        </h2>
        <div className={styles.menuList}>
          {ADMIN_SECTIONS.map((section) =>
            onSelectSection ? (
              <button
                key={section.key}
                type="button"
                className={`${styles.menuButton} ${
                  activeSection === section.key ? styles.menuButtonActive : ''
                }`}
                onClick={() => handleSelect(section.key)}
              >
                <span className={styles.menuLabel}>{section.label}</span>
                <span className={styles.menuDescription}>{section.description}</span>
              </button>
            ) : (
              <Link
                key={section.key}
                href={getAdminSectionHref(section.key)}
                className={`${styles.menuButton} ${
                  activeSection === section.key ? styles.menuButtonActive : ''
                }`}
                onClick={() => handleSelect(section.key)}
                title={
                  forceExpanded
                    ? undefined
                    : `${section.label}${section.description ? ` - ${section.description}` : ''}`
                }
              >
                <span className={styles.menuLabel}>{section.label}</span>
                <span className={styles.menuDescription}>{section.description}</span>
              </Link>
            ),
          )}
        </div>
      </section>

      {siteMenuItems.length > 0 ? (
        <section className={styles.menuSection} aria-labelledby="controller-site-menu-heading">
          <h2 id="controller-site-menu-heading" className={styles.menuTitle}>
            현장 메뉴
          </h2>
          <div className={styles.menuList}>
            {siteMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.menuButton} ${
                  item.active ? styles.menuButtonActive : ''
                }`}
                onClick={() => onNavClick?.()}
                title={
                  forceExpanded
                    ? undefined
                    : `${item.label}${item.description ? ` - ${item.description}` : ''}`
                }
              >
                <span className={styles.menuLabel}>{item.label}</span>
                {item.description ? (
                  <span className={styles.menuDescription}>{item.description}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function AdminMenuDrawer({
  open,
  onClose,
  activeSection,
  currentSiteKey,
  onSelectSection,
}: AdminMenuDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={styles.drawerBackdrop}
        onClick={onClose}
        aria-label="관리자 메뉴 닫기"
      />
      <aside className={styles.drawer}>
        <AdminMenuPanel
          activeSection={activeSection}
          currentSiteKey={currentSiteKey}
          forceExpanded
          onNavClick={onClose}
          onSelectSection={onSelectSection}
        />
      </aside>
    </>
  );
}

