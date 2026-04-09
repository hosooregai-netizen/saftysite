import {
  buildMobileSiteHomeHref,
  buildMobileSiteQuarterlyListHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';

type MobileSiteTabKey =
  | 'site-home'
  | 'reports'
  | 'quarterly'
  | 'photos'
  | 'bad-workplace'
  | null;

export function buildSiteTabs(siteId: string, activeTab: MobileSiteTabKey = null) {
  return [
    {
      label: '현장 메인',
      href: buildMobileSiteHomeHref(siteId),
      isActive: activeTab === 'site-home' ? true : undefined,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2h2" />
          <path d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      label: '기술지도',
      href: buildMobileSiteReportsHref(siteId),
      isActive: activeTab === 'reports' ? true : undefined,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      ),
    },
    {
      label: '분기 보고',
      href: buildMobileSiteQuarterlyListHref(siteId),
      isActive: activeTab === 'quarterly' ? true : undefined,
      icon: (
        <svg viewBox="0 0 24 24">
          <rect width="20" height="5" x="2" y="4" rx="2" />
          <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
          <path d="M10 13h4" />
        </svg>
      ),
    },
    {
      label: '사진첩',
      href: '#',
      isActive: activeTab === 'photos' ? true : undefined,
      icon: (
        <svg viewBox="0 0 24 24">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      label: '불량신고',
      href: '#',
      isActive: activeTab === 'bad-workplace' ? true : undefined,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" x2="12" y1="9" y2="13" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
      ),
    },
  ];
}
