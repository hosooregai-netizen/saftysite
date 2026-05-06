'use client';

import {
  type CreditLedgerEntry,
  type CreateReportInput,
  type ExportReportInput,
  type GenerateDraftFromGuidedPhotosInput,
  type GenerateDraftFromPhotosInput,
  reportPayloadSchema,
  type ReportPayload,
  type GuidedPhotoStepUploadInput,
} from '@saftysite/contracts';
import { buildDemoReport } from '@/lib/demoReport';
import { clearSafetyAuthToken, writeSafetyAuthToken } from '@/lib/safetyApi/authStorage';
import {
  deletePersistedValue,
  readPersistedValue,
  writePersistedValue,
} from '@/lib/clientPersistence';

const API_PREFIX = '/api/report-saas/v1';
const SESSION_STORAGE_KEY = 'saftysite-web-report-session-v2';
const LOCAL_REPORTS_INDEX_KEY = 'saftysite-web-local-reports-v1';
const LOCAL_REPORT_KEY_PREFIX = 'saftysite-web-local-report:';
const GENERATED_REPORT_SNAPSHOT_KEY_PREFIX = 'saftysite-web-generated-report:';
const GENERATED_REPORT_SNAPSHOT_INDEX_KEY = 'saftysite-web-generated-report-index:v1';
const GENERATED_REPORT_LAST_SESSION_KEY = 'saftysite-web-generated-report-session:v1';
const GENERATED_REPORT_SNAPSHOT_TTL_MS = 15 * 60 * 1000;
const SESSION_STORE_EVENT = 'saftysite:report-session-changed';
const DEFAULT_WORKSPACE_NAME = '기술지도 작업공간';
const LOCAL_WORKSPACE_ID = 'local-workspace';
const LOCAL_WORKSPACE_NAME = '로컬 임시 보관함';
const LOCAL_USER_ID = 'local-user';
const LOCAL_USER_NAME = '로컬 임시 작성자';

export type SessionMode = 'authenticated' | 'anonymous' | 'local';

export type DemoSession = {
  token: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  mode: SessionMode;
  isAnonymous: boolean;
  isLocalOnly: boolean;
};

export type ReportExportRecord = {
  id: string;
  report_id: string;
  format: 'pdf' | 'hwpx';
  first_charge_applied: boolean;
  created_at: string;
};

export type ReportRecord = {
  id: string;
  workspace_id: string;
  created_by: string;
  site_id?: string | null;
  headquarter_id?: string | null;
  status: ReportPayload['status'];
  payload: ReportPayload;
  review_completed: boolean;
  final_export_consumed: boolean;
  created_at: string;
  updated_at: string;
  exports: ReportExportRecord[];
  creditBalance?: number;
  exportDisclaimerAccepted: boolean;
  exportDisclaimerAcceptance?: {
    id: string;
    workspace_id: string;
    user_id: string;
    accepted_by_name: string;
    version: string;
    accepted_at: string;
  } | null;
  sessionMode?: SessionMode;
  localOnly?: boolean;
};

type GuidedUploadStepKey = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5';

type WorkspaceMembershipResponse = {
  workspace: {
    id: string;
    name: string;
  };
  membership: {
    id: string;
    role: string;
  };
  creditBalance: number;
};

type BillingCheckoutResponse = {
  checkoutUrl?: string | null;
  orderId: string;
  workspaceId: string;
  package: {
    amount_krw: number;
    credits: number;
  };
};

type AuthResponse = {
  token: string;
  user: {
    auth_provider?: string;
    avatar_url?: string | null;
    email?: string;
    id: string;
    is_active?: boolean;
    name: string;
    is_anonymous?: boolean;
  };
};

export type GoogleWorkspaceAuthStartResponse = {
  authorization_url: string;
  redirect_uri: string;
  state: string;
};

type AnonymousClaimResponse = {
  workspace: {
    id: string;
    name: string;
  };
  membership: {
    id: string;
    role: string;
  };
  creditBalance: number;
};

type LocalReportIndexEntry = {
  id: string;
  title: string;
  customerName: string;
  visitDate: string;
  updatedAt: string;
};

type GeneratedReportSnapshotPayload = {
  expiresAt: number;
  record: ReportRecord;
  session: DemoSession;
  storedAt: number;
};

type DemoSessionLike = Partial<DemoSession> | null | undefined;

let bootstrapPromise: Promise<DemoSession> | null = null;
let cachedSessionStorageRaw: string | null | undefined;
let cachedSessionSnapshot: DemoSession | null | undefined;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function createRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isLocalReportId(reportId: string): boolean {
  return reportId.startsWith('local-report:');
}

function normalizeDemoSession(value: DemoSessionLike): DemoSession | null {
  if (
    !value ||
    typeof value.token !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.userName !== 'string' ||
    typeof value.workspaceId !== 'string' ||
    typeof value.workspaceName !== 'string'
  ) {
    return null;
  }

  if (
    value.mode !== 'authenticated' &&
    value.mode !== 'anonymous' &&
    value.mode !== 'local'
  ) {
    return null;
  }

  return {
    token: value.token,
    userId: value.userId,
    userName: value.userName,
    workspaceId: value.workspaceId,
    workspaceName: value.workspaceName,
    mode: value.mode,
    isAnonymous: Boolean(value.isAnonymous ?? value.mode === 'anonymous'),
    isLocalOnly: Boolean(value.isLocalOnly ?? value.mode === 'local'),
  };
}

export function isLocalSession(session: DemoSession): boolean {
  return session.mode === 'local' || session.isLocalOnly;
}

export function isAnonymousSession(session: DemoSession): boolean {
  return session.mode === 'anonymous' || session.isAnonymous;
}

export function isAuthenticatedSession(session: DemoSession): boolean {
  return session.mode === 'authenticated' && !session.isAnonymous && !session.isLocalOnly;
}

export function canUseWorkspaceServerApis(session: DemoSession | null | undefined): session is DemoSession {
  return Boolean(session && isAuthenticatedSession(session));
}

function localReportStorageKey(reportId: string): string {
  return `${LOCAL_REPORT_KEY_PREFIX}${reportId}`;
}

function generatedReportSnapshotStorageKey(reportId: string): string {
  return `${GENERATED_REPORT_SNAPSHOT_KEY_PREFIX}${reportId}`;
}

