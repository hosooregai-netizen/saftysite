'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createInspectionSession,
  createEmptyAdminSiteSnapshot,
  getSessionSiteKey,
  getSessionProgress,
  isMeaningfulSnapshotText,
  normalizeSectionKey,
  touchDocumentMeta,
} from '@/constants/inspectionSession';
import { readFileAsDataUrl } from '@/components/session/workspace/utils';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { fetchAdminReportSessionBootstrap } from '@/lib/admin/apiClient';
import {
  convertHwpxBlobToPdfWithFallback,
  fetchInspectionHwpxDocument,
  fetchInspectionHwpxDocumentByReportKey,
  saveBlobAsFile,
} from '@/lib/api';
import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import {
  canUploadContentAssets,
  isAdminUserRole,
} from '@/lib/admin';
import { uploadPhotoAlbumAsset } from '@/lib/photos/apiClient';
import {
  uploadSafetyAssetFile,
  validateSafetyAssetFile,
} from '@/lib/safetyApi/assets';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { mergeMasterDataIntoSession } from '@/lib/safetyApiMappers/masterData';
import type {
  InspectionDocumentSource,
  InspectionReportListItem,
  InspectionSectionKey,
  InspectionSession,
  InspectionSite,
  ReportIndexStatus,
} from '@/types/inspectionSession';
import { applyInspectionSessionMetaFieldChange } from '@/features/inspection-session/lib/applyInspectionSessionMetaFieldChange';
import { buildInspectionSessionDerivedData } from '@/features/inspection-session/lib/buildInspectionSessionDerivedData';
import {
  INSPECTION_WORKSPACE_SECTIONS,
  resolveWorkspaceSectionKey,
} from '@/features/inspection-session/workspace/workspaceSections';
import { buildSitePhotoAlbumHref } from '@/features/home/lib/siteEntry';
import { useResolvedSiteRoute } from '@/features/site-reports/hooks/useResolvedSiteRoute';
import { getMetaTouchSection } from '@/components/session/workspace/utils';

function mergeMissingSnapshotFields(
  currentSnapshot: InspectionSession['adminSiteSnapshot'],
  siteSnapshot: InspectionSession['adminSiteSnapshot'],
) {
  const base = createEmptyAdminSiteSnapshot(currentSnapshot);
  let changed = false;

  const merged = createEmptyAdminSiteSnapshot();
  const mutableMerged = merged as Record<
    keyof InspectionSession['adminSiteSnapshot'],
    string | boolean
  >;
  const keys = Object.keys(base) as Array<keyof InspectionSession['adminSiteSnapshot']>;

  for (const typedKey of keys) {
    const value = base[typedKey];
    const fallback = siteSnapshot[typedKey];
    const nextValue =
      typeof value === 'string' && isMeaningfulSnapshotText(value)
        ? value
        : typeof fallback === 'string' && isMeaningfulSnapshotText(fallback)
          ? fallback
          : typeof value === 'boolean'
            ? value || (typeof fallback === 'boolean' ? fallback : value)
            : typeof fallback === 'boolean'
              ? fallback
          : value;

    if (nextValue !== value) {
      changed = true;
    }

    mutableMerged[typedKey] = nextValue;
  }

  return { changed, merged };
}

function getReportMetaText(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return typeof value === 'string' ? value.trim() : '';
}

function buildShellSessionFromReportIndexItem(
  item: InspectionReportListItem,
  site: InspectionSite,
) {
  const reportDate =
    item.visitDate ||
    getReportMetaText(item.meta, 'reportDate') ||
    new Date().toISOString().slice(0, 10);
  const base = createInspectionSession(
    {
      adminSiteSnapshot: site.adminSiteSnapshot,
      meta: {
        siteName: getReportMetaText(item.meta, 'siteName') || site.siteName,
        reportDate,
        reportTitle:
          getReportMetaText(item.meta, 'reportTitle') || item.reportTitle || '',
        drafter: getReportMetaText(item.meta, 'drafter') || site.assigneeName,
        reviewer: getReportMetaText(item.meta, 'reviewer'),
        approver: getReportMetaText(item.meta, 'approver'),
      },
    },
    site.id,
    item.visitRound || 1,
  );

  return {
    ...base,
    id: item.reportKey,
    siteKey: site.id,
    reportNumber: item.visitRound || 1,
    currentSection: normalizeSectionKey(item.meta.currentSection),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastSavedAt: item.lastAutosavedAt || item.updatedAt,
  };
}

