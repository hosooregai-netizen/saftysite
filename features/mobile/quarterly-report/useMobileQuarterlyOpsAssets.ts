import { useEffect, useMemo, useState } from 'react';
import { fetchSafetyContentItems } from '@/lib/safetyApi';
import {
  pickCampaignTemplateContentItems,
  readSafetyContentItemsSessionCache,
  writeSafetyContentItemsSessionCache,
} from '@/lib/safetyApi/contentItemsCache';
import type { MobileQuarterlyOpsAsset } from './types';

interface UseMobileQuarterlyOpsAssetsParams {
  contentCacheScope: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  token: string | null;
}

export function useMobileQuarterlyOpsAssets({
  contentCacheScope,
  isAuthenticated,
  isReady,
  token,
}: UseMobileQuarterlyOpsAssetsParams) {
  const cachedItems = useMemo(
    () => (contentCacheScope ? readSafetyContentItemsSessionCache(contentCacheScope) : null),
    [contentCacheScope],
  );
  const cachedOpsAssets = useMemo(
    () => (cachedItems ? pickCampaignTemplateContentItems(cachedItems) : []),
    [cachedItems],
  );
  const [opsAssets, setOpsAssets] = useState<MobileQuarterlyOpsAsset[]>(cachedOpsAssets);
  const [isOpsAssetsLoading, setIsOpsAssetsLoading] = useState(cachedItems === null);
  const [isOpsAssetsRefreshing, setIsOpsAssetsRefreshing] = useState(cachedItems !== null);

  useEffect(() => {
    if (!isAuthenticated || !isReady || !token) return;
    let cancelled = false;
    void fetchSafetyContentItems(token)
      .then((items) => {
        if (cancelled) return;
        if (contentCacheScope) {
          writeSafetyContentItemsSessionCache(contentCacheScope, items);
        }
        setOpsAssets(pickCampaignTemplateContentItems(items));
      })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        setIsOpsAssetsLoading(false);
        setIsOpsAssetsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contentCacheScope, isAuthenticated, isReady, token]);

  return {
    isOpsAssetsLoading,
    isOpsAssetsRefreshing,
    opsAssets,
    setOpsAssets,
  };
}
