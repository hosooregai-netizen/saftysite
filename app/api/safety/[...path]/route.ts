import {
  createSafetyApiOptionsResponse,
  proxySafetyApiRequest,
} from '@/lib/safetyApi/proxy';

export const runtime = 'nodejs';

type SafetyRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

async function handleRequest(
  request: Request,
  context: SafetyRouteContext
): Promise<Response> {
  const { path = [] } = await context.params;
  return proxySafetyApiRequest(request, path);
}

export function OPTIONS(): Response {
  return createSafetyApiOptionsResponse();
}

export function GET(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}

export function POST(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}

export function PUT(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}

export function PATCH(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}

export function DELETE(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}

export function HEAD(request: Request, context: SafetyRouteContext): Promise<Response> {
  return handleRequest(request, context);
}