export function useInspectionSessionScreen(sessionId: string) {
  const {
    authError,
    currentUser,
    ensureMasterDataLoaded,
    ensureSessionLoaded,
    getReportIndexBySiteId,
    getSessionById,
    getSessionsBySiteId,
    getSiteById,
    isAuthenticated,
    isReady,
    isSaving,
    login,
    logout,
    masterData,
    refreshMasterData,
    saveNow,
    sites,
    syncError,
    upsertHydratedSiteSessions,
    updateSession,
  } = useInspectionSessions();
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [missingRelationsStatus, setMissingRelationsStatus] =
    useState<ReportIndexStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const forcedRelationRefreshIdsRef = useRef<Set<string>>(new Set());
  const legacyBootstrapAttemptIdsRef = useRef<Set<string>>(new Set());
  const saveNowRef = useRef(saveNow);
  const relationRefreshAttemptKeysRef = useRef<Set<string>>(new Set());
  const session = getSessionById(sessionId);
  const shellReportItem = useMemo(() => {
    if (session) {
      return null;
    }

    for (const candidateSite of sites) {
      const reportIndexState = getReportIndexBySiteId(candidateSite.id);
      const matchedItem = reportIndexState?.items.find((item) => item.reportKey === sessionId);
      if (matchedItem) {
        return matchedItem;
      }
    }

    return null;
  }, [getReportIndexBySiteId, session, sessionId, sites]);
  const shellSite = useMemo(() => {
    if (!shellReportItem) {
      return null;
    }

    return (
      getSiteById(shellReportItem.siteId) ||
      sites.find((candidateSite) => candidateSite.id === shellReportItem.siteId) ||
      null
    );
  }, [getSiteById, shellReportItem, sites]);
  const resolvedRouteSiteKey = session
    ? getSessionSiteKey(session)
    : shellReportItem?.siteId || null;
  const { currentSite: resolvedRouteSite } = useResolvedSiteRoute(resolvedRouteSiteKey);
  const shellSession = useMemo(
    () =>
      session || !shellReportItem || !shellSite
        ? null
        : buildShellSessionFromReportIndexItem(shellReportItem, shellSite),
    [session, shellReportItem, shellSite],
  );
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const displaySession = session ?? shellSession;
  const currentSection = displaySession?.currentSection ?? 'doc1';
  const workspaceCurrentSection = resolveWorkspaceSectionKey(currentSection);
  const currentSectionIndex = displaySession
    ? INSPECTION_WORKSPACE_SECTIONS.findIndex(
        (item) => item.key === workspaceCurrentSection,
      )
    : -1;
  const site = resolvedRouteSite ?? (session ? getSiteById(getSessionSiteKey(session)) : null);
  const displaySite = site ?? shellSite;
  const storedRelations = session?.technicalGuidanceRelations ?? null;
  const hasStoredRelations = Boolean(
    storedRelations &&
      (storedRelations.computedAt ||
        storedRelations.cumulativeAccidentEntries.length > 0 ||
        storedRelations.cumulativeAgentEntries.length > 0),
  );
  const shouldTreatInitialRelationsAsEmpty =
    Boolean(session) &&
    (session?.reportNumber ?? 0) <= 1 &&
    !Boolean(storedRelations?.stale) &&
    !hasStoredRelations;
  const needsRelationRefresh =
    Boolean(session) &&
    (Boolean(storedRelations?.stale) ||
      (!hasStoredRelations && !shouldTreatInitialRelationsAsEmpty));
  const relationStatus: ReportIndexStatus = !session
    ? 'idle'
    : shouldTreatInitialRelationsAsEmpty
      ? 'idle'
      : needsRelationRefresh
      ? missingRelationsStatus === 'error'
        ? 'error'
        : 'loading'
      : hasStoredRelations
        ? 'loaded'
        : 'idle';
  const isRelationReady = Boolean(session) && hasStoredRelations;
  const isRelationHydrating =
    Boolean(session) &&
    needsRelationRefresh &&
    missingRelationsStatus === 'loading';
  const relationNotice =
    storedRelations?.stale && missingRelationsStatus === 'error'
      ? '최신 연동값을 다시 불러오지 못해 저장된 값을 표시하고 있습니다.'
      : null;
  const derivedData = useMemo(
    () =>
      session
        ? buildInspectionSessionDerivedData(
            masterData,
            session,
            getSessionsBySiteId(session.siteKey),
          )
        : {
            currentAccidentEntries: [],
            currentAgentEntries: [],
            cumulativeAccidentEntries: [],
            cumulativeAgentEntries: [],
            doc7ReferenceMaterials: [],
            hazardCountermeasureCatalog: [],
            measurementTemplates: [],
            progress: null,
            siteSessions: [],
          },
    [getSessionsBySiteId, masterData, session],
  );
  const relationRefreshAttemptKey = session
    ? [
        session.id,
        session.updatedAt,
        session.lastSavedAt ?? '',
        storedRelations?.computedAt ?? '',
        storedRelations?.stale ? 'stale' : 'fresh',
        hasStoredRelations ? 'present' : 'missing',
      ].join(':')
    : '';
  const backHref = site ? `/sites/${encodeURIComponent(site.id)}` : '/';
  const photoAlbumHref = site
    ? buildSitePhotoAlbumHref(site.id, {
        backHref: `/sessions/${encodeURIComponent(sessionId)}`,
        backLabel: '보고서로 돌아가기',
        reportKey: sessionId,
        reportTitle: session?.meta.reportTitle || '',
      })
    : null;

  const shellProgress = useMemo(() => {
    if (!shellSession || !shellReportItem) {
      return null;
    }

    const baseProgress = getSessionProgress(shellSession);
    const percentage =
      typeof shellReportItem.progressRate === 'number'
        ? Math.max(0, Math.min(100, Math.round(shellReportItem.progressRate)))
        : baseProgress.percentage;

    return {
      completed:
        baseProgress.total > 0
          ? Math.max(
              0,
              Math.min(
                baseProgress.total,
                Math.round((percentage / 100) * baseProgress.total),
              ),
            )
          : 0,
      total: baseProgress.total,
      percentage,
    };
  }, [shellReportItem, shellSession]);
  const hasDisplaySession = Boolean(displaySession);
  const displayProgress = derivedData.progress ?? shellProgress;
  const displayBackHref = displaySite
    ? `/sites/${encodeURIComponent(displaySite.id)}`
    : backHref;
  const displayPhotoAlbumHref = displaySite
    ? buildSitePhotoAlbumHref(displaySite.id, {
        backHref: `/sessions/${encodeURIComponent(sessionId)}`,
        backLabel: '보고서로 돌아가기',
        reportKey: sessionId,
        reportTitle: displaySession?.meta.reportTitle || '',
      })
    : photoAlbumHref;

  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    return () => {
      void saveNowRef.current();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const shouldLoadImmediately = ['doc7', 'doc10', 'doc13', 'doc14'].includes(currentSection);
    if (shouldLoadImmediately) {
      void ensureMasterDataLoaded();
      return;
    }

    let cancelled = false;
    const idleApi = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const runLoad = () => {
      if (!cancelled) {
        void ensureMasterDataLoaded();
      }
    };

    if (typeof idleApi.requestIdleCallback === 'function') {
      const handle = idleApi.requestIdleCallback(runLoad, { timeout: 1500 });
      return () => {
        cancelled = true;
        idleApi.cancelIdleCallback?.(handle);
      };
    }

    const timeoutId = window.setTimeout(runLoad, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentSection, ensureMasterDataLoaded, session]);

  useEffect(() => {
    if (!isAuthenticated || !isReady) {
      setIsLoadingSession(false);
      return;
    }

    let cancelled = false;
    const loadSession = async () => {
      setIsLoadingSession(!hasDisplaySession);

      const shouldBootstrapLegacy = sessionId.startsWith('legacy:') && isAdminView;
      if (shouldBootstrapLegacy) {
        if (getSessionById(sessionId)) {
          if (!cancelled) {
            setIsLoadingSession(false);
          }
          return;
        }
        if (legacyBootstrapAttemptIdsRef.current.has(sessionId)) {
          if (!cancelled) {
            setIsLoadingSession(false);
          }
          return;
        }

        legacyBootstrapAttemptIdsRef.current.add(sessionId);

        try {
          const payload = await fetchAdminReportSessionBootstrap(sessionId);
          if (cancelled) return;
          upsertHydratedSiteSessions(payload.site, payload.siteSessions);
        } catch {
          // Leave the screen in its missing-state fallback when bootstrap also fails.
        } finally {
          if (!cancelled) {
            setIsLoadingSession(false);
          }
        }
        return;
      }

      try {
        await ensureSessionLoaded(sessionId);
      } catch {
        // Legacy admin bootstrap fallback can still recover after a general by-key miss.
      }
      if (cancelled || getSessionById(sessionId)) {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
        return;
      }
      setIsLoadingSession(false);
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [
    ensureSessionLoaded,
    getSessionById,
    hasDisplaySession,
    isAdminView,
    isAuthenticated,
    isReady,
    sessionId,
    upsertHydratedSiteSessions,
  ]);

  useEffect(() => {
    if (!session) {
      forcedRelationRefreshIdsRef.current.clear();
      relationRefreshAttemptKeysRef.current.clear();
      setMissingRelationsStatus('idle');
      return;
    }

    if (isAdminView && session.id.startsWith('legacy:')) {
      forcedRelationRefreshIdsRef.current.delete(session.id);
      relationRefreshAttemptKeysRef.current.delete(relationRefreshAttemptKey);
      setMissingRelationsStatus('idle');
      return;
    }

    if (!needsRelationRefresh) {
      forcedRelationRefreshIdsRef.current.delete(session.id);
      relationRefreshAttemptKeysRef.current.delete(relationRefreshAttemptKey);
      setMissingRelationsStatus('idle');
      return;
    }

    if (!isAuthenticated || !isReady) {
      return;
    }

    if (forcedRelationRefreshIdsRef.current.has(session.id)) {
      return;
    }
    if (relationRefreshAttemptKeysRef.current.has(relationRefreshAttemptKey)) {
      return;
    }

    let cancelled = false;
    forcedRelationRefreshIdsRef.current.add(session.id);
    relationRefreshAttemptKeysRef.current.add(relationRefreshAttemptKey);
    setMissingRelationsStatus('loading');
    void ensureSessionLoaded(session.id, { force: true })
      .then(() => {
        forcedRelationRefreshIdsRef.current.delete(session.id);
        if (!cancelled) {
          setMissingRelationsStatus('idle');
        }
      })
      .catch(() => {
        forcedRelationRefreshIdsRef.current.delete(session.id);
        if (!cancelled) {
          setMissingRelationsStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    ensureSessionLoaded,
    isAuthenticated,
    isAdminView,
    isReady,
    needsRelationRefresh,
    relationRefreshAttemptKey,
    session,
  ]);

  useEffect(() => {
    if (!session || !site) return;

    const { changed, merged } = mergeMissingSnapshotFields(
      session.adminSiteSnapshot,
      site.adminSiteSnapshot,
    );
    if (!changed) return;

    updateSession(session.id, (current) => ({
      ...current,
      adminSiteSnapshot: merged,
    }));
  }, [session, site, updateSession]);

  const applyDocumentUpdate = (
    key: InspectionSectionKey,
    source: InspectionDocumentSource,
    updater: (current: InspectionSession) => InspectionSession,
    options?: { touch?: boolean },
  ) => {
    updateSession(sessionId, (current) => {
      const next = updater(current);
      const nextWithMasterData =
        current.document2Overview.guidanceDate !== next.document2Overview.guidanceDate
          ? mergeMasterDataIntoSession(next, masterData)
          : next;

      return options?.touch === false
        ? nextWithMasterData
        : touchDocumentMeta(nextWithMasterData, key, source);
    });
  };

  const withFileData = async (
    file: File,
    onLoaded?: (value: string, selectedFile: File) => void,
  ) => {
    try {
      setUploadError(null);
      const validationMessage = validateSafetyAssetFile(file);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const canUploadAssets = canUploadContentAssets(currentUser?.role);
      const isImageFile =
        file.type.startsWith('image/') ||
        /\.(png|jpe?g|gif|bmp|webp|heic|heif)$/i.test(file.name);
      let value = '';

      if (isImageFile && site?.id) {
        const uploaded = await uploadPhotoAlbumAsset({
          file,
          roundNo: Math.max(1, session?.reportNumber || 1),
          siteId: site.id,
        });
        value = uploaded.previewUrl;
      } else if (canUploadAssets) {
        const uploaded = await uploadSafetyAssetFile(file);
        value = uploaded.url;
      } else {
        value = await readFileAsDataUrl(file);
      }

      onLoaded?.(value, file);
      return value;
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : '파일을 불러오는 중 오류가 발생했습니다.',
      );
      return null;
    }
  };

  const changeMetaField = (field: keyof InspectionSession['meta'], value: string) => {
    if (!session) return;

    const metaTouchSection = getMetaTouchSection(currentSection);
    applyDocumentUpdate(
      metaTouchSection,
      'manual',
      (current) =>
        applyInspectionSessionMetaFieldChange(current, field, value, masterData),
      { touch: true },
    );
  };

  const moveSection = (direction: -1 | 1) => {
    const nextIndex = currentSectionIndex + direction;
    if (nextIndex < 0 || nextIndex >= INSPECTION_WORKSPACE_SECTIONS.length) return;

    updateSession(sessionId, (current) => ({
      ...current,
      currentSection: INSPECTION_WORKSPACE_SECTIONS[nextIndex].key,
    }));
  };

  const selectSection = (key: InspectionSectionKey) => {
    updateSession(sessionId, (current) => ({
      ...current,
      currentSection: resolveWorkspaceSectionKey(key),
    }));
  };

  const buildHwpxDocument = async () => {
    if (!session) return null;

    if (isAuthenticated) {
      try {
        await refreshMasterData();
      } catch (error) {
        console.warn('Inspection master-data refresh before HWPX generation failed; using cached feed data.', {
          error: error instanceof Error ? error.message : String(error),
          sessionId: session.id,
        });
      }
    }

    await saveNow();
    const latestSession = getSessionById(session.id) ?? session;
    const latestSiteSessions = getSessionsBySiteId(latestSession.siteKey);

    try {
      const generation = await generateInspectionHwpxBlob(latestSession, latestSiteSessions);

      if (generation.warnings.length > 0 || generation.deferred.length > 0) {
        console.warn('HWPX generation warnings', {
          deferred: generation.deferred,
          sessionId: session.id,
          warnings: generation.warnings,
        });
      }

      return generation;
    } catch (browserError) {
      console.warn('Inspection HWPX browser generation failed; falling back to server generation.', {
        error: browserError instanceof Error ? browserError.message : String(browserError),
        sessionId: session.id,
      });
    }

    const authToken = readSafetyAuthToken();

    try {
      return await fetchInspectionHwpxDocumentByReportKey(latestSession.id, authToken);
    } catch (serverError) {
      console.warn('Inspection HWPX report-key export failed; falling back to session payload export.', {
        error: serverError instanceof Error ? serverError.message : String(serverError),
        sessionId: session.id,
      });
    }

    return fetchInspectionHwpxDocument(latestSession, latestSiteSessions);
  };

  const generateHwpxDocument = async () => {
    if (!session) return;

    try {
      setDocumentError(null);
      setIsGeneratingHwpx(true);
      const generation = await buildHwpxDocument();
      if (!generation) return;

      saveBlobAsFile(generation.blob, generation.filename);
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : '문서 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingHwpx(false);
    }
  };

  const generatePdfDocument = async () => {
    if (!session) return;

    try {
      setDocumentError(null);
      setIsGeneratingPdf(true);
      if (isAuthenticated) {
        try {
          await refreshMasterData();
        } catch (error) {
          console.warn('Inspection master-data refresh before PDF generation failed; using cached feed data.', {
            error: error instanceof Error ? error.message : String(error),
            sessionId: session.id,
          });
        }
      }

      const generation = await buildHwpxDocument();
      if (!generation) return;

      const pdf = await convertHwpxBlobToPdfWithFallback(generation.blob, generation.filename);
      saveBlobAsFile(pdf.blob, pdf.filename);
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : 'PDF 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    applyDocumentUpdate,
    authError,
    backHref: displayBackHref,
    changeMetaField,
    currentSection: workspaceCurrentSection,
    currentSectionIndex,
    currentUserName: currentUser?.name,
    derivedData,
    displayProgress,
    displaySession,
    documentError,
    generateHwpxDocument,
    generatePdfDocument,
    isAdminView,
    isAuthenticated,
    isGeneratingDocument: isGeneratingHwpx || isGeneratingPdf,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoadingSession,
    isRelationHydrating,
    isRelationReady,
    isReady,
    isSaving,
    login,
    logout,
    moveSection,
    photoAlbumHref: displayPhotoAlbumHref,
    sectionSession: session,
    selectSection,
    site: displaySite,
    relationStatus,
    relationNotice,
    saveNow,
    syncError,
    uploadError,
    withFileData,
  };
}
