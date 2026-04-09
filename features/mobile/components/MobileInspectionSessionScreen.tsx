'use client';

import { useState } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import AppModal from '@/components/ui/AppModal';
import SignaturePad from '@/components/ui/SignaturePad';
import {
  FOLLOW_UP_RESULT_OPTIONS,
  getSessionGuidanceDate,
  getSessionTitle,
} from '@/constants/inspectionSession';
import { FIXED_SCENE_COUNT } from '@/constants/inspectionSession/catalog';
import {
  ACCIDENT_OCCURRENCE_OPTIONS,
  CHECKLIST_RATING_OPTIONS,
  FUTURE_PROCESS_LIBRARY,
  NOTIFICATION_METHOD_OPTIONS,
  PREVIOUS_IMPLEMENTATION_OPTIONS,
  RISK_TRI_LEVEL_OPTIONS,
} from '@/components/session/workspace/constants';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import { CAUSATIVE_AGENT_SECTIONS } from '@/constants/siteOverview';
import {
  assetUrlToFile,
  buildHazardFindingAutoFill,
} from '@/components/session/workspace/doc7Ai';
import {
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createMeasurementCheckItem,
} from '@/constants/inspectionSession/itemFactory';
import {
  getExtraSceneTitle,
  getFixedSceneTitle,
  isExtraScenePlaceholderTitle,
} from '@/constants/inspectionSession/scenePhotos';
import {
  buildDoc2ProcessNotesDraft,
  buildDoc2RiskFallback,
} from '@/features/inspection-session/workspace/sections/doc2/doc2ProcessNotes';
import { matchMeasurementTemplateByPhoto } from '@/features/inspection-session/workspace/sections/doc10/doc10Ai';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import { applyDoc7ReferenceMaterialMatch } from '@/lib/doc7ReferenceMaterials';
import {
  buildDoc5StructuredSummaryPayload,
  buildLocalDoc5SummaryDraft,
} from '@/lib/openai/doc5SummaryLocalDraft';
import {
  buildLocalDoc11EducationContent,
  generateStructuredDoc11EducationContent,
} from '@/lib/openai/generateDoc11EducationContent';
import { ChartCard } from '@/components/session/workspace/widgets';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import styles from './MobileShell.module.css';
import tabStyles from './MobileStepTabs.module.css';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