function readGeneratedReportSnapshotIndex(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(GENERATED_REPORT_SNAPSHOT_INDEX_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

function writeGeneratedReportSnapshotIndex(reportIds: string[]): void {
  if (!isBrowser()) {
    return;
  }

  const normalized = Array.from(new Set(reportIds.map((item) => item.trim()).filter(Boolean)));
  if (normalized.length === 0) {
    window.sessionStorage.removeItem(GENERATED_REPORT_SNAPSHOT_INDEX_KEY);
    return;
  }

  window.sessionStorage.setItem(
    GENERATED_REPORT_SNAPSHOT_INDEX_KEY,
    JSON.stringify(normalized),
  );
}

function upsertGeneratedReportSnapshotIndex(reportId: string): void {
  const current = readGeneratedReportSnapshotIndex();
  writeGeneratedReportSnapshotIndex([reportId, ...current.filter((item) => item !== reportId)]);
}

function removeGeneratedReportSnapshotFromIndex(reportId: string): void {
  writeGeneratedReportSnapshotIndex(
    readGeneratedReportSnapshotIndex().filter((item) => item !== reportId),
  );
}

function writeLastGeneratedReportSession(session: DemoSession): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(
    GENERATED_REPORT_LAST_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function readLastGeneratedReportSession(): DemoSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(GENERATED_REPORT_LAST_SESSION_KEY);
    if (!raw) {
      return null;
    }

    return normalizeDemoSession(JSON.parse(raw) as Partial<DemoSession>);
  } catch {
    return null;
  }
}

function createLocalSession(): DemoSession {
  return {
    token: 'local-session',
    userId: LOCAL_USER_ID,
    userName: LOCAL_USER_NAME,
    workspaceId: LOCAL_WORKSPACE_ID,
    workspaceName: LOCAL_WORKSPACE_NAME,
    mode: 'local',
    isAnonymous: false,
    isLocalOnly: true,
  };
}

function readCachedSession(): DemoSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw === cachedSessionStorageRaw) {
      return cachedSessionSnapshot ?? null;
    }
    cachedSessionStorageRaw = raw;
    cachedSessionSnapshot = raw
      ? normalizeDemoSession(JSON.parse(raw) as Partial<DemoSession>)
      : null;
    return cachedSessionSnapshot ?? null;
  } catch {
    cachedSessionStorageRaw = null;
    cachedSessionSnapshot = null;
    return null;
  }
}

export function peekCachedSession(): DemoSession | null {
  return readCachedSession();
}

function notifySessionSnapshotChanged() {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(SESSION_STORE_EVENT));
}

export function subscribeCachedSession(
  onStoreChange: () => void,
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleCustomChange = () => {
    onStoreChange();
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key && event.key !== SESSION_STORAGE_KEY) {
      return;
    }
    cachedSessionStorageRaw = undefined;
    cachedSessionSnapshot = undefined;
    onStoreChange();
  };

  window.addEventListener(SESSION_STORE_EVENT, handleCustomChange);
  window.addEventListener('storage', handleStorageChange);
  return () => {
    window.removeEventListener(SESSION_STORE_EVENT, handleCustomChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}

function writeCachedSession(session: DemoSession): void {
  if (!isBrowser()) {
    return;
  }

  const raw = JSON.stringify(session);
  window.localStorage.setItem(SESSION_STORAGE_KEY, raw);
  cachedSessionStorageRaw = raw;
  cachedSessionSnapshot = session;
  if (session.mode === 'local') {
    clearSafetyAuthToken();
    notifySessionSnapshotChanged();
    return;
  }

  writeSafetyAuthToken(session.token);
  notifySessionSnapshotChanged();
}

function clearCachedSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  cachedSessionStorageRaw = null;
  cachedSessionSnapshot = null;
  clearSafetyAuthToken();
  notifySessionSnapshotChanged();
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: unknown; error?: unknown }
      | null;
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
    if (typeof payload?.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  }

  const text = await response.text().catch(() => '');
  return text || response.statusText || '요청 처리에 실패했습니다.';
}

async function requestJson<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH';
    token?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: options.method ?? 'GET',
    cache: 'no-store',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}

function normalizeExports(value: unknown): ReportExportRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const source = item as Record<string, unknown>;
    const format = source.format === 'pdf' ? 'pdf' : source.format === 'hwpx' ? 'hwpx' : null;
    if (!format) {
      return [];
    }
    return [
      {
        id: typeof source.id === 'string' ? source.id : '',
        report_id: typeof source.report_id === 'string' ? source.report_id : '',
        format,
        first_charge_applied: Boolean(source.first_charge_applied),
        created_at: typeof source.created_at === 'string' ? source.created_at : '',
      },
    ];
  });
}

function buildGuidedBucketDefaults(): ReportPayload['photoStepBuckets'] {
  return [
    {
      step: 'step1_overview',
      title: '현재 공정 또는 현장 전경',
      description: '현재 공정이나 현장 전경을 보여주는 필수 사진 1장입니다.',
      minRequired: 1,
      recommendedCount: 1,
      bucketRole: 'current_process_photo',
      uploadedPhotoIds: [],
      representativePhotoId: null,
      status: 'pending',
    },
    {
      step: 'step2_hazard',
      title: '현재 위험요인',
      description: '현재 위험요인이나 기인물을 보여주는 필수 사진 1장입니다.',
      minRequired: 1,
      recommendedCount: 1,
      bucketRole: 'current_hazard_photo',
      uploadedPhotoIds: [],
      representativePhotoId: null,
      status: 'pending',
    },
    {
      step: 'step3_followup',
      title: '이전 지적사항 확인',
      description: '이전 기술지도 지적사항 이행 여부를 확인할 선택 사진입니다.',
      minRequired: 0,
      recommendedCount: 1,
      bucketRole: 'previous_guidance_check_photo',
      uploadedPhotoIds: [],
      representativePhotoId: null,
      status: 'skipped',
    },
    {
      step: 'step4_support',
      title: '교육 및 지원활동',
      description: '교육이나 지원활동이 있으면 선택 사진으로 추가합니다.',
      minRequired: 0,
      recommendedCount: 1,
      bucketRole: 'education_support_photo',
      uploadedPhotoIds: [],
      representativePhotoId: null,
      status: 'skipped',
    },
    {
      step: 'step5_site_overview',
      title: '추가 현장 전경',
      description: '현장 전경을 보강할 추가 선택 사진입니다.',
      minRequired: 0,
      recommendedCount: 1,
      bucketRole: 'site_overview_photo',
      uploadedPhotoIds: [],
      representativePhotoId: null,
      status: 'skipped',
    },
  ];
}

