'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  INSPECTION_SECTIONS,
  LEGAL_REFERENCE_LIBRARY,
  areFollowUpItemsEqual,
  buildDerivedFollowUpItems,
  getSessionSiteKey,
  touchDocumentMeta,
} from '@/constants/inspectionSession';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { saveBlobAsFile } from '@/lib/api';
import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import type {
  InspectionDocumentSource,
  InspectionSectionKey,
  InspectionSession,
} from '@/types/inspectionSession';
import { applyInspectionSessionMetaFieldChange } from '@/features/inspection-session/lib/applyInspectionSessionMetaFieldChange';
import { buildInspectionSessionDerivedData } from '@/features/inspection-session/lib/buildInspectionSessionDerivedData';
import { getMetaTouchSection, readFileAsDataUrl } from '@/components/session/workspace/utils';

export function useInspectionSessionScreen(sessionId: string) {
  const {
    authError,
    currentUser,
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
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
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
            correctionResultOptions: [],
            currentAccidentEntries: [],
            currentAgentEntries: [],
            cumulativeAccidentEntries: [],
            cumulativeAgentEntries: [],
            legalReferenceLibrary: LEGAL_REFERENCE_LIBRARY,
            measurementTemplates: [],
            progress: null,
            siteSessions: [],
          },
    [masterData, session, sessions],
  );
  const site = session ? getSiteById(getSessionSiteKey(session)) : null;
  const backHref = site
    ? `/sites/${encodeURIComponent(site.id)}`
    : isAdminView
      ? getAdminSectionHref('sites')
      : '/';

  useEffect(() => () => void saveNow(), [saveNow]);

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

  const applyDocumentUpdate = (
    key: InspectionSectionKey,
    source: InspectionDocumentSource,
    updater: (current: InspectionSession) => InspectionSession,
    options?: { touch?: boolean },
  ) => {
    updateSession(sessionId, (current) => {
      const next = updater(current);
      return options?.touch === false ? next : touchDocumentMeta(next, key, source);
    });
  };

  const withFileData = async (
    file: File,
    onLoaded?: (dataUrl: string, selectedFile: File) => void,
  ) => {
    try {
      setUploadError(null);
      const dataUrl = await readFileAsDataUrl(file);
      onLoaded?.(dataUrl, file);
      return dataUrl;
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

  const generateDocument = async () => {
    if (!session) return;

    try {
      setDocumentError(null);
      setIsGeneratingDocument(true);
      await saveNow();
      const { blob, filename, warnings, deferred } = await generateInspectionHwpxBlob(
        session,
        derivedData.siteSessions,
      );

      if (warnings.length > 0 || deferred.length > 0) {
        console.warn('HWPX generation warnings', {
          deferred,
          sessionId: session.id,
          warnings,
        });
      }

      saveBlobAsFile(blob, filename);
    } catch (error) {
      setDocumentError(
        error instanceof Error ? error.message : '문서 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingDocument(false);
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
    generateDocument,
    isAdminView,
    isAuthenticated,
    isGeneratingDocument,
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

