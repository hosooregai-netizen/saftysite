'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ADMIN_SECTIONS,
  getAdminSectionHref,
  isLegacyAdminSectionKey,
  parseAdminSectionKey,
} from '@/lib/admin';
import type { AdminSectionKey, AdminSectionQuery } from '@/lib/admin';
import type { ControllerDashboardData } from '@/types/controller';

interface UseAdminDashboardRoutingParams {
  data: ControllerDashboardData;
  enabled: boolean;
  hasLoadedCoreData: boolean;
}

export function useAdminDashboardRouting({
  data,
  enabled,
  hasLoadedCoreData,
}: UseAdminDashboardRoutingParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSection = searchParams.get('section');
  const requestedSection =
    rawSection ??
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('section')
      : null);
  const selectedHeadquarterId = searchParams.get('headquarterId');
  const selectedSiteId = searchParams.get('siteId');
  const activeSection = parseAdminSectionKey(requestedSection) ?? 'overview';
  const activeSectionMeta = useMemo(
    () => ADMIN_SECTIONS.find((section) => section.key === activeSection) ?? ADMIN_SECTIONS[0],
    [activeSection],
  );
  const selectedHeadquarter = useMemo(
    () =>
      selectedHeadquarterId
        ? data.headquarters.find((item) => item.id === selectedHeadquarterId) ?? null
        : null,
    [data.headquarters, selectedHeadquarterId],
  );
  const selectedSite = useMemo(
    () => (selectedSiteId ? data.sites.find((item) => item.id === selectedSiteId) ?? null : null),
    [data.sites, selectedSiteId],
  );
  const shouldLoadContent = activeSection === 'content';
  const shouldLoadReports =
    activeSection === 'reports' || activeSection === 'mailbox';
  const shouldLoadCoreData =
    activeSection === 'users' ||
    activeSection === 'headquarters' ||
    activeSection === 'reports' ||
    activeSection === 'mailbox' ||
    activeSection === 'photos' ||
    activeSection === 'schedules';

  const replaceRoute = useCallback(
    (section: AdminSectionKey, query: AdminSectionQuery = {}) => {
      router.replace(getAdminSectionHref(section, query));
    },
    [router],
  );

  useEffect(() => {
    if (!enabled) return;
    if (!requestedSection || !isLegacyAdminSectionKey(requestedSection)) {
      replaceRoute('overview');
    }
  }, [enabled, replaceRoute, requestedSection, selectedHeadquarterId, selectedSiteId]);

  useEffect(() => {
    if (!enabled || !hasLoadedCoreData) return;
    if (!requestedSection || !isLegacyAdminSectionKey(requestedSection)) return;

    if (requestedSection === 'k2b') {
      replaceRoute('headquarters', {
        headquarterId: selectedHeadquarterId,
        siteId: selectedSiteId,
      });
      return;
    }

    if (requestedSection === 'sites') {
      const matchedSite = selectedSiteId
        ? data.sites.find((site) => site.id === selectedSiteId) ?? null
        : null;

      replaceRoute('headquarters', {
        headquarterId: matchedSite?.headquarter_id ?? selectedHeadquarterId,
        siteId: matchedSite ? selectedSiteId : null,
      });
      return;
    }

    if (activeSection !== 'headquarters') return;

    if (selectedSiteId) {
      if (!selectedSite) {
        replaceRoute('headquarters', { headquarterId: selectedHeadquarterId });
        return;
      }

      if (selectedHeadquarterId !== selectedSite.headquarter_id) {
        replaceRoute('headquarters', {
          headquarterId: selectedSite.headquarter_id,
          siteId: selectedSite.id,
        });
        return;
      }
    }

    if (selectedHeadquarterId && !selectedHeadquarter) {
      replaceRoute('headquarters');
    }
  }, [
    activeSection,
    data.sites,
    enabled,
    hasLoadedCoreData,
    replaceRoute,
    requestedSection,
    selectedHeadquarter,
    selectedHeadquarterId,
    selectedSite,
    selectedSiteId,
  ]);

  const selectSection = useCallback(
    (nextSection: AdminSectionKey, query: AdminSectionQuery = {}) => {
      replaceRoute(nextSection, query);
    },
    [replaceRoute],
  );

  return {
    activeSection,
    activeSectionMeta,
    clearHeadquarterSelection: () => replaceRoute('headquarters'),
    clearSiteSelection: () => replaceRoute('headquarters', { headquarterId: selectedHeadquarterId }),
    replaceRoute,
    requestedSection,
    selectHeadquarter: (headquarterId: string) => replaceRoute('headquarters', { headquarterId }),
    selectSection,
    selectSite: (headquarterId: string, siteId: string) =>
      replaceRoute('headquarters', { headquarterId, siteId }),
    selectedHeadquarter,
    selectedHeadquarterId,
    selectedSite,
    selectedSiteId,
    shouldLoadContent,
    shouldLoadCoreData,
    shouldLoadReports,
  };
}