function normalizeGuidedPayload(payload: ReportPayload): ReportPayload {
  const defaults = buildGuidedBucketDefaults();
  const existingByStep = new Map(payload.photoStepBuckets.map((bucket) => [bucket.step, bucket]));
  const photoStepBuckets = defaults.map((bucket) => {
    const existing = existingByStep.get(bucket.step);
    return {
      ...bucket,
      uploadedPhotoIds: existing?.uploadedPhotoIds ?? [],
      representativePhotoId: existing?.representativePhotoId ?? null,
      status: existing?.status ?? bucket.status,
    };
  });
  const step1 = photoStepBuckets.find((bucket) => bucket.step === 'step1_overview');
  const step2 = photoStepBuckets.find((bucket) => bucket.step === 'step2_hazard');
  const step1Ready = (step1?.uploadedPhotoIds.length ?? 0) >= Number(step1?.minRequired ?? 0);
  const step2Ready = (step2?.uploadedPhotoIds.length ?? 0) >= Number(step2?.minRequired ?? 0);

  return reportPayloadSchema.parse({
    ...payload,
    photoStepBuckets,
    photoChecklistStatus: {
      step1OverviewComplete: step1Ready,
      step2HazardComplete: step2Ready,
      reviewReady: step1Ready && step2Ready,
      minimumSatisfied: step1Ready && step2Ready,
    },
  });
}

function buildMinimumPhotoWarning(step1Count: number, step2Count: number): string | null {
  if (step1Count === 0 && step2Count > 0) {
    return '현재 공정 또는 현장 전경 사진 1장을 함께 올리면 초안 정확도가 높아집니다.';
  }
  if (step2Count === 0 && step1Count > 0) {
    return '현재 위험요인 사진 1장을 함께 올리면 초안 정확도가 높아집니다.';
  }
  return null;
}

function normalizeReportRecord(value: unknown, sessionMode?: SessionMode): ReportRecord {
  const source = (value ?? {}) as Record<string, unknown>;
  const payload = normalizeGuidedPayload(reportPayloadSchema.parse(source.payload ?? {}));
  const localOnly =
    Boolean(source.localOnly) ||
    isLocalReportId(typeof source.id === 'string' ? source.id : payload.id);

  return {
    id: typeof source.id === 'string' ? source.id : payload.id,
    workspace_id:
      typeof source.workspace_id === 'string' ? source.workspace_id : payload.workspaceId,
    created_by: typeof source.created_by === 'string' ? source.created_by : '',
    site_id: typeof source.site_id === 'string' ? source.site_id : null,
    headquarter_id: typeof source.headquarter_id === 'string' ? source.headquarter_id : null,
    status: payload.status,
    payload,
    review_completed: Boolean(source.review_completed),
    final_export_consumed: Boolean(source.final_export_consumed),
    created_at: typeof source.created_at === 'string' ? source.created_at : payload.createdAt,
    updated_at: typeof source.updated_at === 'string' ? source.updated_at : payload.updatedAt,
    exports: normalizeExports(source.exports),
    creditBalance: typeof source.creditBalance === 'number' ? source.creditBalance : undefined,
    exportDisclaimerAccepted: Boolean(source.exportDisclaimerAccepted),
    exportDisclaimerAcceptance:
      source.exportDisclaimerAcceptance && typeof source.exportDisclaimerAcceptance === 'object'
        ? {
            id:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).id === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).id as string)
                : '',
            workspace_id:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).workspace_id === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).workspace_id as string)
                : '',
            user_id:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).user_id === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).user_id as string)
                : '',
            accepted_by_name:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).accepted_by_name === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).accepted_by_name as string)
                : '',
            version:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).version === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).version as string)
                : '',
            accepted_at:
              typeof (source.exportDisclaimerAcceptance as Record<string, unknown>).accepted_at === 'string'
                ? ((source.exportDisclaimerAcceptance as Record<string, unknown>).accepted_at as string)
                : '',
          }
        : null,
    sessionMode,
    localOnly,
  };
}

