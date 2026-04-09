'use client';

import type { SafetyMeasurementTemplate } from '@/types/backend';

interface Doc10InstrumentMatchResponse {
  instrumentName?: string;
  error?: string;
}

function normalizeInstrumentName(value: string) {
  return value.replace(/[\s"'`()[\]{}:;,.!?/\\_-]+/g, '').toLowerCase();
}

export function findMeasurementTemplateByName(
  templates: SafetyMeasurementTemplate[],
  instrumentName: string,
) {
  const normalized = normalizeInstrumentName(instrumentName);
  if (!normalized) {
    return null;
  }

  const exactMatch =
    templates.find(
      (template) => normalizeInstrumentName(template.instrumentName) === normalized,
    ) ?? null;
  if (exactMatch) {
    return exactMatch;
  }

  const includeMatch =
    templates.find((template) => {
      const candidate = normalizeInstrumentName(template.instrumentName);
      return candidate.includes(normalized) || normalized.includes(candidate);
    }) ?? null;

  return includeMatch;
}

export async function matchMeasurementTemplateByPhoto(
  file: File,
  templates: SafetyMeasurementTemplate[],
) {
  const allowedInstrumentNames = Array.from(
    new Set(
      templates
        .map((template) => template.instrumentName.trim())
        .filter(Boolean),
    ),
  );

  if (allowedInstrumentNames.length === 0) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('allowedInstrumentNames', JSON.stringify(allowedInstrumentNames));

  const response = await fetch('/api/ai/doc10-instrument-match', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as Doc10InstrumentMatchResponse;
  if (!response.ok) {
    throw new Error(payload.error?.trim() || '계측장비 AI 매칭에 실패했습니다.');
  }

  const instrumentName = payload.instrumentName?.trim() || '';
  if (!instrumentName) {
    return null;
  }

  return findMeasurementTemplateByName(templates, instrumentName);
}
