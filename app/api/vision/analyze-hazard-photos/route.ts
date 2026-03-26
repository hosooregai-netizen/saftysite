import { proxyVisionRequest } from '@/lib/visionProxy';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  return proxyVisionRequest(request, '/vision/analyze-hazard-photos');
}