function sortReports(records: ReportRecord[]): ReportRecord[] {
  return [...records].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

async function resolveWorkspace(
  token: string,
  preferredWorkspaceId?: string,
  desiredWorkspaceName = DEFAULT_WORKSPACE_NAME,
): Promise<WorkspaceMembershipResponse> {
  const workspaces = await requestJson<WorkspaceMembershipResponse[]>('/workspaces/me', {
    token,
  });
  const matched =
    (preferredWorkspaceId
      ? workspaces.find((item) => item.workspace.id === preferredWorkspaceId)
      : null) ?? workspaces[0];

  if (matched) {
    return matched;
  }

  return requestJson<WorkspaceMembershipResponse>('/workspaces', {
    method: 'POST',
    token,
    body: {
      name: desiredWorkspaceName,
    },
  });
}

async function verifyCachedSession(session: DemoSession): Promise<DemoSession | null> {
  if (session.mode === 'local') {
    return null;
  }

  try {
    const currentUser = await requestJson<{ id: string; name: string; is_anonymous?: boolean }>(
      '/auth/me',
      { token: session.token },
    );
    const workspace = await resolveWorkspace(
      session.token,
      session.workspaceId,
      session.workspaceName || DEFAULT_WORKSPACE_NAME,
    );
    const nextSession: DemoSession = {
      token: session.token,
      userId: currentUser.id,
      userName: currentUser.name,
      workspaceId: workspace.workspace.id,
      workspaceName: workspace.workspace.name,
      mode: currentUser.is_anonymous ? 'anonymous' : 'authenticated',
      isAnonymous: Boolean(currentUser.is_anonymous),
      isLocalOnly: false,
    };
    writeCachedSession(nextSession);
    return nextSession;
  } catch {
    clearCachedSession();
    return null;
  }
}

async function issueAnonymousSession(): Promise<DemoSession> {
  const auth = await requestJson<AuthResponse>('/auth/anonymous', {
    method: 'POST',
  });
  const workspace = await resolveWorkspace(auth.token, undefined, '임시 보고서 작업공간');
  return {
    token: auth.token,
    userId: auth.user.id,
    userName: auth.user.name,
    workspaceId: workspace.workspace.id,
    workspaceName: workspace.workspace.name,
    mode: 'anonymous',
    isAnonymous: true,
    isLocalOnly: false,
  };
}

export async function bootstrapDemoSession(
  options: { preferredSession?: DemoSession | null } = {},
): Promise<DemoSession> {
  const preferredSession = options.preferredSession ?? null;
  if (preferredSession?.mode === 'local') {
    writeCachedSession(preferredSession);
    return preferredSession;
  }

  if (preferredSession && preferredSession.mode !== 'local') {
    const verifiedPreferred = await verifyCachedSession(preferredSession);
    if (verifiedPreferred) {
      return verifiedPreferred;
    }
  }

  const cached = readCachedSession();
  if (cached && cached.mode !== 'local') {
    const verified = await verifyCachedSession(cached);
    if (verified) {
      return verified;
    }
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const anonymousSession = await issueAnonymousSession();
      writeCachedSession(anonymousSession);
      return anonymousSession;
    } catch {
      const fallback = cached?.mode === 'local' ? cached : createLocalSession();
      writeCachedSession(fallback);
      return fallback;
    }
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

export function writeGeneratedReportSnapshot(
  reportId: string,
  session: DemoSession,
  record: ReportRecord,
): void {
  if (!isBrowser()) {
    return;
  }

  const payload: GeneratedReportSnapshotPayload = {
    expiresAt: Date.now() + GENERATED_REPORT_SNAPSHOT_TTL_MS,
    record,
    session,
    storedAt: Date.now(),
  };
  window.sessionStorage.setItem(
    generatedReportSnapshotStorageKey(reportId),
    JSON.stringify(payload),
  );
  upsertGeneratedReportSnapshotIndex(reportId);
  writeLastGeneratedReportSession(session);
  writeCachedSession(session);
}

export function readGeneratedReportSnapshot(
  reportId: string,
): { record: ReportRecord; session: DemoSession } | null {
  if (!isBrowser()) {
    return null;
  }

  const storageKey = generatedReportSnapshotStorageKey(reportId);
  const raw = window.sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const payload = JSON.parse(raw) as Partial<GeneratedReportSnapshotPayload>;
    if (typeof payload.expiresAt !== 'number' || payload.expiresAt < Date.now()) {
      clearGeneratedReportSnapshot(reportId);
      return null;
    }

    const session = normalizeDemoSession(payload.session);
    if (!session) {
      clearGeneratedReportSnapshot(reportId);
      return null;
    }

    return {
      record: normalizeReportRecord(payload.record, session.mode),
      session,
    };
  } catch {
    clearGeneratedReportSnapshot(reportId);
    return null;
  }
}

export function clearGeneratedReportSnapshot(reportId: string): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(generatedReportSnapshotStorageKey(reportId));
  removeGeneratedReportSnapshotFromIndex(reportId);
}

export function hasGeneratedReportSnapshot(reportId: string): boolean {
  return Boolean(readGeneratedReportSnapshot(reportId));
}

export function readGeneratedReportSnapshots(): Array<{
  record: ReportRecord;
  session: DemoSession;
}> {
  return readGeneratedReportSnapshotIndex()
    .map((reportId) => readGeneratedReportSnapshot(reportId))
    .flatMap((snapshot) => (snapshot ? [snapshot] : []));
}

function buildLocalReviewQueue(
  hasPhotos: boolean,
  step1Count = 0,
  step2Count = 0,
): ReportPayload['reviewMeta']['reviewQueue'] {
  const buildItem = (
    fieldPath: string,
    label: string,
    source: ReportPayload['reviewMeta']['reviewQueue'][number]['source'],
    confidence: number,
    notes: string,
    options: Partial<ReportPayload['reviewMeta']['reviewQueue'][number]> = {},
  ): ReportPayload['reviewMeta']['reviewQueue'][number] => ({
    id: `rq-${fieldPath.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'}`,
    section:
      fieldPath.startsWith('reportMeta.')
        ? fieldPath === 'reportMeta.notificationMethod'
          ? 'dispatch'
          : 'reportMeta'
        : fieldPath.startsWith('photoObservations[')
          ? 'photoObservations'
          : 'other',
    field: fieldPath.split('.').at(-1) ?? fieldPath,
    fieldPath,
    label,
    currentValue: '',
    suggestedValue: '',
    source,
    confidence,
    reason: notes,
    severity: 'warning',
    needsReview: true,
    status: 'pending',
    evidencePhotoIds: [],
    resolved: false,
    notes,
    ...options,
  });
  const reviewQueue: ReportPayload['reviewMeta']['reviewQueue'] = [
    buildItem(
      'aiMeta.lastRunStatus',
      '로컬 임시 작성 모드',
      'USER_INPUT',
      1,
      hasPhotos
        ? '서버 연결 후 AI 분석과 문안 보강이 가능합니다.'
        : '사진과 함께 서버 연결 후 AI 보강이 가능합니다.',
      { severity: 'info', source: 'USER_INPUT' },
    ),
    buildItem(
      'reportMeta.progressRate',
      '공정률',
      'DATA',
      0.1,
      '행정 필수값이 비어 있어 사용자 확인이 필요합니다.',
      { section: 'reportMeta', field: 'progressRate', severity: 'required' },
    ),
    buildItem(
      'reportMeta.previousImplementationStatus',
      '이전 기술지도 이행여부',
      'USER_INPUT',
      0.1,
      '이전 기술지도 이행여부는 사용자가 최종 확정해야 합니다.',
      { section: 'reportMeta', field: 'previousImplementationStatus', severity: 'required' },
    ),
    buildItem(
      'reportMeta.notificationMethod',
      '통보방법',
      'USER_INPUT',
      0.1,
      '통보방법은 사용자가 선택해야 합니다.',
      { section: 'dispatch', field: 'notificationMethod', severity: 'required' },
    ),
  ];
  const warning = buildMinimumPhotoWarning(step1Count, step2Count);
  if (warning) {
    reviewQueue.push(
      buildItem(
        step1Count === 0 ? 'photoStepBuckets.step1_overview' : 'photoStepBuckets.step2_hazard',
        step1Count === 0 ? '현재 공정 또는 현장 전경 사진 보강' : '현재 위험요인 사진 보강',
        'AI_PHOTO',
        0.35,
        warning,
      ),
    );
  }
  return reviewQueue;
}

