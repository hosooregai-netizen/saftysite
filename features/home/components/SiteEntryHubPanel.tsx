'use client';

import { useEffect, useState } from 'react';
import { SiteManagementMainPanel } from '@/features/admin/sections/headquarters/SiteManagementMainPanel';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { SafetySite } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';
import homeStyles from './HomeScreen.module.css';

interface SiteEntryHubPanelProps {
  currentSite: InspectionSite;
}

export function SiteEntryHubPanel({ currentSite }: SiteEntryHubPanelProps) {
  const { ensureAssignedSafetySite } = useInspectionSessions();
  const [safetySite, setSafetySite] = useState<SafetySite | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const site = await ensureAssignedSafetySite(currentSite.id);
      if (cancelled) {
        return;
      }
      if (!site) {
        setLoadError(true);
        return;
      }
      setSafetySite(site);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentSite.id, ensureAssignedSafetySite]);

  if (loadError) {
    return (
      <div className={homeStyles.emptyState}>
        <p className={homeStyles.emptyTitle}>현장 상세 정보를 불러오지 못했습니다.</p>
        <p className={homeStyles.emptyDescription}>
          배정 현장 목록을 다시 확인하거나 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  if (!safetySite) {
    return (
      <div className={homeStyles.emptyState}>
        <p className={homeStyles.emptyTitle}>현장 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <SiteManagementMainPanel
      headquarter={null}
      showSiteEditAction={false}
      site={safetySite}
    />
  );
}
