const DEFAULT_API_BASE = 'http://35.76.230.177:8008';

function getApiBase(): string {
  return (process.env.SAFETY_API_BASE || DEFAULT_API_BASE).replace(/\/$/, '');
}

export async function proxyVisionRequest(
  request: Request,
  path: string
): Promise<Response> {
  const incomingFormData = await request.formData();
  const upstreamFormData = new FormData();
  let fileCount = 0;

  for (const value of incomingFormData.getAll('files')) {
    if (value instanceof File) {
      upstreamFormData.append('files', value, value.name);
      fileCount += 1;
    }
  }

  if (fileCount === 0) {
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