function mergeLocalReviewQueue(
  existingQueue: ReportPayload['reviewMeta']['reviewQueue'],
  nextQueue: ReportPayload['reviewMeta']['reviewQueue'],
): ReportPayload['reviewMeta']['reviewQueue'] {
  const existingByPath = new Map(existingQueue.map((item) => [item.fieldPath, item]));
  return nextQueue.map((item) => {
    const existing = existingByPath.get(item.fieldPath);
    if (!existing) {
      return item;
    }
    if (existing.resolved || existing.status === 'reviewed' || existing.status === 'confirmed') {
      return {
        ...item,
        id: existing.id || item.id,
        currentValue: existing.currentValue ?? existing.value ?? item.currentValue,
        value: existing.currentValue ?? existing.value ?? item.value,
        resolved: true,
        needsReview: false,
        status: existing.status === 'confirmed' ? 'confirmed' : 'reviewed',
      };
    }
    return {
      ...item,
      id: existing.id || item.id,
    };
  });
}

function buildLocalBasePayload(
  session: DemoSession,
  reportId: string,
  input: Omit<CreateReportInput, 'workspace_id'>,
): ReportPayload {
  const now = new Date().toISOString();
  const base = buildDemoReport('demo-review-empty');

  return reportPayloadSchema.parse({
    ...base,
    id: reportId,
    workspaceId: session.workspaceId,
    status: 'draft_ready',
    currentSection: 'doc1',
    wizardStep: 'workspace',
    workspaceEntryMode: 'direct_reopen',
    doc3PhotoCandidates: [],
    doc7PhotoCandidates: [],
    photoChecklistStatus: {
      step1OverviewComplete: false,
      step2HazardComplete: false,
      reviewReady: false,
      minimumSatisfied: false,
    },
    reportMeta: {
      ...base.reportMeta,
      workspaceName: session.workspaceName,
      siteName: input.site_name,
      customerName: input.customer_name,
      visitDate: input.visit_date,
      drafterName: input.drafter_name,
      progressRate: input.progress_rate,
      processSummary: input.process_summary,
      workerCount: input.worker_count,
    },
    reviewMeta: {
      ...base.reviewMeta,
      reviewCompleted: false,
      reviewCompletedAt: null,
      responsibilityConfirmed: false,
      reviewQueue: buildLocalReviewQueue(false),
    },
    aiMeta: {
      ...base.aiMeta,
      lastRunId: null,
      lastRunStatus: 'failed',
      generatedAt: null,
      sourceMix: ['manual'],
    },
    photoEvidence: [],
    photoObservations: [],
    findingCandidates: [],
    sectionDrafts: {
      ...base.sectionDrafts,
      doc5: {
        ...base.sectionDrafts.doc5,
        progressOverview: input.process_summary,
      },
      doc7: [],
      doc8: [],
      doc11: base.sectionDrafts.doc11,
      doc12: base.sectionDrafts.doc12,
      doc13: [],
      doc14: {
        title: '기타 메모',
        body: '현재 로컬 임시 작성 모드입니다. 서버 연결 후 AI 보강이 가능합니다.',
        confidence: 0,
      },
    },
    validationResult: {
      valid: false,
      blockingIssues: [],
      warnings: ['현재 로컬 임시 작성 모드입니다. 서버 연결 후 AI 보강이 가능합니다.'],
      reviewedFieldPaths: [],
    },
    fieldProvenance: [],
    createdAt: now,
    updatedAt: now,
  });
}

function annotateLocalRecord(record: ReportRecord): ReportRecord {
  return {
    ...record,
    sessionMode: 'local',
    localOnly: true,
  };
}

async function readLocalReportIndex(): Promise<LocalReportIndexEntry[]> {
  const stored = await readPersistedValue<LocalReportIndexEntry[]>(LOCAL_REPORTS_INDEX_KEY);
  return Array.isArray(stored) ? stored : [];
}

async function writeLocalReportIndex(entries: LocalReportIndexEntry[]): Promise<void> {
  await writePersistedValue(LOCAL_REPORTS_INDEX_KEY, entries);
}

