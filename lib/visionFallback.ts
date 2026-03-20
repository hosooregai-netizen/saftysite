import {
  analyzeAgentFile,
  analyzeHazardFiles,
} from '@/lib/visionFallback/analyzers';

export async function createVisionFallbackResponse(
  path: string,
  files: File[]
): Promise<Response | null> {
  if (path === '/vision/analyze-hazard-photos') {
    const payload = await analyzeHazardFiles(files);
    return Response.json(payload, { status: 200 });
  }

  if (path === '/vision/check-causative-agents') {
    const payload = await analyzeAgentFile(files[0]);
    return Response.json(payload, { status: 200 });
  }

  return null;
}
