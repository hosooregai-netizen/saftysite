import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface GoogleReviewConfig {
  appBaseUrl: string;
  outputDir: string;
  password: string;
  publicBaseUrl: string;
  serviceEmail: string;
  headless: boolean;
}

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function readGoogleReviewConfig(): GoogleReviewConfig {
  return {
    appBaseUrl: normalizeBaseUrl(
      process.env.GOOGLE_REVIEW_APP_BASE_URL,
      'https://saftysite-seven.vercel.app',
    ),
    outputDir: resolve(process.env.GOOGLE_REVIEW_OUTPUT_DIR || '.tmp-ui/generated/google-review'),
    password: process.env.GOOGLE_REVIEW_SERVICE_PASSWORD || '',
    publicBaseUrl: normalizeBaseUrl(
      process.env.GOOGLE_REVIEW_PUBLIC_BASE_URL,
      'https://saftysite-seven.vercel.app',
    ),
    serviceEmail: process.env.GOOGLE_REVIEW_SERVICE_EMAIL || '',
    headless: process.env.GOOGLE_REVIEW_HEADLESS === '1',
  };
}

export async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function ensureOutputDir(dir: string) {
  await mkdir(dir, { recursive: true });
}
