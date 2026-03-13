import type { GenerateInspectionWordRequest } from '@/types/documents';
import type { InspectionSession } from '@/types/inspectionSession';

const API_BASE = '/api';

async function parseApiResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }

  return res.text();
}

async function postFiles(path: string, files: File[]): Promise<unknown> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 오류 (${res.status}): ${text || res.statusText}`);
  }

  return parseApiResponse(res);
}

export function analyzeHazardPhotos(files: File[]): Promise<unknown> {
  return postFiles('/vision/analyze-hazard-photos', files);
}

export function checkCausativeAgents(files: File[]): Promise<unknown> {
  return postFiles('/vision/check-causative-agents', files);
}

function getDownloadFilenameFromDisposition(header: string | null): string {
  if (!header) return 'inspection-report.docx';

  const match = header.match(/filename="([^"]+)"/i);
  return match?.[1] ?? 'inspection-report.docx';
}

export async function fetchInspectionWordDocument(
  session: InspectionSession
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionWordRequest = {
    session,
    templateId: 'default-inspection',
  };

  const res = await fetch(`${API_BASE}/documents/inspection/word`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await parseApiResponse(res);
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String(errorBody.error)
        : res.statusText;

    throw new Error(`워드 다운로드 실패 (${res.status}): ${message}`);
  }

  return {
    blob: await res.blob(),
    filename: getDownloadFilenameFromDisposition(
      res.headers.get('content-disposition')
    ),
  };
}
