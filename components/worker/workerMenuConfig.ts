import {
  buildSiteBadWorkplaceHref,
  buildSiteHubHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  buildWorkerCalendarHref,
} from '@/features/home/lib/siteEntry';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import type { SiteNavView } from '@/features/home/lib/siteEntry';
import type { WorkerMenuItem } from './WorkerMenu';
import { isWorkerListPath, normalizeWorkerMenuItems } from './workerMenuHelpers';

export interface WorkerTopLevelMenuItem {
  active: boolean;
  children?: WorkerMenuItem[];
  expandMode?: 'active' | 'always';
  href?: string | null;
  label: string;
}

export function buildWorkerTopLevelMenuItems(input: {
  currentSiteKey: string | null;
  extraItems: WorkerMenuItem[];
  pathname: string | null;
  resolvedMailboxBox: 'inbox' | 'sent';
  siteNavView: SiteNavView;
}): WorkerTopLevelMenuItem[] {
  const { currentSiteKey, extraItems, pathname, resolvedMailboxBox, siteNavView } = input;
  const mailboxMenuItems: WorkerMenuItem[] = [
    {
      label: '받은편지함',
      href: '/mailbox?box=inbox',
      active: pathname === '/mailbox' && resolvedMailboxBox === 'inbox',
    },
    {
      label: '보낸편지함',
      href: '/mailbox?box=sent',
      active: pathname === '/mailbox' && resolvedMailboxBox === 'sent',
    },
  ];

  const siteMenuItems: WorkerMenuItem[] = currentSiteKey
    ? [
        {
          label: '현장 메인',
          href: buildSiteHubHref(currentSiteKey),
          active: siteNavView === 'site-home',
        },
        {
          label: '기술지도 보고서',
          href: buildSiteReportsHref(currentSiteKey),
          active: siteNavView === 'reports',
        },
        {
          label: '분기 종합 보고서',
          href: buildSiteQuarterlyListHref(currentSiteKey),
          active: siteNavView === 'quarterly',
        },
        {
          label: '현장 사진첩',
          href: buildSitePhotoAlbumHref(currentSiteKey),
          active: siteNavView === 'photos',
        },
        {
          label: '불량사업장 신고',
          href: buildSiteBadWorkplaceHref(currentSiteKey, getCurrentReportMonth()),
          active: siteNavView === 'bad-workplace',
        },
      ]
    : [];

  const normalizedExtraItems = normalizeWorkerMenuItems(extraItems, pathname);
  const extraMenuActive = normalizedExtraItems.some(
    (item) => item.active || item.children?.some((child) => child.active),
  );

  const topLevelItems: WorkerTopLevelMenuItem[] = [
    {
      label: '사업장/현장',
      href: '/',
      active:
        isWorkerListPath(pathname) || siteNavView === 'site-home' || siteMenuItems.some((item) => item.active),
      children: siteMenuItems.length > 0 ? siteMenuItems : undefined,
      expandMode: siteMenuItems.length > 0 ? 'always' : undefined,
    },
    {
      label: '내 일정',
      href: buildWorkerCalendarHref(),
      active: pathname === '/calendar',
    },
    {
      label: '메일함',
      href: '/mailbox?box=inbox',
      active: pathname === '/mailbox',
      children: mailboxMenuItems,
      expandMode: 'active',
    },
  ];

  if (normalizedExtraItems.length > 0) {
    topLevelItems.push({
      label: '추가 메뉴',
      active: extraMenuActive,
      children: normalizedExtraItems,
      expandMode: 'always',
    });
  }

  return topLevelItems;
}
