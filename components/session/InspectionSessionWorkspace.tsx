'use client';



import LoginPanel from '@/components/auth/LoginPanel';
import { getControllerSectionHref, isAdminUserRole } from '@/components/controller/shared';

import { renderSectionBody, renderSectionToolbar } from '@/components/session/workspace/renderSectionBody';

import { MissingStatePanel, LoadingStatePanel } from '@/components/session/workspace/WorkspaceStatePanels';

import WorkspaceShell from '@/components/session/workspace/WorkspaceShell';

import {

  CAUSATIVE_AGENT_LABELS,

} from '@/components/session/workspace/constants';

import {

  buildCountEntries,

  getMetaTouchSection,

  hasFindingContent,

  readFileAsDataUrl,

} from '@/components/session/workspace/utils';

import {

  saveBlobAsFile,

} from '@/lib/api';

import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';

import {

  INSPECTION_SECTIONS,

  LEGAL_REFERENCE_LIBRARY,

  areFollowUpItemsEqual,

  buildDerivedFollowUpItems,

  getSessionProgress,

  getSessionSiteKey,

  touchDocumentMeta,

} from '@/constants/inspectionSession';

import { useInspectionSessions } from '@/hooks/useInspectionSessions';

import type {

  InspectionDocumentSource,

  InspectionSectionKey,

  InspectionSession,

} from '@/types/inspectionSession';

import { useEffect, useMemo, useState } from 'react';



interface InspectionSessionWorkspaceProps {

  sessionId: string;

}