const STEPS = [
  { id: 'step2', label: '媛쒖슂' },
  { id: 'step3', label: '?꾩옣 ?꾧꼍' },
  { id: 'step4', label: '?댁쟾 湲곗닠吏?? },
  { id: 'step5', label: '珥앺룊' },
  { id: 'step6', label: '?щ쭩 湲곗씤臾? },
  { id: 'step7', label: '?꾪뿕?붿씤 吏?? },
  { id: 'step8', label: '?ν썑 吏꾪뻾怨듭젙' },
  { id: 'step9', label: '?꾪뿕?깊룊媛 / TBM' },
  { id: 'step10', label: '怨꾩륫?먭?' },
  { id: 'step11', label: '?덉쟾援먯쑁' },
  { id: 'step12', label: '?쒕룞 吏?? },
];

interface Doc2ProcessNotesResponse {
  riskLines?: string[];
  error?: string;
}

const MAX_DOC8_RECOMMENDATIONS = 6;

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '誘멸린濡?;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function parsePositiveRound(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 蹂닿퀬??${reportNumber}` : `蹂닿퀬??${reportNumber}`;
}

async function generateDoc2RiskLines(input: {
  processWorkContent: string;
  processWorkerCount: string;
  processEquipment: string;
  processTools: string;
  processHazardousMaterials: string;
}) {
  const response = await fetch('/api/ai/doc2-process-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Doc2ProcessNotesResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'AI ?꾪뿕?붿씤 ?앹꽦???ㅽ뙣?덉뒿?덈떎.');
  }

  return Array.isArray(payload.riskLines) ? payload.riskLines.filter(Boolean).slice(0, 2) : [];
}

async function inferSceneTitle(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc3-scene-title', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('?꾩옣 ?꾧꼍 怨듭젙紐?AI ?앹꽦???ㅽ뙣?덉뒿?덈떎.');
  }

  const payload = (await response.json().catch(() => ({}))) as { title?: string };
  return payload.title?.trim() || '';
}

async function generateStructuredDoc5Summary(
  payload: ReturnType<typeof buildDoc5StructuredSummaryPayload>,
) {
  const response = await fetch('/api/ai/doc5-structured-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: string;
  };

  if (!response.ok || !result.text?.trim()) {
    throw new Error(result.error?.trim() || '珥앺룊 AI ?앹꽦???ㅽ뙣?덉뒿?덈떎.');
  }

  return result.text.trim();
}

function normalizeDoc8ProcessName(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function findDoc8ProcessMatch(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    FUTURE_PROCESS_LIBRARY.find(
      (libraryItem) => normalizeDoc8ProcessName(libraryItem.processName) === normalizedValue,
    ) ?? null
  );
}

function getDoc8ProcessRecommendations(value: string) {
  const normalizedValue = normalizeDoc8ProcessName(value);
  const matchingItems = normalizedValue
    ? FUTURE_PROCESS_LIBRARY.filter((libraryItem) =>
        normalizeDoc8ProcessName(libraryItem.processName).includes(normalizedValue),
      )
    : FUTURE_PROCESS_LIBRARY;

  return matchingItems.slice(0, MAX_DOC8_RECOMMENDATIONS);
}

function StandaloneState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>紐⑤컮??蹂닿퀬??/span>
              <h1 className={styles.sectionTitle}>{title}</h1>
            </div>
            {description ? <p className={styles.inlineNotice}>{description}</p> : null}
            {action}
          </section>
        </div>
      </div>
    </main>
  );
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const [isDoc2ProcessModalOpen, setIsDoc2ProcessModalOpen] = useState(false);
  const [isGeneratingDoc2ProcessNotes, setIsGeneratingDoc2ProcessNotes] = useState(false);
  const [doc2ProcessRiskLines, setDoc2ProcessRiskLines] = useState<string[] | null>(null);
  const [doc2ProcessError, setDoc2ProcessError] = useState<string | null>(null);
  const [doc2ProcessNotice, setDoc2ProcessNotice] = useState<string | null>(null);
  const [doc3AnalyzingSceneIds, setDoc3AnalyzingSceneIds] = useState<string[]>([]);
  const [doc5DraftLoading, setDoc5DraftLoading] = useState(false);
  const [doc5DraftError, setDoc5DraftError] = useState<string | null>(null);
  const [doc5DraftNotice, setDoc5DraftNotice] = useState<string | null>(null);
  const [doc7AiLoadingId, setDoc7AiLoadingId] = useState<string | null>(null);
  const [doc7AiErrors, setDoc7AiErrors] = useState<Record<string, string>>({});
  const [activeDoc8PlanId, setActiveDoc8PlanId] = useState<string | null>(null);
  const [doc10MatchingMeasurementId, setDoc10MatchingMeasurementId] = useState<string | null>(null);
  const [doc10MatchErrors, setDoc10MatchErrors] = useState<Record<string, string>>({});
  const [doc11GeneratingId, setDoc11GeneratingId] = useState<string | null>(null);
  const [doc11ContentNotice, setDoc11ContentNotice] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [doc11ContentError, setDoc11ContentError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  if (!screen.isReady) {
    return <StandaloneState title="蹂닿퀬?쒕? 以鍮꾪븯??以묒엯?덈떎." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="紐⑤컮??蹂닿퀬??濡쒓렇??
        description="?듭떖 ?뱀뀡 以묒떖?쇰줈 湲곗닠吏??蹂닿퀬?쒕? ?댁뼱???묒꽦?⑸땲??"
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <StandaloneState title="蹂닿퀬?쒕? 遺덈윭?ㅻ뒗 以묒엯?덈떎." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <StandaloneState
        title="蹂닿퀬?쒕? 李얠쓣 ???놁뒿?덈떎."
        description="蹂닿퀬?쒓? ?꾩쭅 ?숆린?붾릺吏 ?딆븯嫄곕굹 ?묎렐 媛?ν븳 踰붿쐞瑜?踰쀬뼱?ъ뒿?덈떎."
        action={
          <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
            ?꾩옣 紐⑸줉?쇰줈 ?뚯븘媛湲?
          </Link>
        }
      />
    );
  }

  const hasLoadedSessionPayload = Boolean(screen.sectionSession);
  const session = screen.sectionSession;
  const fallbackDoc2RiskLines = session ? buildDoc2RiskFallback(session.document2Overview) : [];
  const previewDoc2RiskLines = doc2ProcessRiskLines ?? fallbackDoc2RiskLines;
  const doc2ProcessNoteDraft = session
    ? buildDoc2ProcessNotesDraft(session.document2Overview, previewDoc2RiskLines)
    : '';
  const errors = [screen.uploadError, screen.syncError, screen.documentError].filter(
    (message): message is string => Boolean(message),
  );
  const measurementTemplateOptions = [...screen.derivedData.measurementTemplates].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  const mobileReportsHref = buildMobileSiteReportsHref(displaySession.siteKey);
  const saveStatusLabel = screen.isSaving
    ? '?먮룞 ???以?
    : hasLoadedSessionPayload
      ? '??λ맖'
      : '蹂몃Ц ?숆린??以?;

  const resetDoc2ProcessState = () => {
    setDoc2ProcessRiskLines(null);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);
  };

  const handleDoc2ProcessFieldChange = (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => {
    resetDoc2ProcessState();
    screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        [key]: value,
      },
    }));
  };

  const handleGenerateDoc2ProcessNotes = async () => {
    if (!session) {
      return;
    }

    setIsGeneratingDoc2ProcessNotes(true);
    setDoc2ProcessError(null);
    setDoc2ProcessNotice(null);

    try {
      const generatedRiskLines = await generateDoc2RiskLines({
        processWorkContent: session.document2Overview.processWorkContent,
        processWorkerCount: session.document2Overview.processWorkerCount,
        processEquipment: session.document2Overview.processEquipment,
        processTools: session.document2Overview.processTools,
        processHazardousMaterials: session.document2Overview.processHazardousMaterials,
      });

      if (generatedRiskLines.length === 0) {
        throw new Error('AI ?꾪뿕?붿씤 ?앹꽦 寃곌낵媛 鍮꾩뼱 ?덉뒿?덈떎.');
      }

      setDoc2ProcessRiskLines(generatedRiskLines);
      setDoc2ProcessNotice('AI媛 二쇱슂 ?꾪뿕 ?붿씤 2以꾩쓣 ?앹꽦?덉뒿?덈떎.');
    } catch (error) {
      setDoc2ProcessRiskLines(null);
      setDoc2ProcessError(
        error instanceof Error ? error.message : 'AI ?꾪뿕?붿씤 ?앹꽦???ㅽ뙣?덉뒿?덈떎.',
      );
      setDoc2ProcessNotice('AI ?앹꽦???ㅽ뙣??洹쒖튃 湲곕컲 ?꾪뿕 ?붿씤?쇰줈 誘몃━蹂닿린瑜??좎??⑸땲??');
    } finally {
      setIsGeneratingDoc2ProcessNotes(false);
    }
  };

  const applyDoc2ProcessNotesDraft = () => {
    screen.applyDocumentUpdate('doc2', 'derived', (current) => ({
      ...current,
      document2Overview: {
        ...current.document2Overview,
        processAndNotes: buildDoc2ProcessNotesDraft(
          current.document2Overview,
          doc2ProcessRiskLines ?? buildDoc2RiskFallback(current.document2Overview),
        ),
      },
    }));
    setIsDoc2ProcessModalOpen(false);
  };

  const toggleDoc3Analyzing = (sceneId: string, active: boolean) => {
    setDoc3AnalyzingSceneIds((current) =>
      active ? Array.from(new Set([...current, sceneId])) : current.filter((item) => item !== sceneId),
    );
  };

  const handleDoc3SceneUpload = async (sceneId: string, index: number, file: File) => {
    const dataUrl = await screen.withFileData(file);
    if (!dataUrl) {
      return;
    }

    const fallbackTitle =
      index >= FIXED_SCENE_COUNT ? getExtraSceneTitle(index) : getFixedSceneTitle(index);
    const currentScene = session?.document3Scenes.find((scene) => scene.id === sceneId);
    const shouldRunAi =
      index >= FIXED_SCENE_COUNT &&
      isExtraScenePlaceholderTitle(currentScene?.title, getExtraSceneTitle(index));

    screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
      ...current,
      document3Scenes: current.document3Scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              photoUrl: dataUrl,
              ...(index >= FIXED_SCENE_COUNT && !(scene.title || '').trim()
                ? { title: fallbackTitle }
                : {}),
            }
          : scene,
      ),
    }));

    if (!shouldRunAi) {
      return;
    }

    toggleDoc3Analyzing(sceneId, true);
    try {
      const title = await inferSceneTitle(file);
      screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
        ...current,
        document3Scenes: current.document3Scenes.map((scene) =>
          scene.id === sceneId ? { ...scene, title: title || fallbackTitle } : scene,
        ),
      }));
    } finally {
      toggleDoc3Analyzing(sceneId, false);
    }
  };

  const handleGenerateDoc5Draft = async () => {
    if (!session) {
      return;
    }

    setDoc5DraftError(null);
    setDoc5DraftNotice(
      !screen.isRelationReady
        ? '?꾩쟻 ?듦퀎媛 ?꾩쭅 以鍮꾨릺吏 ?딆븘 ?꾩옱 蹂닿퀬??湲곗??쇰줈 癒쇱? 珥앺룊???앹꽦?⑸땲??'
        : null,
    );

    setDoc5DraftLoading(true);
    try {
      const text = await generateStructuredDoc5Summary(
        buildDoc5StructuredSummaryPayload(
          session,
          screen.derivedData.currentAccidentEntries,
          screen.derivedData.currentAgentEntries,
          screen.derivedData.cumulativeAccidentEntries,
          screen.derivedData.cumulativeAgentEntries,
        ),
      );

      screen.applyDocumentUpdate('doc5', 'derived', (current) => ({
        ...current,
        document5Summary: {
          ...current.document5Summary,
          summaryText: text,
        },
      }));
    } catch (error) {
      setDoc5DraftError(error instanceof Error ? error.message : '珥앺룊 AI ?앹꽦???ㅽ뙣?덉뒿?덈떎.');
      setDoc5DraftNotice('AI ?앹꽦???ㅽ뙣??濡쒖뺄 珥덉븞?쇰줈 ?泥댄뻽?듬땲??');

      screen.applyDocumentUpdate('doc5', 'derived', (current) => ({
        ...current,
        document5Summary: {
          ...current.document5Summary,
          summaryText: buildLocalDoc5SummaryDraft(
            current,
            screen.derivedData.currentAccidentEntries,
            screen.derivedData.currentAgentEntries,
            screen.derivedData.cumulativeAccidentEntries,
            screen.derivedData.cumulativeAgentEntries,
          ),
        },
      }));
    } finally {
      setDoc5DraftLoading(false);
    }
  };

  const handleDoc7AiRefill = async (findingId: string, photoUrl: string) => {
    if (!photoUrl.trim()) {
      return;
    }

    setDoc7AiLoadingId(findingId);
    setDoc7AiErrors((current) => ({ ...current, [findingId]: '' }));

    try {
      const file = await assetUrlToFile(photoUrl, `finding-${findingId}.jpg`);
      const patch = await buildHazardFindingAutoFill(file);

      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
        ...current,
        document7Findings: current.document7Findings.map((finding) =>
          finding.id === findingId
            ? applyDoc7ReferenceMaterialMatch(
                {
                  ...finding,
                  ...patch,
                },
                screen.derivedData.doc7ReferenceMaterials,
              )
            : finding,
        ),
      }));
    } catch (error) {
      setDoc7AiErrors((current) => ({
        ...current,
        [findingId]:
          error instanceof Error
            ? error.message
            : 'AI 珥덉븞??留뚮뱶??以?臾몄젣媛 諛쒖깮?덉뒿?덈떎.',
      }));
    } finally {
      setDoc7AiLoadingId((current) => (current === findingId ? null : current));
    }
  };

  const patchDoc11RecordContent = (recordId: string, content: string) => {
    screen.applyDocumentUpdate('doc11', 'derived', (current) => ({
      ...current,
      document11EducationRecords: current.document11EducationRecords.map((record) =>
        record.id === recordId ? { ...record, content } : record,
      ),
    }));
  };

  const handleGenerateDoc11Content = async (recordId: string) => {
    const record = session?.document11EducationRecords.find((item) => item.id === recordId);
    if (!record) {
      return;
    }

    setDoc11ContentError(null);
    setDoc11ContentNotice(null);
    setDoc11GeneratingId(recordId);

    const input = {
      topic: record.topic,
      attendeeCount: record.attendeeCount,
      materialName: record.materialName,
      photoUrl: record.photoUrl,
    };

    try {
      const text = await generateStructuredDoc11EducationContent(input);
      patchDoc11RecordContent(recordId, text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDoc11ContentError({ id: recordId, message });
      patchDoc11RecordContent(recordId, buildLocalDoc11EducationContent(input));
      setDoc11ContentNotice({
        id: recordId,
        message: 'AI ?앹꽦???ㅽ뙣??洹쒖튃 湲곕컲 珥덉븞?쇰줈 ?泥댄뻽?듬땲??',
      });
    } finally {
      setDoc11GeneratingId(null);
    }
  };

  const updateDoc8ProcessPlan = (planId: string, nextProcessName: string) => {
    const matched = findDoc8ProcessMatch(nextProcessName);

    screen.applyDocumentUpdate('doc8', matched ? 'api' : 'manual', (current) => ({
      ...current,
      document8Plans: current.document8Plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              processName: nextProcessName,
              hazard: matched?.hazard ?? plan.hazard,
              countermeasure: matched?.countermeasure ?? plan.countermeasure,
              source: matched ? 'api' : 'manual',
            }
          : plan,
      ),
    }));
  };

  const handleDoc8ProcessBlur = (planId: string, event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveDoc8PlanId((current) => (current === planId ? null : current));
    }
  };

  const handleDoc10PhotoSelect = async (measurementId: string, file: File) => {
    setDoc10MatchErrors((current) => ({ ...current, [measurementId]: '' }));

    const dataUrl = await screen.withFileData(file);
    if (!dataUrl) {
      return;
    }

    screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
      ...current,
      document10Measurements: current.document10Measurements.map((measurement) =>
        measurement.id === measurementId ? { ...measurement, photoUrl: dataUrl } : measurement,
      ),
    }));

    if (measurementTemplateOptions.length === 0) {
      return;
    }

    setDoc10MatchingMeasurementId(measurementId);
    try {
      const matchedTemplate = await matchMeasurementTemplateByPhoto(file, measurementTemplateOptions);
      if (!matchedTemplate) {
        return;
      }

      screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
        ...current,
        document10Measurements: current.document10Measurements.map((measurement) =>
          measurement.id === measurementId
            ? {
                ...measurement,
                photoUrl: dataUrl,
                instrumentType: matchedTemplate.instrumentName,
                safetyCriteria: matchedTemplate.safetyCriteria || measurement.safetyCriteria,
              }
            : measurement,
        ),
      }));
    } catch (error) {
      setDoc10MatchErrors((current) => ({
        ...current,
        [measurementId]:
          error instanceof Error ? error.message : '怨꾩륫?λ퉬 AI 留ㅼ묶???ㅽ뙣?덉뒿?덈떎.',
      }));
    } finally {
      setDoc10MatchingMeasurementId((current) => (current === measurementId ? null : current));
    }
  };

  return (
    <MobileShell
      fullHeight={true}
      backHref={mobileReportsHref}
      backLabel="蹂닿퀬??紐⑸줉"
      currentUserName={screen.currentUserName}
      tabBar={<MobileTabBar tabs={buildSiteTabs(displaySession.siteKey)} />}
      onLogout={screen.logout}
      title={getSessionTitle(displaySession)}
      webHref={`/sessions/${encodeURIComponent(sessionId)}`}
      webLabel="?뱀뿉???꾩껜 ?몄쭛"
    >
      <section className={styles.sectionCard} style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none', flexShrink: 0 }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>紐⑤컮???듭떖 ?뱀뀡 吏꾪뻾 ?꾪솴</h2>
          </div>
          <span className={styles.sectionMeta}>{saveStatusLabel}</span>
        </div>

        <div
          className={styles.statGrid}
          style={
            hasLoadedSessionPayload
              ? {
                  gridTemplateColumns:
                    'minmax(0, 1fr) minmax(0, 1fr) minmax(88px, 96px) minmax(76px, 84px)',
                  alignItems: 'stretch',
                }
              : undefined
          }
        >
          <article className={styles.statCard}>
            <span className={styles.statLabel}>吏꾪뻾瑜?/span>
            <strong className={styles.statValue}>{screen.displayProgress.percentage}%</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>吏?꾩씪</span>
            <strong className={styles.statValue}>
              {formatCompactDate(getSessionGuidanceDate(displaySession))}
            </strong>
          </article>
          {hasLoadedSessionPayload ? (
            <div style={{ display: 'grid', gap: '8px', minWidth: 0 }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ width: '100%', minHeight: '36px', padding: '0 8px' }}
                disabled={screen.isGeneratingHwpx || screen.isGeneratingPdf}
                onClick={() => void screen.generateHwpxDocument()}
              >
                {screen.isGeneratingHwpx ? '?쒓?...' : '?쒓?'}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ width: '100%', minHeight: '36px', padding: '0 8px' }}
                disabled={screen.isGeneratingHwpx || screen.isGeneratingPdf}
                onClick={() => void screen.generatePdfDocument()}
              >
                {screen.isGeneratingPdf ? 'PDF...' : 'PDF'}
              </button>
            </div>
          ) : null}
          {hasLoadedSessionPayload ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              style={{ width: '100%', height: '100%', minHeight: '80px', padding: '0 8px' }}
              disabled={screen.isSaving || screen.isGeneratingHwpx || screen.isGeneratingPdf}
              onClick={() => void screen.saveNow()}
            >
              {screen.isSaving ? '???以? : '???}
            </button>
          ) : null}
        </div>
      </section>

      {hasLoadedSessionPayload && session ? (
        <div className={tabStyles.layoutWrapper}>
          <div className={tabStyles.tabContainer}>
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`}
                onClick={() => setActiveStep(step.id)}
              >
                {step.label}
              </button>
            ))}
          </div>

          <div className={tabStyles.stepContent}>
            {/* 2?④퀎: 湲곗닠吏??媛쒖슂 */}
            {activeStep === 'step2' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>湲곗닠吏??媛쒖슂</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>吏?꾩씪</span>
                        <input
                          className="app-input"
                          type="date"
                          value={session.document2Overview.guidanceDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                guidanceDate: value,
                              },
                            }));
                          }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>怨듭젙瑜?(%)</span>
                        <input
                          className="app-input"
                          type="number"
                          value={session.document2Overview.progressRate}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                progressRate: value,
                              },
                            }));
                          }}
                          placeholder="0"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>?뚯감</span>
                        <input
                          className="app-input"
                          type="number"
                          min={1}
                          step={1}
                          value={session.document2Overview.visitCount || String(session.reportNumber || '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => {
                              const nextRound = parsePositiveRound(value);
                              if (!nextRound) {
                                return {
                                  ...current,
                                  document2Overview: {
                                    ...current.document2Overview,
                                    visitCount: value,
                                  },
                                };
                              }

                              const preferredDate =
                                current.document2Overview.guidanceDate.trim() ||
                                current.meta.reportDate.trim();
                              const currentTitle = current.meta.reportTitle.trim();
                              const autoTitleCandidates = new Set([
                                buildAutoReportTitle(preferredDate, current.reportNumber),
                                buildAutoReportTitle(current.meta.reportDate.trim(), current.reportNumber),
                                `蹂닿퀬??${current.reportNumber}`,
                              ]);

                              return {
                                ...current,
                                reportNumber: nextRound,
                                meta: {
                                  ...current.meta,
                                  reportTitle: autoTitleCandidates.has(currentTitle)
                                    ? buildAutoReportTitle(preferredDate, nextRound)
                                    : current.meta.reportTitle,
                                },
                                document2Overview: {
                                  ...current.document2Overview,
                                  visitCount: String(nextRound),
                                },
                              };
                            });
                          }}
                          placeholder="1"
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>珥앺쉶李?/span>
                        <input
                          className="app-input"
                          value={session.document2Overview.totalVisitCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                totalVisitCount: value,
                              },
                            }));
                          }}
                          placeholder="?? 12"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          ?댁쟾湲곗닠吏???댄뻾
                        </span>
                        <select
                          className="app-select"
                          value={session.document2Overview.previousImplementationStatus}
                          onChange={(e) => {
                            const value =
                              e.target.value as typeof session.document2Overview.previousImplementationStatus;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                previousImplementationStatus: value,
                              },
                            }));
                          }}
                        >
                          {PREVIOUS_IMPLEMENTATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>?대떦??/span>
                        <input
                          className="app-input"
                          value={session.document2Overview.assignee}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                assignee: value,
                              },
                            }));
                          }}
                          placeholder="?대떦???대쫫"
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>?곕씫泥?/span>
                        <input
                          className="app-input"
                          value={session.document2Overview.contact}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                contact: value,
                              },
                            }));
                          }}
                          placeholder="?곕씫泥섎? ?낅젰?섏꽭??
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>?듭? 諛⑸쾿</span>
                        <select
                          className="app-select"
                          value={session.document2Overview.notificationMethod}
                          onChange={(e) => {
                            const value = e.target.value as
                              | 'direct'
                              | 'registered_mail'
                              | 'email'
                              | 'mobile'
                              | 'other'
                              | '';
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                notificationMethod: value,
                              },
                            }));
                          }}
                        >
                          <option value="">?좏깮</option>
                          {NOTIFICATION_METHOD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {session.document2Overview.notificationMethod === 'other' ? (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          湲고? ?듬낫諛⑸쾿
                        </span>
                        <input
                          className="app-input"
                          value={session.document2Overview.otherNotificationMethod}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                otherNotificationMethod: value,
                              },
                            }));
                          }}
                          placeholder="湲고? ?듬낫諛⑸쾿 ?낅젰"
                        />
                      </label>
                    ) : null}
                    {session.document2Overview.notificationMethod === 'direct' ? (
                      <div
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            吏곸젒?꾨떖 ?섎졊???깊븿
                          </span>
                          <input
                            className="app-input"
                            value={session.document2Overview.notificationRecipientName}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                ...current,
                                document2Overview: {
                                  ...current.document2Overview,
                                  notificationRecipientName: value,
                                },
                              }));
                            }}
                            placeholder="?섎졊???깊븿 ?낅젰"
                          />
                        </label>
                        <SignaturePad
                          label="?섎졊???쒕챸"
                          value={session.document2Overview.notificationRecipientSignature}
                          onChange={(value) => {
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                notificationRecipientSignature: value,
                              },
                            }));
                          }}
                        />
                      </div>
                    ) : null}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        ?ы빐 諛?怨듭젙 ?뱀씠?ы빆
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          理쒓렐 ?ш퀬 諛쒖깮 ?щ?
                        </span>
                        <select
                          className="app-select"
                          value={session.document2Overview.accidentOccurred || 'no'}
                          onChange={(e) => {
                            const value = e.target.value as 'yes' | 'no';
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                accidentOccurred: value,
                              },
                            }));
                          }}
                        >
                          {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {session.document2Overview.accidentOccurred === 'yes' ? (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                理쒓렐 ?ш퀬??
                              </span>
                              <input
                                className="app-input"
                                type="date"
                                value={session.document2Overview.recentAccidentDate}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                    ...current,
                                    document2Overview: {
                                      ...current.document2Overview,
                                      recentAccidentDate: value,
                                    },
                                  }));
                                }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                ?ш퀬 ?좏삎
                              </span>
                              <input
                                className="app-input"
                                value={session.document2Overview.accidentType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                    ...current,
                                    document2Overview: {
                                      ...current.document2Overview,
                                      accidentType: value,
                                    },
                                  }));
                                }}
                                placeholder="?? ?⑥뼱吏?
                              />
                            </label>
                          </div>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                              ?ш퀬 媛쒖슂
                            </span>
                            <textarea
                              className="app-input"
                              value={session.document2Overview.accidentSummary}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                                  ...current,
                                  document2Overview: {
                                    ...current.document2Overview,
                                    accidentSummary: value,
                                  },
                                }));
                              }}
                              placeholder="?ш퀬 ?댁슜???낅젰?섏꽭??
                              style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
                            />
                          </label>
                        </>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                          吏꾪뻾怨듭젙 諛??뱀씠?ы빆
                        </div>
                        <button
                          type="button"
                          className={workspaceStyles.doc5SummaryDraftBtn}
                          style={{ flexShrink: 0 }}
                          onClick={() => setIsDoc2ProcessModalOpen(true)}
                        >
                          ?먮룞?앹꽦
                        </button>
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                          蹂몃Ц
                        </span>
                        <textarea
                          className="app-input"
                          value={session.document2Overview.processAndNotes}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                              ...current,
                              document2Overview: {
                                ...current.document2Overview,
                                processAndNotes: value,
                              },
                            }));
                          }}
                          placeholder="怨듭젙 ?뱀씠?ы빆???낅젰?섏꽭??
                          style={{ width: '100%', minHeight: '96px', resize: 'vertical' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3?④퀎: ?꾩옣 ?꾧꼍 */}
            {activeStep === 'step3' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?꾩옣 ?꾧꼍 諛?吏꾪뻾怨듭젙</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {session.document3Scenes.map((scene, index) => (
                      <article
                        key={scene.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                              {index < FIXED_SCENE_COUNT
                                ? getFixedSceneTitle(index)
                                : `怨듭젙 ?ъ쭊 ${index - FIXED_SCENE_COUNT + 1}`}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {index < FIXED_SCENE_COUNT ? '?꾩옣 ?꾧꼍 珥ъ쁺' : '二쇱슂 吏꾪뻾怨듭젙 珥ъ쁺'}
                            </div>
                          </div>
                          {scene.photoUrl ? (
                            <button
                              type="button"
                              style={{ color: '#ef4444', fontSize: '12px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                              onClick={() => {
                                screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                                  ...current,
                                  document3Scenes: current.document3Scenes.map((s) =>
                                    s.id === scene.id ? { ...s, photoUrl: '' } : s
                                  ),
                                }));
                              }}
                            >
                              ?ъ쭊 鍮꾩슦湲?
                            </button>
                          ) : null}
                        </div>
                        <label
                          style={{
                            display: 'block',
                            width: '100%',
                            aspectRatio: '1 / 1',
                            backgroundColor: '#f8fafc',
                            border: '1px solid rgba(215, 224, 235, 0.88)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                        >
                          {scene.photoUrl ? (
                            <img src={scene.photoUrl} alt="?꾩옣 ?ъ쭊" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                              ?곗튂?섏뿬 ?ъ쭊 ?좏깮
                            </div>
                          )}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleDoc3SceneUpload(scene.id, index, file);
                                }
                              }}
                            />
                          </label>
                        {index >= FIXED_SCENE_COUNT ? (
                          <input
                            className="app-input"
                            value={scene.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                                ...current,
                                document3Scenes: current.document3Scenes.map((s) =>
                                  s.id === scene.id ? { ...s, title: value } : s
                                ),
                              }));
                            }}
                            placeholder={`${getExtraSceneTitle(index)} ?? 泥쒖옣 諛곌? ?ㅼ튂`}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <div style={{ fontSize: '12px', color: '#64748b', minHeight: '18px' }}>
                            {doc3AnalyzingSceneIds.includes(scene.id)
                              ? 'AI ?뺣━ 以?
                              : scene.title?.trim() || getFixedSceneTitle(index)}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 4?④퀎: ?댁쟾 湲곗닠吏???ы빆 */}
            {activeStep === 'step4' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?댁쟾 湲곗닠吏???ы빆 ?댄뻾?щ?</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  {screen.isRelationHydrating ? (
                    <p className={styles.inlineNotice} style={{ marginBottom: '12px' }}>
                      ?댁쟾 蹂닿퀬?쒖쓽 ?댄뻾 ??ぉ??遺덈윭?ㅻ뒗 以묒엯?덈떎.
                    </p>
                  ) : null}
                  {screen.relationStatus === 'error' ? (
                    <p className={styles.errorNotice} style={{ marginBottom: '12px' }}>
                      ?댁쟾 蹂닿퀬???곗씠?곕? ?꾩쭅 遺덈윭?ㅼ? 紐삵뻽?듬땲??
                    </p>
                  ) : null}
                  {session.document4FollowUps.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {session.document4FollowUps.map((item) => (
                        <article key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>{item.location || '?꾩튂 誘몄???}</div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '8px',
                              marginBottom: '10px',
                            }}
                          >
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>?쒖젙議곗튂 寃곌낵</span>
                              <select
                                className="app-select"
                                value={item.result}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                    ...current,
                                    document4FollowUps: current.document4FollowUps.map((f) =>
                                      f.id === item.id ? { ...f, result: value } : f
                                    ),
                                  }));
                                }}
                              >
                                {FOLLOW_UP_RESULT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>吏?꾩씪??/span>
                              <input
                                className="app-input"
                                value={item.guidanceDate || '誘멸린濡?}
                                readOnly
                              />
                            </label>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>?댁쟾 吏???ъ쭊</div>
                              {item.beforePhotoUrl ? (
                                <img src={item.beforePhotoUrl} alt="吏???ъ쭊" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f8fafc' }} />
                              ) : (
                                <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>?ъ쭊 ?놁쓬</div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>媛쒖꽑 ???ъ쭊</div>
                              <label style={{ display: 'block', width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                {item.afterPhotoUrl ? (
                                  <img src={item.afterPhotoUrl} alt="媛쒖꽑 ?ъ쭊" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                    ?ъ쭊 ?좏깮
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                          ...current,
                                          document4FollowUps: current.document4FollowUps.map((f) =>
                                            f.id === item.id ? { ...f, afterPhotoUrl: value } : f
                                          ),
                                        }));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.inlineNotice}>?댁쟾 湲곗닠吏???ы빆???놁뒿?덈떎.</p>
                  )}
                </div>
              </section>
            )}

            {/* 5?④퀎: 珥앺룊 */}
            {activeStep === 'step5' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>湲곗닠吏??珥앺룊</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div className={workspaceStyles.doc5StatsGrid} style={{ marginBottom: '12px' }}>
                    <ChartCard
                      title="吏?곸쑀???듦퀎 湲덊쉶"
                      entries={screen.derivedData.currentAccidentEntries}
                      variant="erp"
                    />
                    <ChartCard
                      title="湲곗씤臾??듦퀎 湲덊쉶"
                      entries={screen.derivedData.currentAgentEntries}
                      variant="erp"
                    />
                    {screen.isRelationReady ? (
                      <>
                        <ChartCard
                          title="吏?곸쑀???듦퀎 ?꾩쟻"
                          entries={screen.derivedData.cumulativeAccidentEntries}
                          variant="erp"
                        />
                        <ChartCard
                          title="湲곗씤臾??듦퀎 ?꾩쟻"
                          entries={screen.derivedData.cumulativeAgentEntries}
                          variant="erp"
                        />
                      </>
                    ) : (
                      <>
                        <article className={workspaceStyles.doc5ChartPanel}>
                          <h3 className={workspaceStyles.doc5ChartPanelTitle}>吏?곸쑀???듦퀎 ?꾩쟻</h3>
                          <div className={workspaceStyles.doc5ChartPanelBody}>
                            <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                              {screen.isRelationHydrating
                                ? '?꾩쟻 ?듦퀎瑜?怨꾩궛?섎뒗 以묒엯?덈떎.'
                                : screen.relationStatus === 'error'
                                  ? '?꾩쟻 ?듦퀎瑜??꾩쭅 遺덈윭?ㅼ? 紐삵뻽?듬땲??'
                                  : '?댁쟾 蹂닿퀬?쒓? ?놁뼱 ?꾩쟻 ?듦퀎媛 ?놁뒿?덈떎.'}
                            </div>
                          </div>
                        </article>
                        <article className={workspaceStyles.doc5ChartPanel}>
                          <h3 className={workspaceStyles.doc5ChartPanelTitle}>湲곗씤臾??듦퀎 ?꾩쟻</h3>
                          <div className={workspaceStyles.doc5ChartPanelBody}>
                            <div className={styles.inlineNotice} style={{ margin: 0, textAlign: 'center' }}>
                              {screen.isRelationHydrating
                                ? '?꾩쟻 ?듦퀎瑜?怨꾩궛?섎뒗 以묒엯?덈떎.'
                                : screen.relationStatus === 'error'
                                  ? '?꾩쟻 ?듦퀎瑜??꾩쭅 遺덈윭?ㅼ? 紐삵뻽?듬땲??'
                                  : '?댁쟾 蹂닿퀬?쒓? ?놁뼱 ?꾩쟻 ?듦퀎媛 ?놁뒿?덈떎.'}
                            </div>
                          </div>
                        </article>
                      </>
                    )}
                  </div>
                  <div className={styles.mobileEditorFieldStack}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                        珥앺룊 蹂몃Ц
                      </div>
                      <button
                        type="button"
                        className={workspaceStyles.doc5SummaryDraftBtn}
                        disabled={doc5DraftLoading}
                        onClick={() => void handleGenerateDoc5Draft()}
                      >
                        珥앺룊 AI ?앹꽦
                      </button>
                    </div>
                    {doc5DraftLoading ? (
                      <span className={styles.inlineNotice} role="status" aria-live="polite">
                        AI媛 珥앺룊???뺣━?섍퀬 ?덉뒿?덈떎.
                      </span>
                    ) : null}
                    {doc5DraftError ? (
                      <p className={styles.errorNotice} style={{ margin: 0 }}>
                        {doc5DraftError}
                      </p>
                    ) : null}
                    {doc5DraftNotice ? (
                      <p className={styles.inlineNotice} style={{ margin: 0 }}>
                        {doc5DraftNotice}
                      </p>
                    ) : null}
                    {screen.isRelationHydrating ? (
                      <p className={styles.inlineNotice} style={{ margin: 0 }}>
                        ?꾩쟻 ?듦퀎瑜?怨꾩궛?섎뒗 以묒엯?덈떎. 吏湲??앹꽦?섎㈃ ?꾩옱 蹂닿퀬??湲곗??쇰줈 癒쇱? ?묒꽦?⑸땲??
                      </p>
                    ) : null}
                    {screen.relationStatus === 'error' ? (
                      <p className={styles.errorNotice} style={{ margin: 0 }}>
                        ?꾩쟻 ?듦퀎瑜??꾩쭅 遺덈윭?ㅼ? 紐삵뻽?듬땲?? 珥앺룊? ?꾩옱 蹂닿퀬??湲곗??쇰줈???앹꽦?????덉뒿?덈떎.
                      </p>
                    ) : null}
                    <textarea
                      className="app-input"
                      value={session.document5Summary.summaryText}
                      onChange={(e) => {
                        const value = e.target.value;
                        screen.applyDocumentUpdate('doc5', 'manual', (current) => ({
                          ...current,
                          document5Summary: {
                            ...current.document5Summary,
                            summaryText: value,
                          },
                        }));
                      }}
                      placeholder="珥앺룊???낅젰?섏꽭??
                      style={{ width: '100%', minHeight: '200px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 6?④퀎: 12? ?щ쭩?ш퀬 湲곗씤臾?*/}
            {activeStep === 'step6' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>12? ?щ쭩?ш퀬 湲곗씤臾?/h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div className={styles.doc6FlatList}>
                    {CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
                      section.rows.flatMap((row) => [row.left, row.right]),
                    ).map((measure) => {
                      const currentMeasure = session.document6Measures.find(
                        (item) => item.key === measure.key,
                      );

                      return (
                        <label key={measure.key} className={styles.doc6FlatItem}>
                          <span className={styles.doc6FlatLabel}>
                            {measure.number}. {measure.label}
                          </span>
                          <span className={styles.doc6FlatCheck}>
                            <input
                              type="checkbox"
                              className="app-checkbox"
                              checked={currentMeasure?.checked ?? false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                screen.applyDocumentUpdate('doc6', 'manual', (current) => ({
                                  ...current,
                                  document6Measures: current.document6Measures.map((m) =>
                                    m.key === measure.key ? { ...m, checked } : m,
                                  ),
                                }));
                              }}
                              aria-label={`${measure.label} ?대떦`}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 7?④퀎: ?꾩〈 ?좏빐쨌?꾪뿕?붿씤 ?몃? 吏??*/}
            {activeStep === 'step7' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?꾩〈 ?좏빐쨌?꾪뿕?붿씤 ?몃? 吏??/h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document7Findings.map((finding, index) => (
                      <article key={finding.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, flexShrink: 0 }}>
                              吏???ы빆 {index + 1}
                            </span>
                            <button
                              type="button"
                              className={workspaceStyles.doc5SummaryDraftBtn}
                              disabled={!finding.photoUrl || doc7AiLoadingId === finding.id}
                              onClick={() => void handleDoc7AiRefill(finding.id, finding.photoUrl || '')}
                            >
                              {doc7AiLoadingId === finding.id ? 'AI 梨꾩슦??以? : 'AI ?ㅼ떆 梨꾩슦湲?}
                            </button>
                          </div>
                          <button
                            type="button"
                            className={styles.mobileEditorCardAction}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                ...current,
                                document7Findings: current.document7Findings.filter((f) => f.id !== finding.id),
                              }));
                            }}
                          >
                            ??젣
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <label style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                              {finding.photoUrl ? (
                                <img src={finding.photoUrl} alt="吏???ъ쭊 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  ?ъ쭊 1 異붽?
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl: value } : f
                                        ),
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                            <label style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                              {finding.photoUrl2 ? (
                                <img src={finding.photoUrl2} alt="吏???ъ쭊 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  ?ъ쭊 2 異붽?
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl2: value } : f
                                        ),
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {doc7AiErrors[finding.id] ? (
                            <p className={styles.errorNotice} style={{ margin: 0 }}>
                              {doc7AiErrors[finding.id]}
                            </p>
                          ) : null}
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uc704\uce58"}</span>
                            <input
                              className="app-input"
                              value={finding.location}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, location: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc704\uce58 (\uc608: A\ub3d9 2\uce35)"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '8px',
                            }}
                          >
                            <div className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>{"\uc0ac\uace0\uc720\ud615"}</span>
                              <select
                                className="app-select"
                                value={finding.accidentType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                    ...current,
                                    document7Findings: current.document7Findings.map((f) =>
                                      f.id === finding.id ? { ...f, accidentType: value } : f
                                    ),
                                  }));
                                }}
                              >
                                <option value="">{"\uc120\ud0dd"}</option>
                                {ACCIDENT_TYPE_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.mobileEditorFieldGroup}>
                              <span className={styles.mobileEditorFieldLabel}>{"\uc704\ud5d8\ub3c4"}</span>
                              <select
                                className="app-select"
                                value={finding.riskLevel}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                    ...current,
                                    document7Findings: current.document7Findings.map((f) =>
                                      f.id === finding.id ? { ...f, riskLevel: value } : f
                                    ),
                                  }));
                                }}
                              >
                                {RISK_TRI_LEVEL_OPTIONS.map((option) => (
                                  <option key={option.value || 'empty'} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uae30\uc778\ubb3c"}</span>
                            <select
                              className="app-select"
                              value={finding.causativeAgentKey}
                              onChange={(e) => {
                                const value = e.target.value as typeof finding.causativeAgentKey;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, causativeAgentKey: value } : f
                                  ),
                                }));
                              }}
                            >
                              <option value="">{"\uc120\ud0dd"}</option>
                              {CAUSATIVE_AGENT_OPTIONS.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uc720\ud574\uc704\ud5d8\uc694\uc778"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.hazardDescription || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, hazardDescription: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc720\ud574\uc704\ud5d8\uc694\uc778 \uc124\uba85"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uac1c\uc120\uc694\uccad\uc0ac\ud56d"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.improvementRequest || finding.improvementPlan || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id
                                      ? {
                                          ...f,
                                          improvementPlan: value,
                                          improvementRequest: value,
                                        }
                                      : f
                                  ),
                                }));
                              }}
                              placeholder={"\uac1c\uc120\uc694\uccad\uc0ac\ud56d"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>
                              {"\uc911\uc810\uad00\ub9ac \uc704\ud5d8\uc694\uc778 \ubc0f \uad00\ub9ac\ubc29\uc548"}
                            </span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={finding.emphasis}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id ? { ...f, emphasis: value } : f
                                  ),
                                }));
                              }}
                              placeholder={"\uc911\uc810\uad00\ub9ac \uc704\ud5d8\uc694\uc778 \ubc0f \uad00\ub9ac\ubc29\uc548"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"\uad00\ub828 \ubc95\ub839"}</span>
                            <input
                              className="app-input"
                              value={finding.legalReferenceTitle}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                  ...current,
                                  document7Findings: current.document7Findings.map((f) =>
                                    f.id === finding.id
                                      ? {
                                          ...f,
                                          legalReferenceId: '',
                                          legalReferenceTitle: value,
                                          referenceLawTitles: value
                                            .split(/[\n,]+/)
                                            .map((entry) => entry.trim())
                                            .filter(Boolean),
                                        }
                                      : f
                                  ),
                                }));
                              }}
                              placeholder={"\uad00\ub828 \ubc95\ub839"}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                          ...current,
                          document7Findings: [
                            ...current.document7Findings,
                            createCurrentHazardFinding({ inspector: current.meta.drafter }),
                          ],
                        }));
                      }}
                    >
                      + 吏???ы빆 異붽?
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 8?④퀎: ?ν썑 吏꾪뻾怨듭젙 */}
            {activeStep === 'step8' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?ν썑 吏꾪뻾怨듭젙 ?꾪뿕?붿씤</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document8Plans.map((plan, index) => (
                      <article key={plan.id} className={styles.mobileEditorCard}>
                        <div className={styles.mobileEditorCardHeader}>
                          <span className={styles.mobileEditorCardTitle}>{"吏꾪뻾怨듭젙"} {index + 1}</span>
                          <button
                            type="button"
                            className={styles.mobileEditorCardAction}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.filter((p) => p.id !== plan.id),
                              }));
                            }}
                          >
                            {"??젣"}
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"怨듭젙紐?}</span>
                            <div
                              className={styles.mobileDoc8ProcessStack}
                              onBlur={(event) => handleDoc8ProcessBlur(plan.id, event)}
                            >
                              <input
                                autoComplete="off"
                                role="combobox"
                                aria-autocomplete="list"
                                aria-controls={`mobile-doc8-recommendations-${plan.id}`}
                                aria-expanded={activeDoc8PlanId === plan.id}
                                aria-haspopup="listbox"
                                className="app-input"
                                value={plan.processName}
                                onFocus={() => setActiveDoc8PlanId(plan.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Escape') {
                                    setActiveDoc8PlanId((current) =>
                                      current === plan.id ? null : current,
                                    );
                                  }
                                }}
                                onChange={(e) => {
                                  setActiveDoc8PlanId(plan.id);
                                  updateDoc8ProcessPlan(plan.id, e.target.value);
                                }}
                                placeholder={"怨듭젙紐?(?? 泥좉낏 ?먯옱 諛섏엯)"}
                                style={{ width: '100%' }}
                              />
                              {activeDoc8PlanId === plan.id &&
                              getDoc8ProcessRecommendations(plan.processName).length > 0 ? (
                                <div
                                  id={`mobile-doc8-recommendations-${plan.id}`}
                                  className={workspaceStyles.doc8RecommendationList}
                                  role="listbox"
                                >
                                  {getDoc8ProcessRecommendations(plan.processName).map((libraryItem) => {
                                    const isSelected = libraryItem.processName === plan.processName;

                                    return (
                                      <button
                                        key={libraryItem.processName}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`${workspaceStyles.doc8RecommendationButton} ${
                                          isSelected
                                            ? workspaceStyles.doc8RecommendationButtonActive
                                            : ''
                                        }`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => {
                                          updateDoc8ProcessPlan(plan.id, libraryItem.processName);
                                          setActiveDoc8PlanId(null);
                                        }}
                                      >
                                        {libraryItem.processName}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"?꾪뿕?붿씤"}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={plan.hazard}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                  ...current,
                                  document8Plans: current.document8Plans.map((p) =>
                                    p.id === plan.id ? { ...p, hazard: value } : p
                                  ),
                                }));
                              }}
                              placeholder={"?꾪뿕?붿씤"}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className={styles.mobileEditorFieldGroup}>
                            <span className={styles.mobileEditorFieldLabel}>{"?덉쟾?梨?}</span>
                            <textarea
                              className={`app-input ${styles.mobileEditorTextareaCompact}`}
                              value={plan.countermeasure}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                  ...current,
                                  document8Plans: current.document8Plans.map((p) =>
                                    p.id === plan.id ? { ...p, countermeasure: value } : p
                                  ),
                                }));
                              }}
                              placeholder={"?덉쟾?梨?}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: [
                            ...current.document8Plans,
                            createFutureProcessRiskPlan(),
                          ],
                        }));
                      }}
                    >
                      + 怨듭젙 異붽?
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 9?④퀎: ?꾪뿕?깊룊媛 / TBM */}
            {activeStep === 'step9' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?꾪뿕?깊룊媛 / TBM</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* TBM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>TBM 泥댄겕由ъ뒪??/div>
                      {session.document9SafetyChecks.tbm.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(215, 224, 235, 0.72)' }}>
                          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f172a' }}>{item.prompt}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 88px', gap: '8px', alignItems: 'center' }}>
                            <input
                              className="app-input"
                              value={item.note}
                              onChange={(e) => {
                                const note = e.target.value;
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    tbm: current.document9SafetyChecks.tbm.map((q) =>
                                      q.id === item.id ? { ...q, note } : q
                                    ),
                                  },
                                }));
                              }}
                              placeholder="硫붾え"
                            />
                            <select
                              className="app-select"
                              value={item.rating}
                              onChange={(e) => {
                                const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    tbm: current.document9SafetyChecks.tbm.map((q) =>
                                      q.id === item.id ? { ...q, rating } : q
                                    ),
                                  },
                                }));
                              }}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '13px', height: '38px' }}
                            >
                              {CHECKLIST_RATING_OPTIONS.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ?꾪뿕?깊룊媛 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>?꾪뿕?깊룊媛 泥댄겕由ъ뒪??/div>
                      {session.document9SafetyChecks.riskAssessment.map((item) => (
                        <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(215, 224, 235, 0.72)' }}>
                          <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#0f172a' }}>{item.prompt}</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 88px', gap: '8px', alignItems: 'center' }}>
                            <input
                              className="app-input"
                              value={item.note}
                              onChange={(e) => {
                                const note = e.target.value;
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    riskAssessment: current.document9SafetyChecks.riskAssessment.map((q) =>
                                      q.id === item.id ? { ...q, note } : q
                                    ),
                                  },
                                }));
                              }}
                              placeholder="硫붾え"
                            />
                            <select
                              className="app-select"
                              value={item.rating}
                              onChange={(e) => {
                                const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                                screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                  ...current,
                                  document9SafetyChecks: {
                                    ...current.document9SafetyChecks,
                                    riskAssessment: current.document9SafetyChecks.riskAssessment.map((q) =>
                                      q.id === item.id ? { ...q, rating } : q
                                    ),
                                  },
                                }));
                              }}
                              style={{ width: '100%', padding: '4px 8px', fontSize: '13px', height: '38px' }}
                            >
                              {CHECKLIST_RATING_OPTIONS.map((option) => (
                                <option key={option.value || 'empty'} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 10?④퀎: 怨꾩륫?먭? */}
            {activeStep === 'step10' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>怨꾩륫?먭?</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document10Measurements.map((measurement, index) => (
                      <article key={measurement.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>怨꾩륫湲?{index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.filter((m) => m.id !== measurement.id),
                              }));
                            }}
                          >
                            ??젣
                          </button>
                        </div>
                        <div className={styles.mobileEditorFieldStack}>
                          <label style={{ display: 'block', width: '100%', height: '160px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                            {measurement.photoUrl ? (
                              <img src={measurement.photoUrl} alt="怨꾩륫 ?ъ쭊" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                                ?ъ쭊 ?낅줈??
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void handleDoc10PhotoSelect(measurement.id, file);
                                }
                              }}
                            />
                          </label>
                          {doc10MatchingMeasurementId === measurement.id ? (
                            <p className={styles.inlineNotice} style={{ margin: 0 }}>
                              AI媛 怨꾩륫?λ퉬瑜??뺤씤?섍퀬 ?덉뒿?덈떎.
                            </p>
                          ) : null}
                          {doc10MatchErrors[measurement.id] ? (
                            <p className={styles.errorNotice} style={{ margin: 0 }}>
                              {doc10MatchErrors[measurement.id]}
                            </p>
                          ) : null}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                              className="app-select"
                              value={measurement.instrumentType}
                              onChange={(e) => {
                                const value = e.target.value;
                                const matchedTemplate =
                                  measurementTemplateOptions.find(
                                    (template) =>
                                      template.instrumentName.trim().toLowerCase() ===
                                      value.trim().toLowerCase(),
                                  ) ?? null;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id
                                      ? {
                                          ...m,
                                          instrumentType: value,
                                          safetyCriteria:
                                            matchedTemplate?.safetyCriteria ?? m.safetyCriteria,
                                        }
                                      : m
                                  ),
                                }));
                              }}
                              style={{ flex: 1 }}
                            >
                              <option value="">?λ퉬 ?좏깮</option>
                              {measurement.instrumentType &&
                              !measurementTemplateOptions.some(
                                (template) => template.instrumentName === measurement.instrumentType,
                              ) ? (
                                <option value={measurement.instrumentType}>
                                  {measurement.instrumentType}
                                </option>
                              ) : null}
                              {measurementTemplateOptions.map((template) => (
                                <option key={template.id} value={template.instrumentName}>
                                  {template.instrumentName}
                                </option>
                              ))}
                            </select>
                            <input
                              className="app-input"
                              value={measurement.measuredValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, measuredValue: value } : m
                                  ),
                                }));
                              }}
                              placeholder="痢≪젙媛?
                              style={{ flex: 1 }}
                            />
                          </div>
                          <input
                            className="app-input"
                            value={measurement.measurementLocation}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.map((m) =>
                                  m.id === measurement.id ? { ...m, measurementLocation: value } : m
                                ),
                              }));
                            }}
                            placeholder="痢≪젙 ?꾩튂"
                            style={{ width: '100%' }}
                          />
                          <input
                            className="app-input"
                            value={measurement.actionTaken}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.map((m) =>
                                  m.id === measurement.id ? { ...m, actionTaken: value } : m
                                ),
                              }));
                            }}
                            placeholder="議곗튂 ?щ?"
                            style={{ width: '100%' }}
                          />
                          <textarea
                            className="app-input"
                            value={measurement.safetyCriteria}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.map((m) =>
                                  m.id === measurement.id ? { ...m, safetyCriteria: value } : m
                                ),
                              }));
                            }}
                            placeholder="?덉쟾湲곗?"
                            style={{ width: '100%', minHeight: '72px', resize: 'vertical' }}
                          />
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                          ...current,
                          document10Measurements: [
                            ...current.document10Measurements,
                            createMeasurementCheckItem(),
                          ],
                        }));
                      }}
                    >
                      + 怨꾩륫?먭? 異붽?
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 11?④퀎: ?덉쟾援먯쑁 */}
            {activeStep === 'step11' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?덉쟾援먯쑁</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document11EducationRecords.map((record) => (
                      <article
                        key={record.id}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(0, 1fr) 120px',
                              gap: '10px',
                            }}
                          >
                            <label
                              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>援먯쑁 二쇱젣</span>
                              <input
                                className="app-input"
                                value={record.topic}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                    ...current,
                                    document11EducationRecords:
                                      current.document11EducationRecords.map((item) =>
                                        item.id === record.id ? { ...item, topic: value } : item,
                                      ),
                                  }));
                                }}
                                placeholder="?? 異붾씫二쇱쓽"
                              />
                            </label>
                            <label
                              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                李몄꽍 ?몄썝 (紐?
                              </span>
                              <input
                                className="app-input"
                                type="number"
                                value={record.attendeeCount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                    ...current,
                                    document11EducationRecords:
                                      current.document11EducationRecords.map((item) =>
                                        item.id === record.id
                                          ? { ...item, attendeeCount: value }
                                          : item,
                                      ),
                                  }));
                                }}
                                placeholder="0"
                              />
                            </label>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                  援먯쑁 ?꾩옣 ?ъ쭊
                                </span>
                                {record.photoUrl ? (
                                  <button
                                    type="button"
                                    className={workspaceStyles.doc5SummaryDraftBtn}
                                    onClick={() => {
                                      screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                        ...current,
                                        document11EducationRecords:
                                          current.document11EducationRecords.map((item) =>
                                            item.id === record.id
                                              ? { ...item, photoUrl: '' }
                                              : item,
                                          ),
                                      }));
                                    }}
                                  >
                                    ?ъ쭊 ??젣
                                  </button>
                                ) : null}
                              </div>
                              <label
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: '156px',
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid rgba(215, 224, 235, 0.88)',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  cursor: 'pointer',
                                }}
                              >
                                {record.photoUrl ? (
                                  <img
                                    src={record.photoUrl}
                                    alt="?덉쟾援먯쑁 ?ъ쭊"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#64748b',
                                      fontSize: '13px',
                                    }}
                                  >
                                    ?ъ쭊 ?낅줈??
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                          ...current,
                                          document11EducationRecords:
                                            current.document11EducationRecords.map((item) =>
                                              item.id === record.id
                                                ? { ...item, photoUrl: value }
                                                : item,
                                            ),
                                        }));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>援먯쑁 ?먮즺</span>
                                {record.materialUrl ? (
                                  <button
                                    type="button"
                                    className={workspaceStyles.doc5SummaryDraftBtn}
                                    onClick={() => {
                                      screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                        ...current,
                                        document11EducationRecords:
                                          current.document11EducationRecords.map((item) =>
                                            item.id === record.id
                                              ? { ...item, materialUrl: '', materialName: '' }
                                              : item,
                                          ),
                                      }));
                                    }}
                                  >
                                    ?먮즺 ??젣
                                  </button>
                                ) : null}
                              </div>
                              <label
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: '156px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid rgba(215, 224, 235, 0.88)',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  cursor: 'pointer',
                                }}
                              >
                                {record.materialUrl &&
                                (record.materialUrl.startsWith('data:image/') ||
                                  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(record.materialName)) ? (
                                  <img
                                    src={record.materialUrl}
                                    alt={record.materialName || '援먯쑁 ?먮즺'}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                  />
                                ) : record.materialUrl ? (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#475569',
                                      fontSize: '12px',
                                      textAlign: 'center',
                                      padding: '12px',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {record.materialName || '?낅줈?쒕맂 ?먮즺'}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#64748b',
                                      fontSize: '13px',
                                      textAlign: 'center',
                                      padding: '12px',
                                    }}
                                  >
                                    ?먮즺 ?낅줈??
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*,.pdf,.hwp,.hwpx,.ppt,.pptx,.doc,.docx"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void screen.withFileData(file, (value, selectedFile) => {
                                        screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                          ...current,
                                          document11EducationRecords:
                                            current.document11EducationRecords.map((item) =>
                                              item.id === record.id
                                                ? {
                                                    ...item,
                                                    materialUrl: value,
                                                    materialName: selectedFile.name,
                                                  }
                                                : item,
                                            ),
                                        }));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>援먯쑁 ?댁슜</span>
                              <button
                                type="button"
                                className={workspaceStyles.doc5SummaryDraftBtn}
                                disabled={doc11GeneratingId === record.id}
                                onClick={() => void handleGenerateDoc11Content(record.id)}
                              >
                                {doc11GeneratingId === record.id ? 'AI ?앹꽦 以? : '?댁슜 ?먮룞 ?앹꽦'}
                              </button>
                            </div>
                            {doc11ContentError?.id === record.id ? (
                              <p className={styles.errorNotice} style={{ margin: 0 }}>
                                {doc11ContentError.message}
                              </p>
                            ) : null}
                            {doc11ContentNotice?.id === record.id ? (
                              <p className={styles.inlineNotice} style={{ margin: 0 }}>
                                {doc11ContentNotice.message}
                              </p>
                            ) : null}
                            <textarea
                              className="app-input"
                              value={record.content}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
                                  ...current,
                                  document11EducationRecords:
                                    current.document11EducationRecords.map((item) =>
                                      item.id === record.id ? { ...item, content: value } : item,
                                    ),
                                }));
                              }}
                              placeholder="援먯쑁 ?댁슜???낅젰?섏꽭??"
                              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 12?④퀎: ?쒕룞 ?ㅼ쟻 */}
            {activeStep === 'step12' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>?덉쟾蹂닿굔 ?쒕룞 吏??/h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  {session.document12Activities.slice(0, 2).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {session.document12Activities.slice(0, 2).map((activity, index) => (
                        <article
                          key={activity.id}
                          style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>
                              {`?쒕룞 吏??${index + 1}`}
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                ?ㅼ쟻 ?대쫫
                              </span>
                              <input
                                className="app-input"
                                value={activity.activityType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                    ...current,
                                    document12Activities: current.document12Activities.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, activityType: value } : item,
                                    ),
                                  }));
                                }}
                                placeholder="?? ?덉쟾蹂닿굔 罹좏럹??
                              />
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                                ?쒕룞 ?ъ쭊
                              </span>
                              {activity.photoUrl ? (
                                <button
                                  type="button"
                                  className={workspaceStyles.doc5SummaryDraftBtn}
                                  onClick={() => {
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, photoUrl: '' } : item,
                                      ),
                                    }));
                                  }}
                                >
                                  ?ъ쭊 ??젣
                                </button>
                              ) : null}
                            </div>
                            <label
                              style={{
                                display: 'block',
                                width: '100%',
                                height: '180px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid rgba(215, 224, 235, 0.88)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                              }}
                            >
                              {activity.photoUrl ? (
                                <img
                                  src={activity.photoUrl}
                                  alt={`?쒕룞 吏???ъ쭊 ${index + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b',
                                    fontSize: '13px',
                                  }}
                                >
                                  ?ъ쭊 ?낅줈??
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                        ...current,
                                        document12Activities: current.document12Activities.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, photoUrl: value } : item,
                                        ),
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.inlineNotice}>?쒕룞 吏???щ’???놁뒿?덈떎.</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.inlineNotice} style={{ margin: '16px' }}>蹂닿퀬??蹂몃Ц???숆린?뷀븯??以묒엯?덈떎.</p>
      )}

      {hasLoadedSessionPayload && session ? (
        <AppModal
          open={isDoc2ProcessModalOpen}
          title="吏꾪뻾怨듭젙 諛??뱀씠?ы빆 ?먮룞?앹꽦"
          onClose={() => setIsDoc2ProcessModalOpen(false)}
          size="large"
          verticalAlign="center"
          actions={
            <>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setIsDoc2ProcessModalOpen(false)}
              >
                ?リ린
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleGenerateDoc2ProcessNotes()}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                {isGeneratingDoc2ProcessNotes ? 'AI ?앹꽦 以? : 'AI ?앹꽦'}
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={applyDoc2ProcessNotesDraft}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                蹂몃Ц??諛섏쁺
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className={styles.inlineNotice} style={{ margin: 0 }}>
              怨듭궗媛쒖슂???꾩슂??5媛???ぉ???낅젰?섎㈃, 媛쒖슂 2以꾩? 利됱떆 ?뺣━?섍퀬 二쇱슂 ?꾪뿕 ?붿씤
              2以꾩? AI濡??앹꽦?⑸땲??
            </p>
            {doc2ProcessError ? (
              <p className={styles.errorNotice} style={{ margin: 0 }}>
                {doc2ProcessError}
              </p>
            ) : null}
            {doc2ProcessNotice ? (
              <p className={styles.inlineNotice} style={{ margin: 0 }}>
                {doc2ProcessNotice}
              </p>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  ?묒뾽?꾩옱 怨듭젙
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkContent}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processWorkContent', event.target.value)
                  }
                  placeholder="?? 泥좉굅?묒뾽, 湲덉냽?묒뾽"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  ?묒뾽 ?몄썝
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkerCount}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processWorkerCount', event.target.value)
                  }
                  placeholder="?? 6"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  嫄댁꽕湲곌퀎 ?λ퉬
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processEquipment}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processEquipment', event.target.value)
                  }
                  placeholder="?? ?몃윮, 援댁갑湲?
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  ?좏빐?꾪뿕湲곌뎄
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processTools}
                  onChange={(event) =>
                    handleDoc2ProcessFieldChange('processTools', event.target.value)
                  }
                  placeholder="?? ?몃뱶釉뚮젅?댁빱, ?⑹젒湲?
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                ?좏빐?꾪뿕臾쇱쭏
              </span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processHazardousMaterials}
                onChange={(event) =>
                  handleDoc2ProcessFieldChange('processHazardousMaterials', event.target.value)
                }
                placeholder="?? ?섏씤?? LPG, ?⑹젒遊?
              />
            </label>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                padding: '12px',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                4以?誘몃━蹂닿린
              </strong>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#475569',
                }}
              >
                {doc2ProcessNoteDraft}
              </pre>
            </div>
          </div>
        </AppModal>
      ) : null}

      {errors.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {errors.map((message) => (
            <p key={message} className={styles.errorNotice}>
              {message}
            </p>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
