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
