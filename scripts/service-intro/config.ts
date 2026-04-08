import fs from 'node:fs/promises';
import path from 'node:path';

export interface IntroCaptureItem {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  route: string;
}

export interface IntroManifest {
  generatedAt: string;
  baseUrl: string;
  items: IntroCaptureItem[];
}

const DEFAULT_BASE_URL = 'https://saftysite-seven.vercel.app';
const OUTPUT_ROOT = path.resolve(process.cwd(), '.tmp-ui/generated/service-intro');
const MANIFEST_PATH = path.join(OUTPUT_ROOT, 'capture-manifest.json');
const PPT_PATH = path.join(OUTPUT_ROOT, 'service-intro.pptx');

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function readSmokeSeedCredentials() {
  const seedPath = process.env.SMOKE_SEED_PATH?.trim() || '/tmp/safety-e2e-seed.json';
  const raw = await fs.readFile(seedPath, 'utf8');
  const payload = JSON.parse(raw) as {
    adminEmail?: string;
    adminPassword?: string;
  };
  if (!payload.adminEmail?.trim() || !payload.adminPassword?.trim()) {
    throw new Error('SMOKE_SEED_PATH does not contain adminEmail/adminPassword.');
  }
  return {
    email: payload.adminEmail.trim(),
    password: payload.adminPassword.trim(),
  };
}

export function getBaseUrl(): string {
  return process.env.LIVE_NEXT_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export async function getIntroCredentials() {
  const email = process.env.LIVE_SAFETY_EMAIL?.trim();
  const password = process.env.LIVE_SAFETY_PASSWORD?.trim();
  if (email && password) {
    return { email, password };
  }
  return readSmokeSeedCredentials();
}

export function getOutputRoot() {
  return OUTPUT_ROOT;
}

export function getManifestPath() {
  return MANIFEST_PATH;
}

export function getPptPath() {
  return PPT_PATH;
}

export async function ensureOutputRoot() {
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
}