export default function InspectionSessionWorkspace({

  sessionId,

}: InspectionSessionWorkspaceProps) {

  const {

    getSessionById,

    getSiteById,

    isReady,

    isAuthenticated,

    authError,

    login,

    currentUser,

    saveNow,

    sessions,

    updateSession,

    masterData,

    syncError,

    isSaving,

  } = useInspectionSessions();

  const session = getSessionById(sessionId);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const [documentError, setDocumentError] = useState<string | null>(null);

  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  const legalReferenceLibrary =

    masterData.legalReferences.length > 0 ? masterData.legalReferences : LEGAL_REFERENCE_LIBRARY;

  const correctionResultOptions = masterData.correctionResultOptions;



  useEffect(() => () => void saveNow(), [saveNow]);



  useEffect(() => {

    if (!session) return;

    const nextFollowUps = buildDerivedFollowUpItems(session, sessions);

    if (!areFollowUpItemsEqual(session.document4FollowUps, nextFollowUps)) {

      updateSession(session.id, (current) => ({ ...current, document4FollowUps: nextFollowUps }));

    }

  }, [session, sessions, updateSession]);



  const site = session ? getSiteById(getSessionSiteKey(session)) : null;

  const progress = session ? getSessionProgress(session) : null;

  const currentSection = session?.currentSection ?? 'doc1';

  const currentSectionMeta = session?.documentsMeta[currentSection] ?? null;

  const currentSectionIndex = session ? INSPECTION_SECTIONS.findIndex((item) => item.key === currentSection) : -1;



  const siteSessions = useMemo(() => {

    if (!session) return [];

    const siteKey = getSessionSiteKey(session);

    return sessions.filter((item) => getSessionSiteKey(item) === siteKey).sort((left, right) => left.reportNumber - right.reportNumber);

  }, [session, sessions]);



  const currentFindings = useMemo(() => (session ? session.document7Findings.filter((item) => hasFindingContent(item)) : []), [session]);

  const cumulativeFindings = useMemo(() => session ? siteSessions.filter((item) => item.reportNumber <= session.reportNumber).flatMap((item) => item.document7Findings.filter((finding) => hasFindingContent(finding))) : [], [session, siteSessions]);

  const currentAccidentEntries = useMemo(() => buildCountEntries(currentFindings, (item) => item.accidentType), [currentFindings]);

  const cumulativeAccidentEntries = useMemo(() => buildCountEntries(cumulativeFindings, (item) => item.accidentType), [cumulativeFindings]);

  const currentAgentEntries = useMemo(() => buildCountEntries(currentFindings, (item) => item.causativeAgentKey ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey : ''), [currentFindings]);

  const cumulativeAgentEntries = useMemo(() => buildCountEntries(cumulativeFindings, (item) => item.causativeAgentKey ? CAUSATIVE_AGENT_LABELS[item.causativeAgentKey] ?? item.causativeAgentKey : ''), [cumulativeFindings]);

  const applyDocumentUpdate = (key: InspectionSectionKey, source: InspectionDocumentSource, updater: (current: InspectionSession) => InspectionSession, options?: { touch?: boolean }) => {

    updateSession(sessionId, (current) => {

      const next = updater(current);

      return options?.touch === false ? next : touchDocumentMeta(next, key, source);

    });

  };



  const withFileData = async (file: File, onLoaded?: (dataUrl: string, selectedFile: File) => void) => {

    try {

      setUploadError(null);

      const dataUrl = await readFileAsDataUrl(file);

      onLoaded?.(dataUrl, file);

      return dataUrl;

    } catch (error) {

      setUploadError(error instanceof Error ? error.message : '파일을 불러오는 중 오류가 발생했습니다.');

      return null;

    }

  };



  const handleMetaChange = (field: keyof InspectionSession['meta'], value: string) => {

    const metaTouchSection = getMetaTouchSection(currentSection);

    applyDocumentUpdate(metaTouchSection, 'manual', (current) => {

      const previousReportDate = current.meta.reportDate;

      const previousDrafter = current.meta.drafter;

      return {

        ...current,

        meta: { ...current.meta, [field]: value },

        document2Overview: {

          ...current.document2Overview,

          guidanceDate: field === 'reportDate' && (!current.document2Overview.guidanceDate || current.document2Overview.guidanceDate === previousReportDate) ? value : current.document2Overview.guidanceDate,

          assignee: field === 'drafter' && (!current.document2Overview.assignee || current.document2Overview.assignee === previousDrafter) ? value : current.document2Overview.assignee,

        },

        document4FollowUps: field === 'reportDate' ? current.document4FollowUps.map((item) => ({ ...item, confirmationDate: !item.confirmationDate || item.confirmationDate === previousReportDate ? value : item.confirmationDate })) : current.document4FollowUps,

        document7Findings: field === 'drafter' ? current.document7Findings.map((item) => ({ ...item, inspector: !item.inspector || item.inspector === previousDrafter ? value : item.inspector })) : current.document7Findings,

      };

    });

  };



  const moveSection = (direction: -1 | 1) => {

    const nextIndex = currentSectionIndex + direction;

    if (nextIndex >= 0 && nextIndex < INSPECTION_SECTIONS.length) {

      updateSession(sessionId, (current) => ({ ...current, currentSection: INSPECTION_SECTIONS[nextIndex].key }));

    }

  };



  const handleGenerateDocument = async () => {

    if (!session) return;

    try {

      setDocumentError(null);

      setIsGeneratingDocument(true);

      await saveNow();

      const { blob, filename, warnings, deferred } = await generateInspectionHwpxBlob(session, siteSessions);

      if (warnings.length > 0 || deferred.length > 0) {

        console.warn('HWPX generation warnings', {

          sessionId: session.id,

          warnings,

          deferred,

        });

      }

      saveBlobAsFile(blob, filename);

    } catch (error) {

      setDocumentError(

        error instanceof Error

          ? error.message

          : '문서 생성 중 오류가 발생했습니다.'

      );

    } finally {

      setIsGeneratingDocument(false);

    }

  };



  if (!isReady) return <LoadingStatePanel />;

  if (!isAuthenticated) return <LoginPanel error={authError} onSubmit={login} title="보고서 작성 로그인" description="작성 중인 보고서를 서버 자동저장 기준으로 복구하려면 로그인해 주세요." />;

  if (!session || !progress || !currentSectionMeta) return <MissingStatePanel />;

  const fallbackBackHref =
    currentUser && isAdminUserRole(currentUser.role)
      ? getControllerSectionHref('sites')
      : '/';



  return (

    <WorkspaceShell

      backHref={site ? `/sites/${encodeURIComponent(site.id)}` : fallbackBackHref}

      currentSection={currentSection}

      currentSectionIndex={currentSectionIndex}

      currentSectionMeta={currentSectionMeta}

      documentError={documentError}

      isGeneratingDocument={isGeneratingDocument}

      isSaving={isSaving}

      moveSection={moveSection}

      onMetaChange={handleMetaChange}

      onGenerateDocument={() => void handleGenerateDocument()}

      onSave={() => void saveNow()}

      onSectionSelect={(key) => updateSession(sessionId, (current) => ({ ...current, currentSection: key }))}

      progress={progress}

      renderSection={renderSectionBody({

        applyDocumentUpdate,

        correctionResultOptions,

        currentAccidentEntries,

        currentAgentEntries,

        currentSection,

        cumulativeAccidentEntries,

        cumulativeAgentEntries,

        legalReferenceLibrary,

        session,

        withFileData,

      })}

      sectionToolbar={renderSectionToolbar({

        applyDocumentUpdate,

        correctionResultOptions,

        currentAccidentEntries,

        currentAgentEntries,

        currentSection,

        cumulativeAccidentEntries,

        cumulativeAgentEntries,

        legalReferenceLibrary,

        session,

        withFileData,

      })}

      session={session}

      site={site}

      syncError={syncError}

      uploadError={uploadError}

    />

  );

}

