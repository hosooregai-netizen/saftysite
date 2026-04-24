import { performance } from 'node:perf_hooks';

type MailRecipient = {
  email: string;
  name: string | null;
};

type MailThreadRow = {
  id: string;
  lastMessageAt: string | null;
  subject: string;
};

type MailThreadDetail = {
  messages: Array<{
    deliveredAt: string | null;
    id: string;
    sentAt: string | null;
    subject: string;
    threadId: string;
  }>;
  thread: {
    id: string;
    lastMessageAt: string | null;
    subject: string;
  };
};

type MailMessage = {
  deliveredAt: string | null;
  id: string;
  sentAt: string | null;
  subject: string;
  threadId: string;
};

type SendResponse = {
  deliveredAt: string | null;
  id: string;
  sentAt: string | null;
  subject: string;
  threadId: string;
};

type CaseKind = 'plain' | 'report_high' | 'report_low';

type BenchCase = {
  body: string;
  kind: CaseKind;
  path: '/api/mail/send' | '/api/mail/send-report';
  payload: Record<string, unknown>;
  subject: string;
};

type BenchResult = {
  apiElapsedMs: number;
  caseKind: CaseKind;
  deliveredAt: string | null;
  messageDetailDeliveredAt: string | null;
  messageDetailSentAt: string | null;
  messageDetailVisibleMs: number | null;
  responseId: string;
  responseStatus: number;
  sentAt: string | null;
  sentListVisibleMs: number | null;
  subject: string;
  threadDetailVisibleMs: number | null;
  threadId: string;
  threadLastMessageAt: string | null;
};

type LoginPayload = {
  access_token?: string;
};

type ThreadsPayload = {
  rows?: MailThreadRow[];
  total?: number;
};

const DEFAULT_BASE_URL = 'https://saftysite-seven.vercel.app';
const DEFAULT_LOW_REPORT_KEY = 'legacy:technical_guidance:394606';
const DEFAULT_HIGH_REPORT_KEY = 'legacy:technical_guidance:440160';
const DEFAULT_LOW_RUNS = 3;
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_SENT_POLL_TIMEOUT_MS = 60_000;
const DEFAULT_DETAIL_POLL_TIMEOUT_MS = 30_000;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function readEnvNumber(name: string, fallback: number) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

async function login(baseUrl: string, email: string, password: string) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const response = await fetch(`${baseUrl}/api/safety/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to login (${response.status})`);
  }

  const payload = await readJson<LoginPayload>(response);
  if (!payload.access_token) {
    throw new Error('Login response did not include access_token.');
  }
  return payload.access_token;
}

async function requestJson<T>(
  url: string,
  input: {
    body?: string;
    method?: 'GET' | 'POST';
    token: string;
  },
): Promise<{ elapsedMs: number; payload: T; status: number }> {
  const startedAt = performance.now();
  const response = await fetch(url, {
    method: input.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body,
    cache: 'no-store',
  });
  const elapsedMs = performance.now() - startedAt;
  const payload = await readJson<T>(response);

  return {
    elapsedMs: Math.round(elapsedMs),
    payload,
    status: response.status,
  };
}

function buildLowReportPayload(
  accountId: string,
  recipient: MailRecipient,
  reportKey: string,
  subject: string,
) {
  return {
    account_id: accountId,
    attachments: [],
    body: '<p>실제 저용량 첨부 메일 성능 체크</p>',
    original_pdf_available: true,
    report: {
      original_pdf_available: true,
      report_filename: `${reportKey}.pdf`,
      report_key: reportKey,
      report_title: reportKey,
      report_type: 'technical_guidance',
      report_updated_at: new Date().toISOString(),
    },
    report_filename: `${reportKey}.pdf`,
    report_key: reportKey,
    report_title: reportKey,
    report_type: 'technical_guidance',
    report_updated_at: new Date().toISOString(),
    sender_name: '관제',
    subject,
    thread_id: '',
    to: [recipient],
  };
}

function buildHighReportPayload(
  accountId: string,
  recipient: MailRecipient,
  reportKey: string,
  subject: string,
) {
  return {
    account_id: accountId,
    attachments: [],
    body: '<p>실제 고용량 첨부 메일 성능 체크</p>',
    original_pdf_available: true,
    report: {
      original_pdf_available: true,
      report_filename: `${reportKey}.pdf`,
      report_key: reportKey,
      report_title: reportKey,
      report_type: 'technical_guidance',
      report_updated_at: new Date().toISOString(),
    },
    report_filename: `${reportKey}.pdf`,
    report_key: reportKey,
    report_title: reportKey,
    report_type: 'technical_guidance',
    report_updated_at: new Date().toISOString(),
    sender_name: '관제',
    subject,
    thread_id: '',
    to: [recipient],
  };
}

function buildPlainPayload(accountId: string, recipient: MailRecipient, subject: string) {
  return {
    account_id: accountId,
    attachments: [],
    body: '<p>실제 일반 메일 성능 체크</p>',
    sender_name: '관제',
    subject,
    thread_id: '',
    to: [recipient],
  };
}

