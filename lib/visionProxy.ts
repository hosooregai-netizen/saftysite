import { createVisionFallbackResponse } from '@/lib/visionFallback';

const DEFAULT_API_BASE = 'http://35.76.230.177:8008';

function getApiBase(): string {
  return (process.env.SAFETY_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
}

function createEmergencyFallbackResponse(path: string, fileCount: number): Response | null {
  if (path === '/vision/analyze-hazard-photos') {
    return Response.json(
      Array.from({ length: Math.max(fileCount, 1) }, () => ({
        metadata:
          '현장 사진 자동 분석 백엔드에 연결하지 못해 상세 분석을 생성하지 못함.',
        objects: [],
        risk_factor: ['위험요인 자동 분석 실패'],
        improvements: ['- 백엔드 연결 상태 확인 필요'],
        laws: [],
        likelihood: 1,
        severity: 1,
      })),
      { status: 200 }
    );
  }

  if (path === '/vision/check-causative-agents') {
    return Response.json(
      {
        agents: {
          '1_단부_개구부': false,
          '2_철골': false,
          '3_지붕': false,
          '4_비계_작업발판': false,
          '5_굴착기': false,
          '6_고소작업대': false,
          '7_사다리': false,
          '8_달비계': false,
          '9_트럭': false,
          '10_이동식비계': false,
          '11_거푸집동바리': false,
          '12_이동식크레인': false,
          '13_화재_폭발': false,
          '14_기타_위험요인': false,
        },
        reasoning:
          '자동 분석 백엔드에 연결하지 못해 12대 기인물 판별을 수행하지 못함.',
      },
      { status: 200 }
    );
  }

  return null;
}

async function createSafeFallbackResponse(
  path: string,
  files: File[]
): Promise<Response | null> {
  try {
    const fallbackResponse = await createVisionFallbackResponse(path, files);
    if (fallbackResponse) {
      return fallbackResponse;
    }
  } catch {
    // Fall through to the emergency static payload below.
  }

  return createEmergencyFallbackResponse(path, files.length);
}

export async function proxyVisionRequest(
  request: Request,
  path: string
): Promise<Response> {
  const incomingFormData = await request.formData();
  const upstreamFormData = new FormData();
  const files: File[] = [];

  for (const value of incomingFormData.getAll('files')) {
    if (value instanceof File) {
      upstreamFormData.append('files', value, value.name);
      files.push(value);
    }
  }

  if (files.length === 0) {
    return Response.json(
      { error: '업로드할 파일이 없습니다.' },
      { status: 400 }
    );
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(`${getApiBase()}${path}`, {
      method: 'POST',
      body: upstreamFormData,
      cache: 'no-store',
    });
  } catch (error) {
    const fallbackResponse = await createSafeFallbackResponse(path, files);
    if (fallbackResponse) return fallbackResponse;

    return Response.json(
      {
        error:
          error instanceof Error
            ? `백엔드 요청 실패: ${error.message}`
            : '백엔드 요청 실패',
      },
      { status: 502 }
    );
  }

  if (!upstreamResponse.ok && upstreamResponse.status >= 500) {
    const fallbackResponse = await createSafeFallbackResponse(path, files);
    if (fallbackResponse) return fallbackResponse;
  }

  const responseBody = await upstreamResponse.arrayBuffer();
  const contentType =
    upstreamResponse.headers.get('content-type') ||
    'application/json; charset=utf-8';

  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'content-type': contentType,
    },
  });
}