async function persistLocalReportRecord(record: ReportRecord): Promise<ReportRecord> {
  const normalized = annotateLocalRecord(normalizeReportRecord(record, 'local'));
  await writePersistedValue(localReportStorageKey(normalized.id), normalized);

  const nextEntry: LocalReportIndexEntry = {
    id: normalized.id,
    title: normalized.payload.reportMeta.siteName || '기술지도 보고서',
    customerName: normalized.payload.reportMeta.customerName || '',
    visitDate: normalized.payload.reportMeta.visitDate || '',
    updatedAt: normalized.updated_at,
  };

  const currentIndex = await readLocalReportIndex();
  const nextIndex = [
    nextEntry,
    ...currentIndex.filter((entry) => entry.id !== normalized.id),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  await writeLocalReportIndex(nextIndex);
  return normalized;
}

async function readLocalReportRecord(reportId: string): Promise<ReportRecord | null> {
  const stored = await readPersistedValue<ReportRecord>(localReportStorageKey(reportId));
  if (!stored) {
    return null;
  }
  return annotateLocalRecord(normalizeReportRecord(stored, 'local'));
}

async function deleteLocalReportRecord(reportId: string): Promise<void> {
  await deletePersistedValue(localReportStorageKey(reportId));
  const currentIndex = await readLocalReportIndex();
  await writeLocalReportIndex(currentIndex.filter((entry) => entry.id !== reportId));
}

async function listLocalReports(): Promise<ReportRecord[]> {
  const entries = await readLocalReportIndex();
  const reports = await Promise.all(entries.map((entry) => readLocalReportRecord(entry.id)));
  return sortReports(reports.filter((item): item is ReportRecord => Boolean(item)));
}

function createLocalReportRecordObject(
  session: DemoSession,
  input: Omit<CreateReportInput, 'workspace_id'>,
): ReportRecord {
  const reportId = createRandomId('local-report');
  const payload = buildLocalBasePayload(session, reportId, input);

  return annotateLocalRecord({
    id: reportId,
    workspace_id: session.workspaceId,
    created_by: session.userId,
    site_id: input.site_id,
    headquarter_id: null,
    status: payload.status,
    payload,
    review_completed: false,
    final_export_consumed: false,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt,
    exports: [],
    exportDisclaimerAccepted: false,
    exportDisclaimerAcceptance: null,
    creditBalance: 0,
    sessionMode: 'local',
    localOnly: true,
  });
}

function normalizeStepCategory(
  kind: string | null | undefined,
  step: GuidedUploadStepKey,
): ReportPayload['photoEvidence'][number]['category'] {
  if (kind === 'site_overview' || kind === 'process') {
    return kind;
  }
  if (kind === 'followup') {
    return 'followup';
  }
  if (kind === 'measurement' || kind === 'education' || kind === 'activity') {
    return kind;
  }
  if (step === 'step-3') {
    return 'followup';
  }
  if (step === 'step-4') {
    return 'education';
  }
  return step === 'step-1' || step === 'step-5' ? 'site_overview' : 'hazard';
}

function buildLocalPhotoEvidence(
  photo: GuidedPhotoStepUploadInput['photos'][number],
  step: GuidedUploadStepKey,
): ReportPayload['photoEvidence'][number] {
  const category = normalizeStepCategory(photo.category ?? undefined, step);
  const sourceStep =
    step === 'step-1'
      ? 'step1_overview'
      : step === 'step-2'
        ? 'step2_hazard'
        : step === 'step-3'
          ? 'step3_followup'
          : step === 'step-4'
            ? 'step4_support'
            : 'step5_site_overview';
  const processType =
    step === 'step-1'
      ? '현재 공정 또는 현장 전경'
      : step === 'step-2'
        ? '현재 위험요인'
        : step === 'step-3'
          ? '이전 지적사항 확인'
          : step === 'step-4'
            ? '교육 및 지원활동'
            : '추가 현장 전경';
  return {
    photoAssetId: createRandomId('local-photo'),
    category,
    sourceStep,
    filename: photo.filename,
    imageUrl: photo.data_url,
    aiCategorySuggestion: category,
    aiCategoryConfidence: 0,
    aiCategoryReason: '로컬 임시 업로드',
    sceneType: '',
    processType,
    locationHint: photo.location_hint,
    ppeSignals: [],
    hazardSignals: [],
    accidentTypeCandidates: [],
    causativeAgentCandidates: [],
    measurementContext: '',
    educationContext: '',
    activityContext: '',
    confidence: 0,
    notes: '서버 연결 후 AI 분석 가능',
  };
}

function syncLocalGuidedState(payload: ReportPayload): ReportPayload {
  return normalizeGuidedPayload(payload);
}

function finalizeLocalDraftRecord(
  record: ReportRecord,
  entryMode: ReportPayload['workspaceEntryMode'],
): ReportRecord {
  const now = new Date().toISOString();
  const hasPhotos = record.payload.photoEvidence.length > 0;
  const step1Count = record.payload.doc3PhotoCandidates.length;
  const step2Count = record.payload.doc7PhotoCandidates.length;
  const minimumPhotoWarning = buildMinimumPhotoWarning(step1Count, step2Count);

  const payload = reportPayloadSchema.parse({
    ...record.payload,
    status: 'draft_ready',
    currentSection: 'doc1',
    wizardStep: 'workspace',
    workspaceEntryMode: entryMode,
    reviewMeta: {
      ...record.payload.reviewMeta,
      reviewQueue: mergeLocalReviewQueue(
        record.payload.reviewMeta.reviewQueue,
        buildLocalReviewQueue(hasPhotos, step1Count, step2Count),
      ),
    },
    aiMeta: {
      ...record.payload.aiMeta,
      lastRunId: null,
      lastRunStatus: 'failed',
      generatedAt: null,
      sourceMix: ['manual'],
    },
    validationResult: {
      ...record.payload.validationResult,
      warnings: Array.from(
        new Set([
          ...(record.payload.validationResult.warnings ?? []),
          ...(minimumPhotoWarning ? [minimumPhotoWarning] : []),
          '현재 로컬 임시 작성 모드입니다. 서버 연결 후 AI 보강이 가능합니다.',
        ]),
      ),
    },
    updatedAt: now,
  });

  return annotateLocalRecord({
    ...record,
    status: payload.status,
    payload,
    updated_at: now,
  });
}

function buildAuthenticatedSession(
  auth: AuthResponse,
  workspace: WorkspaceMembershipResponse,
): DemoSession {
  const isAnonymous = Boolean(auth.user.is_anonymous);
  return {
    token: auth.token,
    userId: auth.user.id,
    userName: auth.user.name,
    workspaceId: workspace.workspace.id,
    workspaceName: workspace.workspace.name,
    mode: isAnonymous ? 'anonymous' : 'authenticated',
    isAnonymous,
    isLocalOnly: false,
  };
}

async function createAuthenticatedSessionFromAuth(
  auth: AuthResponse,
  desiredWorkspaceName = DEFAULT_WORKSPACE_NAME,
): Promise<DemoSession> {
  const workspace = await resolveWorkspace(auth.token, undefined, desiredWorkspaceName);
  const session = buildAuthenticatedSession(auth, workspace);
  writeCachedSession(session);
  return session;
}

function convertLocalPayloadForServer(
  localRecord: ReportRecord,
  serverReport: ReportRecord,
  session: DemoSession,
): ReportPayload {
  const now = new Date().toISOString();
  const currentSection =
    localRecord.payload.currentSection.startsWith('doc')
      ? localRecord.payload.currentSection
      : 'doc1';

  return reportPayloadSchema.parse({
    ...localRecord.payload,
    id: serverReport.id,
    workspaceId: session.workspaceId,
    currentSection,
    wizardStep: 'workspace',
    reportMeta: {
      ...localRecord.payload.reportMeta,
      workspaceName: session.workspaceName,
    },
    createdAt: serverReport.payload.createdAt || localRecord.payload.createdAt,
    updatedAt: now,
  });
}

export async function fetchCreditBalance(session: DemoSession): Promise<number> {
  if (!canUseWorkspaceServerApis(session)) {
    return 0;
  }

  const response = await requestJson<{ balance: number }>(
    `/credits/balance?workspace_id=${encodeURIComponent(session.workspaceId)}`,
    {
      token: session.token,
    },
  );
  return response.balance;
}

export async function fetchCreditLedger(session: DemoSession): Promise<CreditLedgerEntry[]> {
  if (!canUseWorkspaceServerApis(session)) {
    return [];
  }

  return requestJson<CreditLedgerEntry[]>(
    `/credits/ledger?workspace_id=${encodeURIComponent(session.workspaceId)}`,
    {
      token: session.token,
    },
  );
}

export async function startBillingCheckout(
  session: DemoSession,
  packageId: 'starter-10' | 'team-30' | 'agency-100',
): Promise<BillingCheckoutResponse> {
  if (!isAuthenticatedSession(session)) {
    throw new Error('크레딧 결제는 로그인 후 사용할 수 있습니다.');
  }

  return requestJson<BillingCheckoutResponse>('/billing/checkout', {
    method: 'POST',
    token: session.token,
    body: {
      package_id: packageId,
      workspace_id: session.workspaceId,
    },
  });
}

export async function confirmBillingPayment(
  session: DemoSession,
  input: { amount: number; orderId: string; paymentKey: string },
): Promise<{ balance: number }> {
  if (!isAuthenticatedSession(session)) {
    throw new Error('결제 확인은 로그인 후 사용할 수 있습니다.');
  }

  return requestJson<{ balance: number }>('/billing/confirm', {
    method: 'POST',
    token: session.token,
    body: {
      amount: input.amount,
      order_id: input.orderId,
      payment_key: input.paymentKey,
    },
  });
}

export async function listReports(session: DemoSession): Promise<ReportRecord[]> {
  const localReports = await listLocalReports();
  const generatedSnapshots = readGeneratedReportSnapshots().map((item) => item.record);
  if (!canUseWorkspaceServerApis(session)) {
    return sortReports(
      Array.from(
        new Map(
          [...localReports, ...generatedSnapshots].map((report) => [report.id, report] as const),
        ).values(),
      ),
    );
  }

  const response = await requestJson<unknown[]>(
    `/reports?workspace_id=${encodeURIComponent(session.workspaceId)}`,
    {
      token: session.token,
    },
  );
  const serverReports = response.map((item) => normalizeReportRecord(item, session.mode));
  const merged = new Map<string, ReportRecord>();
  for (const report of [...localReports, ...generatedSnapshots, ...serverReports]) {
    merged.set(report.id, report);
  }
  serverReports.forEach((report) => clearGeneratedReportSnapshot(report.id));
  return sortReports([...merged.values()]);
}

export async function getReportRecord(
  session: DemoSession,
  reportId: string,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId)) {
    const localReport = await readLocalReportRecord(reportId);
    if (!localReport) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    return localReport;
  }

  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}`, {
      token: session.token,
    }),
    session.mode,
  );
}

export async function createReportRecord(
  session: DemoSession,
  input: Omit<CreateReportInput, 'workspace_id'>,
): Promise<ReportRecord> {
  if (!canUseWorkspaceServerApis(session)) {
    const localRecord = createLocalReportRecordObject(session, input);
    return persistLocalReportRecord(localRecord);
  }

  return normalizeReportRecord(
    await requestJson('/reports', {
      method: 'POST',
      token: session.token,
      body: {
        ...input,
        workspace_id: session.workspaceId,
      } satisfies CreateReportInput,
    }),
    session.mode,
  );
}

export async function patchReportRecord(
  session: DemoSession,
  reportId: string,
  payload: ReportPayload,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId) || isLocalSession(session)) {
    const localRecord = await readLocalReportRecord(reportId);
    if (!localRecord) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    const updatedAt = new Date().toISOString();
    const nextPayload = reportPayloadSchema.parse({
      ...payload,
      id: reportId,
      workspaceId: session.workspaceId || LOCAL_WORKSPACE_ID,
      updatedAt,
    });
    return persistLocalReportRecord({
      ...localRecord,
      status: nextPayload.status,
      payload: nextPayload,
      updated_at: updatedAt,
    });
  }

  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      token: session.token,
      body: { payload },
    }),
    session.mode,
  );
}

export async function uploadGuidedStepPhotos(
  session: DemoSession,
  reportId: string,
  step: GuidedUploadStepKey,
  payload: GuidedPhotoStepUploadInput,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId) || !canUseWorkspaceServerApis(session)) {
    const localRecord = await readLocalReportRecord(reportId);
    if (!localRecord) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    const bucketStep =
      step === 'step-1'
        ? 'step1_overview'
        : step === 'step-2'
          ? 'step2_hazard'
          : step === 'step-3'
            ? 'step3_followup'
            : step === 'step-4'
              ? 'step4_support'
              : 'step5_site_overview';
    const existingBucket =
      localRecord.payload.photoStepBuckets.find((bucket) => bucket.step === bucketStep) ??
      localRecord.payload.photoStepBuckets[0];
    const nextPhotos = payload.photos.map((item) => buildLocalPhotoEvidence(item, step));
    const uploadedIds = nextPhotos.map((item) => item.photoAssetId);
    const representativeId = existingBucket.representativePhotoId ?? uploadedIds[0] ?? null;
    const now = new Date().toISOString();

    const nextPayload = syncLocalGuidedState(
      reportPayloadSchema.parse({
        ...localRecord.payload,
        currentSection: step === 'step-1' ? 'photo-step-1' : 'photo-step-2',
        wizardStep: step === 'step-1' ? 'step1_overview' : 'step2_hazard',
        photoEvidence: [...localRecord.payload.photoEvidence, ...nextPhotos],
        doc3PhotoCandidates:
          step === 'step-1'
            ? [...localRecord.payload.doc3PhotoCandidates, ...uploadedIds]
            : localRecord.payload.doc3PhotoCandidates,
        doc7PhotoCandidates:
          step === 'step-2'
            ? [...localRecord.payload.doc7PhotoCandidates, ...uploadedIds]
            : localRecord.payload.doc7PhotoCandidates,
        photoStepBuckets: localRecord.payload.photoStepBuckets.map((bucket) =>
          bucket.step === bucketStep
            ? {
                ...bucket,
                uploadedPhotoIds: [...bucket.uploadedPhotoIds, ...uploadedIds],
                representativePhotoId: representativeId,
                status: uploadedIds.length > 0 ? 'ready' : bucket.status,
              }
            : bucket,
        ),
        updatedAt: now,
      }),
    );

    return persistLocalReportRecord({
      ...localRecord,
      payload: nextPayload,
      updated_at: now,
    });
  }

  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/photo-steps/${step}`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report, session.mode);
}

