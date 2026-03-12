const API_BASE = 'http://35.76.230.177:8008';

export async function analyzeHazardPhotos(files: File[]): Promise<unknown> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE}/vision/analyze-hazard-photos`, {
    method: 'POST',
    body: formData,
    headers: {
      // multipart/form-data는 브라우저가 boundary 자동 설정
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 오류 (${res.status}): ${text || res.statusText}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return res.text();
}
