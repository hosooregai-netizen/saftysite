'use client';

import {
  type CreateReportInput,
  type ExportReportInput,
  type GenerateDraftFromGuidedPhotosInput,
  type GenerateDraftFromPhotosInput,
  type GuidedPhotoStepUploadInput,
  reportPayloadSchema,
  type ReportPayload,
} from '@saftysite/contracts';

const API_PREFIX = '/api/report-saas/v1';
const SESSION_STORAGE_KEY = 'saftysite-web-demo-session-v1';

const DEMO_ACCOUNT = {
  email: 'demo-web@saftysite.local',
  name: '웹 데모 사용자',
  password: 'SaftysiteDemo!2026',
  workspaceName: '웹 데모 워크스페이스',
} as const;

export type DemoSession = {
  token: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
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
  status: ReportPayload['status'];
  payload: ReportPayload;
  review_completed: boolean;
  final_export_consumed: boolean;
  created_at: string;
  updated_at: string;
  exports: ReportExportRecord[];
  creditBalance?: number;
};

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

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
  };
};

let bootstrapPromise: Promise<DemoSession> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readCachedSession(): DemoSession | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (
      !parsed.token ||
      !parsed.userId ||
      !parsed.userName ||
      !parsed.workspaceId ||
      !parsed.workspaceName
    ) {
      return null;
    }
    return {
      token: parsed.token,
      userId: parsed.userId,
      userName: parsed.userName,
      workspaceId: parsed.workspaceId,
      workspaceName: parsed.workspaceName,
    };
  } catch {
    return null;
  }
}

function writeCachedSession(session: DemoSession): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearCachedSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
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

function normalizeReportRecord(value: unknown): ReportRecord {
  const source = (value ?? {}) as Record<string, unknown>;
  const payload = reportPayloadSchema.parse(source.payload ?? {});

  return {
    id: typeof source.id === 'string' ? source.id : payload.id,
    workspace_id:
      typeof source.workspace_id === 'string' ? source.workspace_id : payload.workspaceId,
    created_by: typeof source.created_by === 'string' ? source.created_by : '',
    status: payload.status,
    payload,
    review_completed: Boolean(source.review_completed),
    final_export_consumed: Boolean(source.final_export_consumed),
    created_at: typeof source.created_at === 'string' ? source.created_at : payload.createdAt,
    updated_at: typeof source.updated_at === 'string' ? source.updated_at : payload.updatedAt,
    exports: normalizeExports(source.exports),
    creditBalance:
      typeof source.creditBalance === 'number' ? source.creditBalance : undefined,
  };
}

async function loginDemoAccount(): Promise<AuthResponse> {
  try {
    return await requestJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: {
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
      },
    });
  } catch {
    try {
      return await requestJson<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: {
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
          name: DEMO_ACCOUNT.name,
        },
      });
    } catch (error) {
      return requestJson<AuthResponse>('/auth/login', {
        method: 'POST',
        body: {
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
        },
      }).catch(() => {
        throw error;
      });
    }
  }
}

async function resolveWorkspace(token: string): Promise<WorkspaceMembershipResponse> {
  const workspaces = await requestJson<WorkspaceMembershipResponse[]>('/workspaces/me', {
    token,
  });
  const matched =
    workspaces.find((item) => item.workspace.name === DEMO_ACCOUNT.workspaceName) ??
    workspaces[0];

  if (matched) {
    return matched;
  }

  return requestJson<WorkspaceMembershipResponse>('/workspaces', {
    method: 'POST',
    token,
    body: {
      name: DEMO_ACCOUNT.workspaceName,
    },
  });
}

async function verifyCachedSession(session: DemoSession): Promise<DemoSession | null> {
  try {
    await requestJson('/auth/me', { token: session.token });
    const workspace = await resolveWorkspace(session.token);
    const nextSession = {
      ...session,
      workspaceId: workspace.workspace.id,
      workspaceName: workspace.workspace.name,
    };
    writeCachedSession(nextSession);
    return nextSession;
  } catch {
    clearCachedSession();
    return null;
  }
}

export async function bootstrapDemoSession(): Promise<DemoSession> {
  const cached = readCachedSession();
  if (cached) {
    const verified = await verifyCachedSession(cached);
    if (verified) {
      return verified;
    }
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const auth = await loginDemoAccount();
    const workspace = await resolveWorkspace(auth.token);
    const session: DemoSession = {
      token: auth.token,
      userId: auth.user.id,
      userName: auth.user.name,
      workspaceId: workspace.workspace.id,
      workspaceName: workspace.workspace.name,
    };
    writeCachedSession(session);
    return session;
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

export async function fetchCreditBalance(session: DemoSession): Promise<number> {
  const response = await requestJson<{ balance: number }>(
    `/credits/balance?workspace_id=${encodeURIComponent(session.workspaceId)}`,
    {
      token: session.token,
    },
  );
  return response.balance;
}

export async function listReports(session: DemoSession): Promise<ReportRecord[]> {
  const response = await requestJson<unknown[]>(
    `/reports?workspace_id=${encodeURIComponent(session.workspaceId)}`,
    {
      token: session.token,
    },
  );
  return response.map(normalizeReportRecord);
}

export async function getReportRecord(
  session: DemoSession,
  reportId: string,
): Promise<ReportRecord> {
  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}`, {
      token: session.token,
    }),
  );
}

export async function createReportRecord(
  session: DemoSession,
  input: Omit<CreateReportInput, 'workspace_id'>,
): Promise<ReportRecord> {
  return normalizeReportRecord(
    await requestJson('/reports', {
      method: 'POST',
      token: session.token,
      body: {
        ...input,
        workspace_id: session.workspaceId,
      } satisfies CreateReportInput,
    }),
  );
}

export async function patchReportRecord(
  session: DemoSession,
  reportId: string,
  payload: ReportPayload,
): Promise<ReportRecord> {
  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      token: session.token,
      body: { payload },
    }),
  );
}

export async function uploadGuidedStepPhotos(
  session: DemoSession,
  reportId: string,
  step: 'step-1' | 'step-2',
  payload: GuidedPhotoStepUploadInput,
): Promise<ReportRecord> {
  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/photo-steps/${step}`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report);
}

export async function generateDraftFromGuidedPhotos(
  session: DemoSession,
  reportId: string,
  payload: GenerateDraftFromGuidedPhotosInput,
): Promise<ReportRecord> {
  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/draft-from-guided-photos`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report);
}

export async function generateDraftFromPhotos(
  session: DemoSession,
  reportId: string,
  payload: GenerateDraftFromPhotosInput,
): Promise<ReportRecord> {
  const response = (await requestJson(
    `/reports/${encodeURIComponent(reportId)}/draft-from-photos`,
    {
      method: 'POST',
      token: session.token,
      body: payload,
    },
  )) as { report: unknown };

  return normalizeReportRecord(response.report);
}

export async function markReportReviewComplete(
  session: DemoSession,
  reportId: string,
): Promise<ReportRecord> {
  return normalizeReportRecord(
    await requestJson(`/reports/${encodeURIComponent(reportId)}/review-complete`, {
      method: 'POST',
      token: session.token,
      body: {
        responsibility_confirmed: true,
      },
    }),
  );
}

export async function registerReportExport(
  session: DemoSession,
  reportId: string,
  format: 'pdf' | 'hwpx',
  payload: ExportReportInput = { confirm_reviewed: true },
): Promise<ReportRecord> {
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

  return normalizeReportRecord(response.report);
}