function buildBenchCases(input: {
  accountId: string;
  highReportKey: string;
  lowReportKey: string;
  lowRuns: number;
  recipient: MailRecipient;
}) {
  const stamp = Date.now();
  const cases: BenchCase[] = [
    {
      body: 'plain',
      kind: 'plain',
      path: '/api/mail/send',
      payload: buildPlainPayload(
        input.accountId,
        input.recipient,
        `[mail-bench] plain ${stamp}`,
      ),
      subject: `[mail-bench] plain ${stamp}`,
    },
  ];

  for (let index = 0; index < input.lowRuns; index += 1) {
    const subject = `[mail-bench] low-report ${stamp}-${index + 1}`;
    cases.push({
      body: 'report_low',
      kind: 'report_low',
      path: '/api/mail/send-report',
      payload: buildLowReportPayload(
        input.accountId,
        input.recipient,
        input.lowReportKey,
        subject,
      ),
      subject,
    });
  }

  const highSubject = `[mail-bench] high-report ${stamp}`;
  cases.push({
    body: 'report_high',
    kind: 'report_high',
    path: '/api/mail/send-report',
    payload: buildHighReportPayload(
      input.accountId,
      input.recipient,
      input.highReportKey,
      highSubject,
    ),
    subject: highSubject,
  });

  return cases;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSentThread(input: {
  accountId: string;
  baseUrl: string;
  pollIntervalMs: number;
  subject: string;
  timeoutMs: number;
  token: string;
}) {
  const startedAt = performance.now();
  while (performance.now() - startedAt <= input.timeoutMs) {
    const query = new URLSearchParams({
      accountId: input.accountId,
      box: 'sent',
      limit: '20',
      offset: '0',
      query: input.subject,
    });
    const response = await requestJson<ThreadsPayload>(
      `${input.baseUrl}/api/mail/threads?${query.toString()}`,
      {
        token: input.token,
      },
    );
    const row = (response.payload.rows || []).find((item) => item.subject === input.subject) || null;
    if (row) {
      return {
        elapsedMs: Math.round(performance.now() - startedAt),
        row,
      };
    }
    await sleep(input.pollIntervalMs);
  }

  return {
    elapsedMs: null,
    row: null,
  };
}

async function waitForThreadDetail(input: {
  baseUrl: string;
  pollIntervalMs: number;
  threadId: string;
  timeoutMs: number;
  token: string;
}) {
  const startedAt = performance.now();
  while (performance.now() - startedAt <= input.timeoutMs) {
    const response = await requestJson<MailThreadDetail>(
      `${input.baseUrl}/api/mail/threads/${encodeURIComponent(input.threadId)}`,
      {
        token: input.token,
      },
    );
    if (response.payload.thread?.id) {
      return {
        detail: response.payload,
        elapsedMs: Math.round(performance.now() - startedAt),
      };
    }
    await sleep(input.pollIntervalMs);
  }

  return {
    detail: null,
    elapsedMs: null,
  };
}

async function waitForMessageDetail(input: {
  baseUrl: string;
  messageId: string;
  pollIntervalMs: number;
  timeoutMs: number;
  token: string;
}) {
  const startedAt = performance.now();
  while (performance.now() - startedAt <= input.timeoutMs) {
    const response = await requestJson<MailMessage>(
      `${input.baseUrl}/api/mail/messages/${encodeURIComponent(input.messageId)}`,
      {
        token: input.token,
      },
    );
    if (response.payload.id) {
      return {
        elapsedMs: Math.round(performance.now() - startedAt),
        message: response.payload,
      };
    }
    await sleep(input.pollIntervalMs);
  }

  return {
    elapsedMs: null,
    message: null,
  };
}

function summarizeByCase(results: BenchResult[]) {
  const grouped = new Map<CaseKind, BenchResult[]>();
  for (const result of results) {
    const bucket = grouped.get(result.caseKind) || [];
    bucket.push(result);
    grouped.set(result.caseKind, bucket);
  }

  return Array.from(grouped.entries()).map(([caseKind, bucket]) => {
    const avg = (values: Array<number | null>) => {
      const filtered = values.filter((value): value is number => typeof value === 'number');
      if (filtered.length === 0) {
        return null;
      }
      return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
    };

    return {
      apiElapsedMsAvg: avg(bucket.map((item) => item.apiElapsedMs)),
      caseKind,
      count: bucket.length,
      messageDetailVisibleMsAvg: avg(bucket.map((item) => item.messageDetailVisibleMs)),
      sentListVisibleMsAvg: avg(bucket.map((item) => item.sentListVisibleMs)),
      threadDetailVisibleMsAvg: avg(bucket.map((item) => item.threadDetailVisibleMs)),
    };
  });
}

async function runCase(input: {
  accountId: string;
  baseUrl: string;
  benchCase: BenchCase;
  detailPollTimeoutMs: number;
  pollIntervalMs: number;
  sentPollTimeoutMs: number;
  token: string;
}) {
  const sendResponse = await requestJson<SendResponse>(
    `${input.baseUrl}${input.benchCase.path}`,
    {
      body: JSON.stringify(input.benchCase.payload),
      method: 'POST',
      token: input.token,
    },
  );
  const sendPayload = sendResponse.payload;

  let threadId = sendPayload.threadId || '';
  let threadLastMessageAt: string | null = null;
  let sentListVisibleMs: number | null = null;

  const sentThread = await waitForSentThread({
    accountId: input.accountId,
    baseUrl: input.baseUrl,
    pollIntervalMs: input.pollIntervalMs,
    subject: input.benchCase.subject,
    timeoutMs: input.sentPollTimeoutMs,
    token: input.token,
  });
  if (sentThread.row) {
    threadId = sentThread.row.id;
    threadLastMessageAt = sentThread.row.lastMessageAt || null;
    sentListVisibleMs = sentThread.elapsedMs;
  }

  let threadDetailVisibleMs: number | null = null;
  let messageDetailVisibleMs: number | null = null;
  let messageDetailSentAt: string | null = null;
  let messageDetailDeliveredAt: string | null = null;

  if (threadId && !threadId.startsWith('queued:')) {
    const detailResponse = await waitForThreadDetail({
      baseUrl: input.baseUrl,
      pollIntervalMs: input.pollIntervalMs,
      threadId,
      timeoutMs: input.detailPollTimeoutMs,
      token: input.token,
    });
    if (detailResponse.detail) {
      threadDetailVisibleMs = detailResponse.elapsedMs;
      const matchingMessage =
        detailResponse.detail.messages.find((message) => message.subject === input.benchCase.subject) ||
        detailResponse.detail.messages[0] ||
        null;

      if (matchingMessage?.id) {
        const messageResponse = await waitForMessageDetail({
          baseUrl: input.baseUrl,
          messageId: matchingMessage.id,
          pollIntervalMs: input.pollIntervalMs,
          timeoutMs: input.detailPollTimeoutMs,
          token: input.token,
        });
        if (messageResponse.message) {
          messageDetailVisibleMs = messageResponse.elapsedMs;
          messageDetailSentAt = messageResponse.message.sentAt || null;
          messageDetailDeliveredAt = messageResponse.message.deliveredAt || null;
        }
      }
    }
  }

  return {
    apiElapsedMs: sendResponse.elapsedMs,
    caseKind: input.benchCase.kind,
    deliveredAt: sendPayload.deliveredAt || null,
    messageDetailDeliveredAt,
    messageDetailSentAt,
    messageDetailVisibleMs,
    responseId: sendPayload.id || '',
    responseStatus: sendResponse.status,
    sentAt: sendPayload.sentAt || null,
    sentListVisibleMs,
    subject: input.benchCase.subject,
    threadDetailVisibleMs,
    threadId,
    threadLastMessageAt,
  } satisfies BenchResult;
}

async function main() {
  const baseUrl = process.env.MAIL_BENCH_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const email = requireEnv('MAIL_BENCH_EMAIL');
  const password = requireEnv('MAIL_BENCH_PASSWORD');
  const accountId = requireEnv('MAIL_BENCH_ACCOUNT_ID');
  const recipientEmail = requireEnv('MAIL_BENCH_RECIPIENT');
  const token = await login(baseUrl, email, password);
  const lowRuns = readEnvNumber('MAIL_BENCH_LOW_RUNS', DEFAULT_LOW_RUNS);
  const pollIntervalMs = readEnvNumber('MAIL_BENCH_POLL_INTERVAL_MS', DEFAULT_POLL_INTERVAL_MS);
  const sentPollTimeoutMs = readEnvNumber('MAIL_BENCH_SENT_TIMEOUT_MS', DEFAULT_SENT_POLL_TIMEOUT_MS);
  const detailPollTimeoutMs = readEnvNumber(
    'MAIL_BENCH_DETAIL_TIMEOUT_MS',
    DEFAULT_DETAIL_POLL_TIMEOUT_MS,
  );

  const cases = buildBenchCases({
    accountId,
    highReportKey: process.env.MAIL_BENCH_HIGH_REPORT_KEY?.trim() || DEFAULT_HIGH_REPORT_KEY,
    lowReportKey: process.env.MAIL_BENCH_LOW_REPORT_KEY?.trim() || DEFAULT_LOW_REPORT_KEY,
    lowRuns,
    recipient: {
      email: recipientEmail,
      name: null,
    },
  });

  const results: BenchResult[] = [];
  for (const benchCase of cases) {
    console.log(`[mail-bench] start ${benchCase.kind} ${benchCase.subject}`);
    results.push(
      await runCase({
        accountId,
        baseUrl,
        benchCase,
        detailPollTimeoutMs,
        pollIntervalMs,
        sentPollTimeoutMs,
        token,
      }),
    );
  }

  const summary = summarizeByCase(results);
  console.log(
    JSON.stringify(
      {
        baseUrl,
        results,
        summary,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error('[mail-bench] failed', error);
  process.exitCode = 1;
});
