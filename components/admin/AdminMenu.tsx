'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  buildSiteAssistHref,
  buildSiteBadWorkplaceHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  resolveSiteNavView,
} from '@/features/home/lib/siteEntry';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import styles from './AdminMenu.module.css';
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  type AdminSectionKey,
} from '@/lib/admin/adminSections';

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

const ADMIN_MENU_LABELS: Record<AdminSectionKey, string> = {
  overview: '관제 대시보드',
  reports: '전체 보고서',
  analytics: '실적/매출',
  mailbox: '메일함',
  k2b: 'K2B 업로드',
  photos: '사진첩',
  schedules: '일정/캘린더',
  users: '사용자',
  headquarters: '사업장/현장',
  content: '콘텐츠',
};

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
  const selectedAdminSiteId = searchParams.get('siteId');
  const selectedAdminHeadquarterId = searchParams.get('headquarterId');
  const siteNavView = resolveSiteNavView({
    pathname,
    siteKey: currentSiteKey,
    activeAdminSection: activeSection,
    selectedAdminSiteId,
  });

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
          label: '현장 메인',
          description: '선택한 현장 개요와 작업 진입 화면',
          href: getAdminSectionHref('headquarters', {
            headquarterId: selectedAdminHeadquarterId,
            siteId: currentSiteKey,
          }),
          active: siteNavView === 'site-home',
        },
        {
          label: '기술지도 보고서',
          description: '이 현장의 보고서 목록과 작성 화면',
          href: buildSiteReportsHref(currentSiteKey),
          active: siteNavView === 'reports',
        },
        {
          label: '분기 종합 보고서',
          description: '현장 기준 분기 보고서 작성',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: siteNavView === 'quarterly',
        },
        {
          label: '현장 보조',
          description: '현장 사진, 사인, 연락처 확인',
          href: buildSiteAssistHref(currentSiteKey),
          active: siteNavView === 'assist',
        },
        {
          label: '현장 사진첩',
          description: '이 현장의 전체 사진과 legacy 사진 보기',
          href: getAdminSectionHref('photos', {
            headquarterId: selectedAdminHeadquarterId,
            siteId: currentSiteKey,
          }),
          active: siteNavView === 'photos',
        },
        {
          label: '불량사업장 신고',
          description: '최근 보고서를 바탕으로 신고서 작성',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: siteNavView === 'bad-workplace',
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
                <span className={styles.menuLabel}>
                  {ADMIN_MENU_LABELS[section.key] ?? section.label}
                </span>
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
                    : ADMIN_MENU_LABELS[section.key] ?? section.label
                }
              >
                <span className={styles.menuLabel}>
                  {ADMIN_MENU_LABELS[section.key] ?? section.label}
                </span>
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
                title={forceExpanded ? undefined : item.label}
              >
                <span className={styles.menuLabel}>{item.label}</span>
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
