'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  INSPECTION_SECTIONS,
  createEmptyAdminSiteSnapshot,
  areFollowUpItemsEqual,
  buildDerivedFollowUpItems,
  getSessionSiteKey,
  touchDocumentMeta,
} from '@/constants/inspectionSession';
import { readFileAsDataUrl } from '@/components/session/workspace/utils';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { convertHwpxBlobToPdf, saveBlobAsFile } from '@/lib/api';
import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import {
  canUploadContentAssets,
  isAdminUserRole,
} from '@/lib/admin';
import { SafetyApiError } from '@/lib/safetyApi';
import {
  uploadSafetyAssetFile,
  validateSafetyAssetFile,
} from '@/lib/safetyApi/assets';
import { mergeMasterDataIntoSession } from '@/lib/safetyApiMappers/masterData';
import type {
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
} from '@/types/inspectionSession';
import { applyInspectionSessionMetaFieldChange } from '@/features/inspection-session/lib/applyInspectionSessionMetaFieldChange';
import { buildInspectionSessionDerivedData } from '@/features/inspection-session/lib/buildInspectionSessionDerivedData';
import { getMetaTouchSection } from '@/components/session/workspace/utils';

function mergeMissingSnapshotFields(
  currentSnapshot: InspectionSession['adminSiteSnapshot'],
  siteSnapshot: InspectionSession['adminSiteSnapshot'],
) {
  const base = createEmptyAdminSiteSnapshot(currentSnapshot);
  let changed = false;

  const merged = createEmptyAdminSiteSnapshot();
  const keys = Object.keys(base) as Array<keyof InspectionSession['adminSiteSnapshot']>;

  for (const typedKey of keys) {
    const value = base[typedKey];
    const fallback = siteSnapshot[typedKey];
    const nextValue =
      typeof value === 'string' && value.trim()
        ? value
        : typeof fallback === 'string' && fallback.trim()
          ? fallback
          : value;

    if (nextValue !== value) {
      changed = true;
    }

    merged[typedKey] = nextValue;
  }

  return { changed, merged };
}

export function useInspectionSessionScreen(sessionId: string) {
  const {
    authError,
    currentUser,
    ensureMasterDataLoaded,
    ensureSessionLoaded,
    getSessionById,
    getSiteById,
    isAuthenticated,
    isReady,
    isSaving,
    login,
    logout,
    masterData,
    saveNow,
    sessions,
    syncError,
    updateSession,
  } = useInspectionSessions();
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isGeneratingHwpx, setIsGeneratingHwpx] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const session = getSessionById(sessionId);
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const currentSection = session?.currentSection ?? 'doc1';
  const currentSectionIndex = session
    ? INSPECTION_SECTIONS.findIndex((item) => item.key === currentSection)
    : -1;
  const derivedData = useMemo(
    () =>
      session
        ? buildInspectionSessionDerivedData(masterData, session, sessions)
        : {
            currentAccidentEntries: [],
            currentAgentEntries: [],
            cumulativeAccidentEntries: [],
            cumulativeAgentEntries: [],
            doc7ReferenceMaterials: [],
            measurementTemplates: [],
            progress: null,
            siteSessions: [],
          },
    [masterData, session, sessions],
  );
  const site = session ? getSiteById(getSessionSiteKey(session)) : null;
  const backHref = site ? `/sites/${encodeURIComponent(site.id)}` : '/';

  useEffect(() => () => void saveNow(), [saveNow]);

  useEffect(() => {
    void ensureMasterDataLoaded();
  }, [ensureMasterDataLoaded]);

  useEffect(() => {
    if (!isAuthenticated || !isReady || session) {
      setIsLoadingSession(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSession(true);

    void ensureSessionLoaded(sessionId).finally(() => {
      if (!cancelled) {
        setIsLoadingSession(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ensureSessionLoaded, isAuthenticated, isReady, session, sessionId]);

  useEffect(() => {
    if (!session) return;

    const nextFollowUps = buildDerivedFollowUpItems(session, sessions);
    if (!areFollowUpItemsEqual(session.document4FollowUps, nextFollowUps)) {
      updateSession(session.id, (current) => ({
        ...current,
        document4FollowUps: nextFollowUps,
      }));
    }
  }, [session, sessions, updateSession]);

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
      let value = '';

      if (canUploadAssets) {
        try {
          const uploaded = await uploadSafetyAssetFile(file);
          value = uploaded.url;
        } catch (error) {
          if (
            error instanceof SafetyApiError &&
            error.status === 403 &&
            file.type.startsWith('image/')
          ) {
            value = await readFileAsDataUrl(file);
          } else {
            throw error;
          }
        }
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
    if (nextIndex < 0 || nextIndex >= INSPECTION_SECTIONS.length) return;

    updateSession(sessionId, (current) => ({
      ...current,
      currentSection: INSPECTION_SECTIONS[nextIndex].key,
    }));
  };

  const selectSection = (key: InspectionSectionKey) => {
    updateSession(sessionId, (current) => ({ ...current, currentSection: key }));
  };

  const buildHwpxDocument = async () => {
    if (!session) return null;

    await saveNow();
    const generation = await generateInspectionHwpxBlob(session, derivedData.siteSessions);

    if (generation.warnings.length > 0 || generation.deferred.length > 0) {
      console.warn('HWPX generation warnings', {
        deferred: generation.deferred,
        sessionId: session.id,
        warnings: generation.warnings,
      });
    }

    return generation;
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
      const generation = await buildHwpxDocument();
      if (!generation) return;

      const pdf = await convertHwpxBlobToPdf(generation.blob, generation.filename);
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
    backHref,
    changeMetaField,
    currentSection,
    currentSectionIndex,
    currentUserName: currentUser?.name,
    derivedData,
    documentError,
    generateHwpxDocument,
    generatePdfDocument,
    isAdminView,
    isAuthenticated,
    isGeneratingDocument: isGeneratingHwpx || isGeneratingPdf,
    isGeneratingHwpx,
    isGeneratingPdf,
    isLoadingSession,
    isReady,
    isSaving,
    login,
    logout,
    moveSection,
    sectionSession: session,
    selectSection,
    site,
    syncError,
    uploadError,
    withFileData,
  };
}
