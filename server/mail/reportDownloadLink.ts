import crypto from 'node:crypto';
import { loginSafetyApi } from '@/lib/safetyApi';

const DEFAULT_REPORT_DOWNLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_BASE_URL_ENV_KEYS = [
  'MAIL_REPORT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'SITE_URL',
  'APP_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_URL',
] as const;

interface ReportDownloadTokenPayload {
  accessToken: string;
  expiresAt: number;
  filename: string;
  reportKey: string;
}

type CachedServiceToken = {
  accessToken: string;
  expiresAt: number;
};

const globalMailReportDownloadState = globalThis as typeof globalThis & {
  __mailReportDownloadServiceToken?: CachedServiceToken;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toBase64Url(value: Buffer) {
  return value.toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function getDownloadSecret() {
  const secret =
    process.env.MAIL_REPORT_DOWNLOAD_SECRET?.trim() ||
    process.env.SAFETY_ADMIN_PASSWORD?.trim() ||
    process.env.LIVE_SAFETY_PASSWORD?.trim() ||
    '';
  if (!secret) {
    throw new Error('외부 보고서 다운로드 링크 비밀키가 설정되지 않았습니다.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function parseTokenExpiry(accessToken: string) {
  const [, payload = ''] = accessToken.split('.');
  if (!payload) return 0;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    const exp = Number(decoded.exp);
    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function resolvePublicBaseUrlFromRequest(requestUrl?: string | null) {
  const normalized = normalizeText(requestUrl);
  if (!normalized || !isHttpUrl(normalized)) {
    return '';
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return '';
  }
}

export function resolveMailReportPublicBaseUrl(requestUrl?: string | null) {
  for (const envKey of PUBLIC_BASE_URL_ENV_KEYS) {
    const configured = normalizeText(process.env[envKey]);
    if (!configured) continue;
    if (envKey.startsWith('VERCEL_') && !/^https?:\/\//i.test(configured)) {
      return `https://${normalizeBaseUrl(configured)}`;
    }
    if (isHttpUrl(configured)) {
      return normalizeBaseUrl(configured);
    }
  }

  return resolvePublicBaseUrlFromRequest(requestUrl);
}

function encryptPayload(payload: ReportDownloadTokenPayload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getDownloadSecret(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [toBase64Url(iv), toBase64Url(tag), toBase64Url(ciphertext)].join('.');
}

export function readMailReportDownloadToken(token: string): ReportDownloadTokenPayload {
  const [ivPart, tagPart, dataPart] = token.split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('다운로드 링크 토큰 형식이 올바르지 않습니다.');
  }

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getDownloadSecret(),
      fromBase64Url(ivPart),
    );
    decipher.setAuthTag(fromBase64Url(tagPart));
    const plaintext = Buffer.concat([
      decipher.update(fromBase64Url(dataPart)),
      decipher.final(),
    ]);
    const payload = JSON.parse(plaintext.toString('utf8')) as ReportDownloadTokenPayload;
    if (!normalizeText(payload.reportKey) || !normalizeText(payload.accessToken)) {
      throw new Error('다운로드 링크 토큰 값이 올바르지 않습니다.');
    }
    if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) {
      throw new Error('다운로드 링크가 만료되었습니다.');
    }
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('다운로드 링크를 해석하지 못했습니다.');
  }
}

export function buildMailReportDownloadUrl(input: {
  accessToken: string;
  filename: string;
  publicBaseUrl?: string | null;
  reportKey: string;
  requestUrl?: string | null;
  ttlMs?: number | null;
}) {
  const baseUrl =
    normalizeText(input.publicBaseUrl) || resolveMailReportPublicBaseUrl(input.requestUrl);
  if (!baseUrl) {
    return '';
  }

  const expiresAt = Date.now() + Math.max(60_000, input.ttlMs ?? DEFAULT_REPORT_DOWNLOAD_TTL_MS);
  const token = encryptPayload({
    accessToken: normalizeText(input.accessToken),
    expiresAt,
    filename: normalizeText(input.filename) || `${normalizeText(input.reportKey)}.pdf`,
    reportKey: normalizeText(input.reportKey),
  });
  return new URL(`/api/mail/report-download?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

async function loginWithServiceCredentials() {
  const email =
    process.env.SAFETY_ADMIN_EMAIL?.trim() ||
    process.env.LIVE_SAFETY_EMAIL?.trim() ||
    '';
  const password =
    process.env.SAFETY_ADMIN_PASSWORD?.trim() ||
    process.env.LIVE_SAFETY_PASSWORD?.trim() ||
    '';
  if (!email || !password) {
    return null;
  }

  const tokenResponse = await loginSafetyApi({ email, password });
  const accessToken = normalizeText(tokenResponse.access_token);
  if (!accessToken) {
    return null;
  }

  const expiresAt = parseTokenExpiry(accessToken);
  return {
    accessToken,
    expiresAt: expiresAt || Date.now() + 30 * 60 * 1000,
  } satisfies CachedServiceToken;
}

export async function resolveMailReportDownloadAccessToken(
  payload: ReportDownloadTokenPayload,
) {
  const cached = globalMailReportDownloadState.__mailReportDownloadServiceToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const refreshed = await loginWithServiceCredentials().catch(() => null);
  if (refreshed?.accessToken) {
    globalMailReportDownloadState.__mailReportDownloadServiceToken = refreshed;
    return refreshed.accessToken;
  }

  return payload.accessToken;
}
