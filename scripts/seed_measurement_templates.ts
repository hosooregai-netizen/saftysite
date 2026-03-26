export {};

type SeedMeasurementTemplate = {
  equipment_name: string;
  safety_standard: string[];
};

type SafetyTokenResponse = {
  access_token: string;
};

type SafetyContentItem = {
  id: string;
  content_type: string;
  title: string;
  code: string | null;
  body: unknown;
  sort_order: number;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
};

const DEFAULT_APP_BASE_URL = 'http://localhost:3000';
const seedItems: SeedMeasurementTemplate[] = [
  {
    equipment_name: '조도계',
    safety_standard: [
      '초정밀작업: 750 Lux 이상',
      '정밀작업: 300 Lux 이상',
      '보통작업: 150 Lux 이상',
      '그 밖의 작업: 75 Lux 이상',
    ],
  },
  {
    equipment_name: '소음계',
    safety_standard: [
      '1일 8시간 기준 85dB 이상: 소음작업',
      '1일 8시간 기준 90dB 이상: 강렬한 소음작업',
    ],
  },
  {
    equipment_name: '복합 가스 및 산소 농도 측정기',
    safety_standard: [
      '산소: 18% 이상 23.5% 미만',
      '일산화탄소: 30ppm 미만',
      '황화수소: 10ppm 미만',
    ],
  },
  {
    equipment_name: '풍속계 및 발연관',
    safety_standard: ['국소배기장치 제어풍속: 0.5~1.2m/s 이상'],
  },
  {
    equipment_name: '절연저항측정기 및 검전기',
    safety_standard: ['저압 절연저항: 0.5MΩ 이상'],
  },
  {
    equipment_name: '습구흑구온도지수(WBGT) 측정기',
    safety_standard: [
      '경작업: 30.0~32.2℃ 이하',
      '중등도 작업: 28.0~31.1℃ 이하',
      '중작업: 25.9~30.0℃ 이하',
    ],
  },
  {
    equipment_name: '분진 측정기',
    safety_standard: [
      '제2종 분진 총분진: 10mg/m³ 이하',
      '제2종 분진 호흡성분진: 3mg/m³ 이하',
      '석면 분진: 0.1개/cm³ 이하',
      '용접 흄: 5mg/m³ 이하',
    ],
  },
  {
    equipment_name: '진동 측정기',
    safety_standard: [
      '국소진동(손-팔): 5m/s² 이하',
      '전신진동: 1.15m/s² 이하',
    ],
  },
  {
    equipment_name: '정전기 전위 측정기',
    safety_standard: [
      '설비 접지 저항: 100Ω 이하 또는 10Ω 이하',
      '대전 전위: 수백~수천V 이하 억제',
    ],
  },
  {
    equipment_name: '방사선 측정기',
    safety_standard: [
      '방사선 작업종사자: 연간 50mSv 이하, 5년 누적 100mSv 이하',
      '수시출입자: 연간 12mSv 이하',
    ],
  },
];

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  const directBase = process.env.SAFETY_API_BASE_URL?.trim();
  if (directBase) {
    return normalizeBaseUrl(directBase);
  }

  const configured = process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim();
  if (configured) {
    if (configured.startsWith('http://') || configured.startsWith('https://')) {
      return normalizeBaseUrl(configured);
    }

    if (configured.startsWith('/')) {
      const appBaseUrl = normalizeBaseUrl(process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL);
      return `${appBaseUrl}${configured}`;
    }
  }

  return `${normalizeBaseUrl(process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL)}/api/safety`;
}

