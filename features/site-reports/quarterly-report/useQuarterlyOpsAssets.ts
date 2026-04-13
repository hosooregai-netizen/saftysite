import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchSafetyContentItems, readSafetyAuthToken } from '@/lib/safetyApi';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import { applyQuarterlyOpsAsset, getAutoMatchedOpsAsset, hasSameQuarterlyOpsAsset, mapContentItemToOpsAsset } from './quarterlyOpsAssets';
import type { OpsAssetOption } from './types';

export function useQuarterlyOpsAssets(args: {
  draft: QuarterlySummaryReport;
  setDraft: Dispatch<SetStateAction<QuarterlySummaryReport>>;
}) {
  const { draft, setDraft } = args;
  const [opsAssets, setOpsAssets] = useState<OpsAssetOption[]>([]);
  const [opsLoaded, setOpsLoaded] = useState(false);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOpsAssets = async () => {
      setOpsLoading(true);
      setOpsError(null);
      try {
        const token = readSafetyAuthToken();
        if (!token) throw new Error('콘텐츠를 불러오려면 다시 로그인해 주세요.');
        const contentItems = await fetchSafetyContentItems(token);
        if (cancelled) return;
        setOpsAssets(
          contentItems
            .filter((item) => item.content_type === 'campaign_template')
            .sort(
              (left, right) =>
                left.sort_order - right.sort_order || left.title.localeCompare(right.title, 'ko'),
            )
            .map(mapContentItemToOpsAsset),
        );
      } catch (nextError) {
        if (cancelled) return;
        setOpsError(
          nextError instanceof Error
            ? nextError.message
            : 'OPS 자료를 불러오는 중 오류가 발생했습니다.',
        );
      } finally {
        if (!cancelled) {
          setOpsLoading(false);
          setOpsLoaded(true);
        }
      }
    };

    void loadOpsAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const autoMatchedOpsAsset = useMemo(() => {
    if (!opsLoaded || opsError) {
      return null;
    }
    return getAutoMatchedOpsAsset(opsAssets, draft);
  }, [draft, opsAssets, opsError, opsLoaded]);

  useEffect(() => {
    if (!opsLoaded || opsError) {
      return;
    }

    setDraft((current) => {
      if (hasSameQuarterlyOpsAsset(current, autoMatchedOpsAsset)) {
        return current;
      }

      return applyQuarterlyOpsAsset(current, autoMatchedOpsAsset);
    });
  }, [autoMatchedOpsAsset, opsError, opsLoaded, setDraft]);

  return {
    opsError,
    opsLoading,
  };
}
