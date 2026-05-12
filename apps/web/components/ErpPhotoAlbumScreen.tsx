'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { saveBlobAsFile } from '@/lib/api';
import {
  createGuestLocalId,
  readGuestWorkspaceCache,
  setGuestDirectoryCache,
  upsertGuestPhotoAlbumItem,
  writeGuestWorkspaceCache,
  type GuestPhotoAlbumItem,
} from '@/lib/guestWorkspaceCache';
import { bootstrapDemoSession, isAuthenticatedSession, type DemoSession } from '@/lib/reportApi';
import { prepareUploadImage } from '@/lib/reportImages';
import { fetchSafetyHeadquarters, fetchSafetySitesAdmin } from '@/lib/safetyApi/adminEndpoints';
import type { SafetySite } from '@/types/backend';
import type { SafetyHeadquarter } from '@/types/controller';
import type { PhotoAlbumItem, PhotoAlbumListResponse } from '@/types/photos';
import {
  PhotoAlbumPanel,
  type PhotoAlbumDataAdapter,
} from '@/features/photos/components/PhotoAlbumPanel';

function matchesGuestPhoto(
  item: GuestPhotoAlbumItem,
  input: {
    headquarterId: string;
    query: string;
    siteId: string;
  },
  sitesById: Map<string, SafetySite>,
  headquartersById: Map<string, SafetyHeadquarter>,
) {
  if (input.headquarterId && item.headquarterId !== input.headquarterId) return false;
  if (input.siteId && item.siteId !== input.siteId) return false;
  if (!input.query) return true;

  const site = sitesById.get(item.siteId);
  const headquarter = headquartersById.get(item.headquarterId);
  return [
    item.fileName,
    site?.site_name,
    headquarter?.name,
    site?.site_address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(input.query);
}

function compareGuestPhotoRows(left: PhotoAlbumItem, right: PhotoAlbumItem) {
  const leftDate = left.capturedAt || left.createdAt;
  const rightDate = right.capturedAt || right.createdAt;
  return (
    right.siteName.localeCompare(left.siteName, 'ko') ||
    right.roundNo - left.roundNo ||
    rightDate.localeCompare(leftDate) ||
    right.createdAt.localeCompare(left.createdAt) ||
    left.fileName.localeCompare(right.fileName, 'ko')
  );
}

function mapGuestPhotoItem(
  item: GuestPhotoAlbumItem,
  sitesById: Map<string, SafetySite>,
  headquartersById: Map<string, SafetyHeadquarter>,
): PhotoAlbumItem {
  const site = sitesById.get(item.siteId);
  const headquarter =
    headquartersById.get(item.headquarterId) ??
    (site?.headquarter_detail ?? null);

  return {
    capturedAt: item.capturedAt,
    contentType: item.contentType,
    createdAt: item.capturedAt,
    downloadUrl: item.dataUrl,
    fileName: item.fileName,
    gpsLatitude: null,
    gpsLongitude: null,
    headquarterId: item.headquarterId,
    headquarterName: headquarter?.name || site?.client_business_name || '건설사 미상',
    id: item.id,
    previewUrl: item.dataUrl,
    roundNo: item.roundNo,
    siteId: item.siteId,
    siteName: site?.site_name || '현장 미상',
    sizeBytes: item.sizeBytes,
    sourceDocumentKey: '',
    sourceKind: 'album_upload',
    sourceReportKey: '',
    sourceReportTitle: '',
    sourceSlotKey: '',
    uploadedByName: '임시 보관함',
    uploadedByUserId: 'guest-cache',
  };
}

async function saveGuestPhotoDownload(item: PhotoAlbumItem) {
  const response = await fetch(item.downloadUrl);
  const blob = await response.blob();
  saveBlobAsFile(blob, item.fileName || 'photo.jpg');
}

export function ErpPhotoAlbumScreen() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [headquarters, setHeadquarters] = useState<SafetyHeadquarter[]>([]);
  const [sites, setSites] = useState<SafetySite[]>([]);
  const [guestRows, setGuestRows] = useState<GuestPhotoAlbumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const cache = await readGuestWorkspaceCache();
        if (cancelled) return;
        setHeadquarters(cache.directory.headquarters);
        setSites(cache.directory.sites);
        setGuestRows(cache.photoAlbum);

        const nextSession = await bootstrapDemoSession();
        if (cancelled) return;
        setSession(nextSession);

        if (!isAuthenticatedSession(nextSession)) {
          return;
        }

        const [nextHeadquarters, nextSites] = await Promise.all([
          fetchSafetyHeadquarters(nextSession.token),
          fetchSafetySitesAdmin(nextSession.token),
        ]);
        if (cancelled) return;
        setHeadquarters(nextHeadquarters);
        setSites(nextSites);
        await setGuestDirectoryCache({
          headquarters: nextHeadquarters,
          sites: nextSites,
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '사진첩을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sitesById = useMemo(() => new Map(sites.map((site) => [site.id, site] as const)), [sites]);
  const headquartersById = useMemo(
    () => new Map(headquarters.map((item) => [item.id, item] as const)),
    [headquarters],
  );
  const hasAuthenticatedSession = Boolean(session && isAuthenticatedSession(session));
  const siteOptions = useMemo(
    () =>
      sites.map((site) => ({
        headquarterId: site.headquarter_id,
        headquarterName:
          site.headquarter_detail?.name ||
          headquartersById.get(site.headquarter_id)?.name ||
          site.client_business_name ||
          '건설사 미상',
        id: site.id,
        siteName: site.site_name,
        totalRounds:
          typeof site.total_rounds === 'number' && site.total_rounds > 0
            ? site.total_rounds
            : 1,
      })),
    [headquartersById, sites],
  );

  const guestAdapter = useMemo<PhotoAlbumDataAdapter>(
    () => ({
      deleteSelection: async (itemIds) => {
        const targetIds = new Set(itemIds);
        await writeGuestWorkspaceCache((current) => ({
          ...current,
          photoAlbum: current.photoAlbum.filter((item) => !targetIds.has(item.id)),
        }));
        setGuestRows((current) => current.filter((item) => !targetIds.has(item.id)));
      },
      downloadSelection: async (itemIds) => {
        const rows = guestRows
          .filter((item) => itemIds.includes(item.id))
          .map((item) => mapGuestPhotoItem(item, sitesById, headquartersById));
        for (const row of rows) {
          await saveGuestPhotoDownload(row);
        }
      },
      list: async (input) => {
        const query = input.deferredQuery.trim().toLowerCase();
        const rows = guestRows
          .filter((item) =>
            matchesGuestPhoto(
              item,
              {
                headquarterId: input.lockedHeadquarterId || input.headquarterId || '',
                query,
                siteId: input.lockedSiteId || input.siteId || '',
              },
              sitesById,
              headquartersById,
            ),
          )
          .map((item) => mapGuestPhotoItem(item, sitesById, headquartersById))
          .sort(compareGuestPhotoRows);
        const offset = input.offset ?? 0;
        const limit = 20;
        return {
          capabilities: {
            deleteSupported: true,
            roundUpdateSupported: true,
          },
          limit,
          offset,
          rows: rows.slice(offset, offset + limit),
          total: rows.length,
        } satisfies PhotoAlbumListResponse;
      },
      updateRounds: async (itemIds, nextRoundNo) => {
        const targetIds = new Set(itemIds);
        await writeGuestWorkspaceCache((current) => ({
          ...current,
          photoAlbum: current.photoAlbum.map((item) =>
            targetIds.has(item.id) ? { ...item, roundNo: nextRoundNo } : item,
          ),
        }));
        setGuestRows((current) =>
          current.map((item) =>
            targetIds.has(item.id) ? { ...item, roundNo: nextRoundNo } : item,
          ),
        );
      },
      upload: async (input) => {
        const prepared = await prepareUploadImage(input.file);
        const nextItem: GuestPhotoAlbumItem = {
          capturedAt: new Date().toISOString(),
          contentType: 'image/jpeg',
          dataUrl: prepared.dataUrl,
          fileName: prepared.fileName,
          headquarterId: sitesById.get(input.siteId)?.headquarter_id ?? '',
          id: createGuestLocalId('guest-photo'),
          roundNo: input.roundNo,
          siteId: input.siteId,
          sizeBytes: Math.max(prepared.dataUrl.length, 0),
          sourceKind: 'album_upload',
        };
        await upsertGuestPhotoAlbumItem(nextItem);
        setGuestRows((current) => [nextItem, ...current.filter((item) => item.id !== nextItem.id)]);
        return mapGuestPhotoItem(nextItem, sitesById, headquartersById);
      },
    }),
    [guestRows, headquartersById, sitesById],
  );

  if (isLoading) {
    return (
      <div className="erp-page">
        <section className="erp-panel">
          <h1 className="page-title">사진첩을 불러오는 중입니다.</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="erp-page">
      {loadError ? <div className="row-meta">{loadError}</div> : null}
        <PhotoAlbumPanel
        capabilityNotice={
          !hasAuthenticatedSession
            ? '비로그인 상태에서는 사진을 임시 보관하고, 서버 동기화와 메타데이터 엑셀은 로그인 후 사용할 수 있습니다.'
            : null
        }
        dataAdapter={hasAuthenticatedSession ? undefined : guestAdapter}
        initialHeadquarterId={searchParams.get('headquarterId')}
        initialSiteId={searchParams.get('siteId')}
        mode="admin"
        sites={siteOptions}
      />
    </div>
  );
}
