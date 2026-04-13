import type { AdminSectionKey } from '@/lib/admin';

interface AdminDashboardShellStateInput {
  activeSection: AdminSectionKey;
  activeSectionLabel: string;
  selectedHeadquarterId: string | null;
  selectedHeadquarterName: string | null;
  selectedSiteId: string | null;
  selectedSiteName: string | null;
  onClearHeadquarterSelection: () => void;
  onClearSiteSelection: () => void;
}

export function buildAdminDashboardShellState({
  activeSection,
  activeSectionLabel,
  selectedHeadquarterId,
  selectedHeadquarterName,
  selectedSiteId,
  selectedSiteName,
  onClearHeadquarterSelection,
  onClearSiteSelection,
}: AdminDashboardShellStateInput) {
  const headquartersTitle =
    selectedSiteName?.trim() ||
    selectedHeadquarterName?.trim() ||
    activeSectionLabel;
  const backLabel =
    activeSection === 'headquarters'
      ? selectedSiteId
        ? '현장 목록'
        : selectedHeadquarterId
          ? '사업장 목록'
          : undefined
      : undefined;
  const onBack =
    activeSection === 'headquarters'
      ? selectedSiteId
        ? onClearSiteSelection
        : selectedHeadquarterId
          ? onClearHeadquarterSelection
          : undefined
      : undefined;

  return {
    activeSectionLabel: activeSection === 'headquarters' ? headquartersTitle : activeSectionLabel,
    backLabel,
    onBack,
  };
}
