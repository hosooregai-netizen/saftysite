'use client';

import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7AutofillResponse {
  location?: string;
  accidentType?: string;
  riskLevel?: string;
  causativeAgentKey?: CausativeAgentKey | '';
  hazardDescription?: string;
  improvementRequest?: string;
}

async function requestDoc7Autofill(file: File): Promise<Doc7AutofillResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ai/doc7-finding', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as Doc7AutofillResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error?.trim() || '문서7 AI 자동 채우기에 실패했습니다.');
  }

  return payload;
}

function normalizeLine(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMultiline(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export function isFindingEmptyForAiAutofill(item: CurrentHazardFinding): boolean {
  const normalize = (value: string | null | undefined) => String(value ?? '').trim();

  if (item.carryForward) return false;
  if (normalize(item.location)) return false;
  if (normalize(item.likelihood) || normalize(item.severity)) return false;
  if (normalize(item.riskLevel)) return false;
  if (normalize(item.accidentType)) return false;
  if (item.causativeAgentKey) return false;
  if (normalize(item.emphasis)) return false;
  if (normalize(item.improvementPlan)) return false;
  if (normalize(item.legalReferenceId)) return false;
  if (normalize(item.legalReferenceTitle)) return false;
  if (normalize(item.referenceMaterialImage || item.referenceMaterial1)) return false;
  if (normalize(item.referenceMaterialDescription || item.referenceMaterial2)) return false;
  if (normalize(item.metadata)) return false;
  return true;
}

export async function buildHazardFindingAutoFill(
  file: File,
): Promise<Partial<CurrentHazardFinding>> {
  const result = await requestDoc7Autofill(file);
  const location = normalizeLine(result.location);
  const accidentType = normalizeLine(result.accidentType);
  const riskLevel = normalizeLine(result.riskLevel);
  const causativeAgentKey = normalizeLine(result.causativeAgentKey) as CausativeAgentKey | '';
  const hazardDescription = normalizeLine(result.hazardDescription);
  const improvementRequest = normalizeMultiline(result.improvementRequest);

  return {
    location,
    accidentType,
    riskLevel,
    causativeAgentKey,
    hazardDescription,
    improvementPlan: improvementRequest,
    improvementRequest,
  };
}

export async function assetUrlToFile(assetUrl: string, filename: string) {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error('사진 파일을 다시 불러오는 중 오류가 발생했습니다.');
  }

  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
