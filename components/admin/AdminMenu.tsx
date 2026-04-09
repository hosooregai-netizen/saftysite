'use client';
//
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  buildSiteAssistHref,
  buildSiteBadWorkplaceHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  resolveSiteNavView,
} from '@/features/home/lib/siteEntry';
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  type AdminSectionKey,
} from '@/lib/admin/adminSections';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import styles from './AdminMenu.module.css';

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

interface SiteMenuItem {
  active: boolean;
  href: string;
  label: string;
}

interface AdminSubMenuItem {
  active: boolean;
  href: string;
  label: string;
}

const ADMIN_MENU_TITLE = '\uAD00\uB9AC \uBA54\uB274';
const ADMIN_MENU_CLOSE_LABEL = '\uAD00\uB9AC\uC790 \uBA54\uB274 \uB2EB\uAE30';
const SITE_MENU_GROUP_LABEL = '\uD604\uC7A5 \uBA54\uB274';
const SITE_MENU_PARENT_SECTION: AdminSectionKey = 'headquarters';

const ADMIN_MENU_LABELS: Record<AdminSectionKey, string> = {
  overview: '\uAD00\uB9AC \uB300\uC2DC\uBCF4\uB4DC',
  reports: '\uC804\uCCB4 \uBCF4\uACE0\uC11C',
  analytics: '\uC2E4\uC801 / \uB9E4\uCD9C',
  mailbox: '\uBA54\uC77C\uD568',
  photos: '\uC0AC\uC9C4\uCCA9',
  schedules: '\uC77C\uC815 / \uCE98\uB9B0\uB354',
  users: '\uC0AC\uC6A9\uC790',
  headquarters: '\uC0AC\uC5C5\uC7A5 / \uD604\uC7A5',
  content: '\uCF58\uD150\uCE20',
};

function joinClassNames(...tokens: Array<string | false | null | undefined>) {
  return tokens.filter(Boolean).join(' ');
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

  const siteMenuItems: SiteMenuItem[] = currentSiteKey
    ? [
        {
          label: '\uD604\uC7A5 \uBA54\uC778',
          href: getAdminSectionHref('headquarters', {
            headquarterId: selectedAdminHeadquarterId,
            siteId: currentSiteKey,
          }),
          active: siteNavView === 'site-home',
        },
        {
          label: '\uAE30\uC220\uC9C0\uB3C4 \uBCF4\uACE0\uC11C',
          href: buildSiteReportsHref(currentSiteKey),
          active: siteNavView === 'reports',
        },
        {
          label: '\uBD84\uAE30 \uC885\uD569 \uBCF4\uACE0\uC11C',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: siteNavView === 'quarterly',
        },
        {
          label: '\uD604\uC7A5 \uBCF4\uC870',
          href: buildSiteAssistHref(currentSiteKey),
          active: siteNavView === 'assist',
        },
        {
          label: '\uD604\uC7A5 \uC0AC\uC9C4\uCCA9',
          href: getAdminSectionHref('photos', {
            headquarterId: selectedAdminHeadquarterId,
            siteId: currentSiteKey,
          }),
          active: siteNavView === 'photos',
        },
        {
          label: '\uBD88\uB7C9\uC0AC\uC5C5\uC7A5 \uC2E0\uACE0',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: siteNavView === 'bad-workplace',
        },
      ]
    : [];
  const mailboxBox = searchParams.get('box');
  const resolvedMailboxBox = mailboxBox === 'sent' ? 'sent' : 'inbox';
  const mailboxMenuItems: AdminSubMenuItem[] = [
    {
      label: '받은편지함',
      href: getAdminSectionHref('mailbox', { box: 'inbox' }),
      active: activeSection === 'mailbox' && resolvedMailboxBox === 'inbox',
    },
    {
      label: '보낸편지함',
      href: getAdminSectionHref('mailbox', { box: 'sent' }),
      active: activeSection === 'mailbox' && resolvedMailboxBox === 'sent',
    },
  ];

  return (
    <div className={styles.menuPanel} id={panelId}>
      <section className={styles.menuSection} aria-labelledby="controller-menu-heading">
        <h2 id="controller-menu-heading" className={styles.menuTitle}>
          {ADMIN_MENU_TITLE}
        </h2>

        <div className={styles.menuList}>
          {ADMIN_SECTIONS.map((section) => {
            const menuLabel = ADMIN_MENU_LABELS[section.key] ?? section.label;
            const hasSiteChildren =
              section.key === SITE_MENU_PARENT_SECTION && siteMenuItems.length > 0;
            const hasMailboxChildren = section.key === 'mailbox';
            const isSectionActive = activeSection === section.key;
            const isParentActive =
              hasSiteChildren &&
              (isSectionActive || siteNavView === 'site-home');
            const topLevelActive = hasSiteChildren ? isParentActive : isSectionActive;
            const hasChildren = hasSiteChildren || hasMailboxChildren;
            const childItems = hasSiteChildren ? siteMenuItems : hasMailboxChildren ? mailboxMenuItems : [];
            const showChildren = hasSiteChildren || (hasMailboxChildren && isSectionActive);
            const menuButtonClassName = joinClassNames(
              styles.menuButton,
              hasChildren && styles.menuButtonGrouped,
              topLevelActive && styles.menuButtonActive,
            );

            return (
              <div
                key={section.key}
                className={joinClassNames(
                  styles.menuTreeItem,
                  showChildren && styles.menuTreeItemExpanded,
                )}
              >
                {onSelectSection ? (
                  <button
                    type="button"
                    className={menuButtonClassName}
                    onClick={() => handleSelect(section.key)}
                  >
                    <span className={styles.menuLabel}>{menuLabel}</span>
                  </button>
                ) : (
                  <Link
                    href={getAdminSectionHref(section.key)}
                    className={menuButtonClassName}
                    onClick={() => handleSelect(section.key)}
                    title={forceExpanded ? undefined : menuLabel}
                  >
                    <span className={styles.menuLabel}>{menuLabel}</span>
                  </Link>
                )}

                {showChildren ? (
                  <div
                    className={styles.menuTreeChildren}
                    role="group"
                    aria-label={hasSiteChildren ? SITE_MENU_GROUP_LABEL : `${menuLabel} 하위 메뉴`}
                  >
                    {childItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={joinClassNames(
                          styles.subMenuButton,
                          item.active && styles.subMenuButtonActive,
                        )}
                        onClick={() => onNavClick?.()}
                        title={forceExpanded ? undefined : item.label}
                      >
                        <span className={styles.subMenuLabel}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
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
        aria-label={ADMIN_MENU_CLOSE_LABEL}
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
