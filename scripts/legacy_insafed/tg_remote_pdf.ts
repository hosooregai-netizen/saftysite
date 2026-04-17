const DEFAULT_UPSTREAM = 'http://52.64.85.49:8011/api/v1';
const REMOTE_TIMEOUT_MS = 30000;

function toPdfName(filename: string) {
  return filename.replace(/\.[^.]+$/, '') || 'inspection-report';
}

function getRemoteUrl() {
  const explicit = process.env.HWPX_PDF_CONVERTER_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const base = (process.env.SAFETY_API_UPSTREAM_BASE_URL || DEFAULT_UPSTREAM).trim();
  return `${new URL(base).origin}/api/v1/documents/inspection/pdf`;
}

function getApiKey() {
  const key =
    process.env.HWPX_PDF_API_KEY?.trim() ||
    process.env.WINDOWS_HWPX_PDF_API_KEY?.trim() ||
    process.env.SAFETY_INTERNAL_API_KEY?.trim() ||
    process.env.INTERNAL_API_KEY?.trim();
  if (!key) throw new Error('Missing HWPX_PDF_API_KEY for remote PDF conversion.');
  return key;
}

export async function convertHwpxBufferToPdfRemote(hwpxBuffer: Buffer, filename: string) {
  const form = new FormData();
  form.append(
    'file',
    new File([new Uint8Array(hwpxBuffer)], filename || 'inspection-report.hwpx', {
      type: 'application/haansofthwpx',
    }),
  );
  form.append('filename', filename || 'inspection-report.hwpx');

  const response = await fetch(getRemoteUrl(), {
    method: 'POST',
    headers: { 'X-Internal-Api-Key': getApiKey() },
    body: form,
    signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Remote PDF conversion failed: ${response.status} ${await response.text()}`);
  }
  return {
    filename: `${toPdfName(filename)}.pdf`,
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}