export async function generateDraftFromGuidedPhotos(
  session: DemoSession,
  reportId: string,
  payload: GenerateDraftFromGuidedPhotosInput,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId) || !canUseWorkspaceServerApis(session)) {
    const localRecord = await readLocalReportRecord(reportId);
    if (!localRecord) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    const nextRecord = finalizeLocalDraftRecord(
      {
        ...localRecord,
        payload: reportPayloadSchema.parse({
          ...localRecord.payload,
          doc3PhotoCandidates: payload.doc3_photo_ids,
          doc7PhotoCandidates: payload.doc7_photo_ids,
        }),
      },
      'guided_photo_flow',
    );
    return persistLocalReportRecord(nextRecord);
  }

  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/draft-from-guided-photos`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report, session.mode);
}

export async function generateDraftFromPhotos(
  session: DemoSession,
  reportId: string,
  payload: GenerateDraftFromPhotosInput,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId) || !canUseWorkspaceServerApis(session)) {
    const localRecord = await readLocalReportRecord(reportId);
    if (!localRecord) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    const photoIds = new Set(payload.photo_asset_ids);
    const nextRecord = finalizeLocalDraftRecord(
      {
        ...localRecord,
        payload: reportPayloadSchema.parse({
          ...localRecord.payload,
          doc3PhotoCandidates: localRecord.payload.doc3PhotoCandidates.filter((item) =>
            photoIds.has(item),
          ),
          doc7PhotoCandidates: localRecord.payload.doc7PhotoCandidates.filter((item) =>
            photoIds.has(item),
          ),
        }),
      },
      localRecord.payload.photoEvidence.length > 0 ? 'guided_photo_flow' : 'direct_reopen',
    );
    return persistLocalReportRecord(nextRecord);
  }

  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/draft-from-photos`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report, session.mode);
}

