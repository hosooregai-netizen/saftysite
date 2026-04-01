'use client';

import type {
  SafetyAiTextResponse,
  SafetyCausativeAgentsResponse,
  SafetyDoc11EducationRequest,
  SafetyDoc5SummaryRequest,
  SafetyHazardAnalysisItem,
} from '@/types/backend';
import { readSafetyAuthToken } from './authStorage';
import { requestSafetyApi } from './client';

function requireSafetyAuthToken(): string {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
  return token;
}

export async function analyzeHazardPhotos(
  files: File[],
): Promise<SafetyHazardAnalysisItem[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return requestSafetyApi<SafetyHazardAnalysisItem[]>(
    '/ai/vision/hazard-analysis',
    {
      method: 'POST',
      body: formData,
    },
    requireSafetyAuthToken(),
  );
}

export async function checkCausativeAgents(
  files: File[],
): Promise<SafetyCausativeAgentsResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return requestSafetyApi<SafetyCausativeAgentsResponse>(
    '/ai/vision/causative-agents',
    {
      method: 'POST',
      body: formData,
    },
    requireSafetyAuthToken(),
  );
}

export async function generateDoc5Summary(
  payload: SafetyDoc5SummaryRequest,
): Promise<string> {
  const response = await requestSafetyApi<SafetyAiTextResponse>(
    '/ai/text/doc5-summary',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    requireSafetyAuthToken(),
  );

  return response.text;
}

export async function generateDoc11EducationContent(
  payload: SafetyDoc11EducationRequest,
): Promise<string> {
  const response = await requestSafetyApi<SafetyAiTextResponse>(
    '/ai/text/doc11-education',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    requireSafetyAuthToken(),
  );

  return response.text;
}
