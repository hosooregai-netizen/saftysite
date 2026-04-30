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
import type { AdminCoreDataScope } from './useAdminDashboardDataLoaders';

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
  const shouldLoadReports = activeSection === 'mailbox';
  const coreDataScope: AdminCoreDataScope =
    activeSection === 'mailbox' ? 'mailbox' : activeSection === 'photos' ? 'photo-sites' : 'none';
  const shouldLoadCoreData = coreDataScope !== 'none';

  const replaceRoute = useCallback(
    (section: AdminSectionKey, query: AdminSectionQuery = {}) => {
      router.replace(getAdminSectionHref(section, query));
    },
    [router],
  );
  const pushPreservedRoute = useCallback(
    (section: AdminSectionKey, query: AdminSectionQuery = {}) => {
      router.push(
        getAdminSectionHref(section, {
          ...Object.fromEntries(searchParams.entries()),
          ...query,
        }),
      );
    },
    [router, searchParams],
  );
  const replacePreservedRoute = useCallback(
    (section: AdminSectionKey, query: AdminSectionQuery = {}) => {
      router.replace(
        getAdminSectionHref(section, {
          ...Object.fromEntries(searchParams.entries()),
          ...query,
        }),
      );
    },
    [router, searchParams],
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

    // The headquarters section resolves selected headquarter/site context with its own
    // section-level list APIs. Do not eagerly clear URL state here based on shell data,
    // because the shell may not have loaded headquarters yet or may still be on a
    // sites-only bootstrap scope from another section.
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
    clearHeadquarterSelection: () =>
      replacePreservedRoute('headquarters', { headquarterId: null, siteId: null }),
    clearSiteSelection: () =>
      replacePreservedRoute('headquarters', {
        headquarterId: selectedHeadquarterId,
        siteId: null,
      }),
    replaceRoute,
    requestedSection,
    selectHeadquarter: (headquarterId: string) =>
      pushPreservedRoute('headquarters', { headquarterId, siteId: null }),
    selectSection,
    selectSite: (headquarterId: string, siteId: string) =>
      pushPreservedRoute('headquarters', { headquarterId, siteId }),
    selectedHeadquarter,
    selectedHeadquarterId,
    selectedSite,
    selectedSiteId,
    coreDataScope,
    shouldLoadContent,
    shouldLoadCoreData,
    shouldLoadReports,
  };
}