export async function markReportReviewComplete(
  session: DemoSession,
  reportId: string,
): Promise<ReportRecord> {
  if (isLocalReportId(reportId) || isLocalSession(session)) {
    const localRecord = await readLocalReportRecord(reportId);
    if (!localRecord) {
      throw new Error('로컬 보고서를 찾을 수 없습니다.');
    }
    const updatedAt = new Date().toISOString();
    const payload = reportPayloadSchema.parse({
      ...localRecord.payload,
      status: 'review_completed',
      reviewMeta: {
        ...localRecord.payload.reviewMeta,
        reviewCompleted: true,
        reviewCompletedAt: updatedAt,
        responsibilityConfirmed: true,
      },
      updatedAt,
    });
    return persistLocalReportRecord({
      ...localRecord,
      status: payload.status,
      payload,
      review_completed: true,
      updated_at: updatedAt,
    });
  }

  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}/review-complete`, {
      method: 'POST',
      token: session.token,
      body: {
        responsibility_confirmed: true,
      },
    }),
    session.mode,
  );
}

export async function registerReportExport(
  session: DemoSession,
  reportId: string,
  format: 'pdf' | 'hwpx',
  payload: ExportReportInput = {
    confirm_reviewed: true,
    acknowledge_ai_disclaimer: false,
    typed_signature_name: '',
  },
): Promise<ReportRecord> {
  if (!isAuthenticatedSession(session) || isLocalReportId(reportId)) {
    throw new Error('다운로드 전에 Google 로그인이 필요합니다.');
  }

  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/exports/${format}`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report?: unknown };

  if (!response.report) {
    return getReportRecord(session, reportId);
  }

  return normalizeReportRecord(response.report, session.mode);
}

export async function startGoogleWorkspaceAuth(
  redirectUri: string,
): Promise<GoogleWorkspaceAuthStartResponse> {
  return requestJson<GoogleWorkspaceAuthStartResponse>('/auth/google/start', {
    method: 'POST',
    body: {
      redirect_uri: redirectUri,
    },
  });
}

export async function completeGoogleWorkspaceAuth(input: {
  authCode: string;
  redirectUri: string;
  state: string;
}): Promise<DemoSession> {
  const auth = await requestJson<AuthResponse>('/auth/google/complete', {
    method: 'POST',
    body: {
      code: input.authCode,
      redirect_uri: input.redirectUri,
      state: input.state,
    },
  });
  return createAuthenticatedSessionFromAuth(auth);
}

export async function loginReportUser(email: string, password: string): Promise<DemoSession> {
  const auth = await requestJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return createAuthenticatedSessionFromAuth(auth);
}

export async function signupReportUser(
  name: string,
  email: string,
  password: string,
): Promise<DemoSession> {
  const auth = await requestJson<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  });
  return createAuthenticatedSessionFromAuth(auth, `${name || '사용자'} 작업공간`);
}

export async function claimAnonymousSession(
  session: DemoSession,
  anonymousToken: string,
): Promise<DemoSession> {
  if (!isAuthenticatedSession(session)) {
    throw new Error('Google 로그인 후 다시 시도해 주세요.');
  }

  const claimed = await requestJson<AnonymousClaimResponse>('/auth/claim-anonymous', {
    method: 'POST',
    token: session.token,
    body: {
      anonymous_token: anonymousToken,
    },
  });

  const nextSession: DemoSession = {
    ...session,
    workspaceId: claimed.workspace.id,
    workspaceName: claimed.workspace.name,
    mode: 'authenticated',
    isAnonymous: false,
    isLocalOnly: false,
  };
  writeCachedSession(nextSession);
  return nextSession;
}

export async function syncLocalReportToServer(
  session: DemoSession,
  localRecord: ReportRecord,
): Promise<ReportRecord> {
  if (!isAuthenticatedSession(session)) {
    throw new Error('Google 로그인 후 다시 시도해 주세요.');
  }
  if (!isLocalReportId(localRecord.id)) {
    return localRecord;
  }
  if (!localRecord.site_id) {
    throw new Error('현장 선택 정보가 없는 로컬 보고서는 다시 생성해 주세요.');
  }

  const created = await createReportRecord(session, {
    site_id: localRecord.site_id,
    site_name: localRecord.payload.reportMeta.siteName || '기술지도 보고서',
    customer_name: localRecord.payload.reportMeta.customerName || '고객사',
    visit_date:
      localRecord.payload.reportMeta.visitDate || new Date().toISOString().slice(0, 10),
    drafter_name: localRecord.payload.reportMeta.drafterName || session.userName,
    progress_rate: localRecord.payload.reportMeta.progressRate || '',
    process_summary: localRecord.payload.reportMeta.processSummary || '',
    worker_count: localRecord.payload.reportMeta.workerCount || '',
  });

  const serverPayload = convertLocalPayloadForServer(localRecord, created, session);
  const patched = await patchReportRecord(session, created.id, serverPayload);
  await deleteLocalReportRecord(localRecord.id);
  return patched;
}

export async function removeLocalReport(reportId: string): Promise<void> {
  if (!isLocalReportId(reportId)) {
    return;
  }
  await deleteLocalReportRecord(reportId);
}