async function parseResponseText(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      if (typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail;
      }
      return JSON.stringify(payload);
    } catch {
      return response.statusText;
    }
  }

  return (await response.text()) || response.statusText;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${url} failed (${response.status}): ${await parseResponseText(response)}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function resolveAccessToken(apiBaseUrl: string): Promise<string> {
  const token = process.env.SAFETY_ACCESS_TOKEN?.trim();
  if (token) {
    return token;
  }

  const email = process.env.SAFETY_ADMIN_EMAIL?.trim();
  const password = process.env.SAFETY_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'SAFETY_ACCESS_TOKEN 또는 SAFETY_ADMIN_EMAIL / SAFETY_ADMIN_PASSWORD 환경변수가 필요합니다.',
    );
  }

  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const tokenResponse = await requestJson<SafetyTokenResponse>(`${apiBaseUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  return tokenResponse.access_token;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getMeasurementTemplateName(item: SafetyContentItem): string {
  const body = asRecord(item.body);
  return (
    normalizeText(body.instrumentName) ||
    normalizeText(body.instrument_name) ||
    normalizeText(body.equipmentName) ||
    normalizeText(body.equipment_name) ||
    normalizeText(item.title)
  );
}

function buildTemplateCode(index: number): string {
  return `measurement-template-${String(index + 1).padStart(2, '0')}`;
}

function buildTemplatePayload(item: SeedMeasurementTemplate, index: number) {
  return {
    content_type: 'measurement_template',
    title: item.equipment_name,
    code: buildTemplateCode(index),
    body: {
      instrumentName: item.equipment_name,
      equipmentName: item.equipment_name,
      safetyCriteria: item.safety_standard.join('\n'),
      safety_standard: item.safety_standard,
    },
    tags: ['seed', 'measurement-template'],
    sort_order: index,
    effective_from: null,
    effective_to: null,
    is_active: true,
  };
}

function needsUpdate(existing: SafetyContentItem, nextPayload: ReturnType<typeof buildTemplatePayload>): boolean {
  const body = asRecord(existing.body);
  const existingCriteria =
    normalizeText(body.safetyCriteria) ||
    normalizeText(body.safety_criteria) ||
    (Array.isArray(body.safety_standard)
      ? body.safety_standard.map((entry) => normalizeText(entry)).filter(Boolean).join('\n')
      : '');

  return (
    existing.title !== nextPayload.title ||
    (existing.code || '') !== nextPayload.code ||
    getMeasurementTemplateName(existing) !== nextPayload.title ||
    existingCriteria !== nextPayload.body.safetyCriteria ||
    existing.sort_order !== nextPayload.sort_order ||
    existing.is_active !== nextPayload.is_active
  );
}

async function main() {
  const apiBaseUrl = resolveApiBaseUrl();
  const accessToken = await resolveAccessToken(apiBaseUrl);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const existingItems = await requestJson<SafetyContentItem[]>(
    `${apiBaseUrl}/content-items?active_only=false&limit=500`,
    { method: 'GET', headers },
  );

  const existingMeasurementTemplates = existingItems.filter(
    (item) => item.content_type === 'measurement_template',
  );

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const [index, item] of seedItems.entries()) {
    const payload = buildTemplatePayload(item, index);
    const normalizedName = item.equipment_name.trim().toLowerCase();
    const existing = existingMeasurementTemplates.find(
      (candidate) =>
        candidate.code === payload.code ||
        getMeasurementTemplateName(candidate).trim().toLowerCase() === normalizedName,
    );

    if (!existing) {
      await requestJson<SafetyContentItem>(`${apiBaseUrl}/content-items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      created.push(item.equipment_name);
      continue;
    }

    if (!needsUpdate(existing, payload)) {
      skipped.push(item.equipment_name);
      continue;
    }

    await requestJson<SafetyContentItem>(`${apiBaseUrl}/content-items/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        title: payload.title,
        code: payload.code,
        body: payload.body,
        tags: payload.tags,
        sort_order: payload.sort_order,
        effective_from: payload.effective_from,
        effective_to: payload.effective_to,
        is_active: payload.is_active,
      }),
    });
    updated.push(item.equipment_name);
  }

  console.log(`Measurement template seed completed via ${apiBaseUrl}`);
  console.log(`Created: ${created.length ? created.join(', ') : '-'}`);
  console.log(`Updated: ${updated.length ? updated.join(', ') : '-'}`);
  console.log(`Skipped: ${skipped.length ? skipped.join(', ') : '-'}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Measurement template seed failed: ${message}`);
  process.exitCode = 1;
});

