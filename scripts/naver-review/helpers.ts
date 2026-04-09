import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface NaverReviewConfig {
  appBaseUrl: string;
  outputDir: string;
  password: string;
  publicBaseUrl: string;
  serviceEmail: string;
}

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function readNaverReviewConfig(): NaverReviewConfig {
  return {
    appBaseUrl: normalizeBaseUrl(process.env.NAVER_REVIEW_APP_BASE_URL, 'https://saftysite-seven.vercel.app'),
    outputDir: resolve(process.env.NAVER_REVIEW_OUTPUT_DIR || '.tmp-ui/generated/naver-review'),
    password: process.env.NAVER_REVIEW_SERVICE_PASSWORD || '',
    publicBaseUrl: normalizeBaseUrl(process.env.NAVER_REVIEW_PUBLIC_BASE_URL, 'http://127.0.0.1:3000'),
    serviceEmail: process.env.NAVER_REVIEW_SERVICE_EMAIL || '',
  };
}

export async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function ensureOutputDir(dir: string) {
  await mkdir(dir, { recursive: true });
}
