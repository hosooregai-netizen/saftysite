import {
  createSafetyApiOptionsResponse,
  proxySafetyApiRequest,
} from '@/lib/safetyApi/proxy';
import { refreshAdminAnalyticsSnapshot } from '@/server/admin/analyticsSnapshot';
import { invalidateAdminDirectorySnapshot } from '@/server/admin/adminDirectorySnapshot';
import {
  invalidateAdminRouteCaches,
  resolveAdminRouteInvalidationTargets,
} from '@/server/admin/adminRouteInvalidation';
import { refreshAdminScheduleSnapshot } from '@/server/admin/scheduleSnapshot';
import { readRequiredAdminToken } from '@/server/admin/safetyApiServer';

export const runtime = 'nodejs';
export const maxDuration = 300;

type SafetyRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function shouldRefreshAdminAnalytics(path: string[], method: string) {
  const normalizedMethod = method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(normalizedMethod)) {
    return false;
  }

  const [root, second] = path;
  // This refresh keeps export/legacy analytics snapshot helpers warm.
  // The analytics dashboard UI itself reads from `/api/admin/dashboard/analytics`.
  if (root === 'reports' && (second === 'upsert' || path[2] === 'status')) {
    return true;
  }

  return root === 'assignments' || root === 'headquarters' || root === 'sites' || root === 'users';
}

function shouldRefreshAdminSchedules(path: string[], method: string) {
  const normalizedMethod = method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(normalizedMethod)) {
    return false;
  }

  const [root] = path;
  return root === 'assignments' || root === 'headquarters' || root === 'sites' || root === 'users';
}

function shouldInvalidateAdminDirectory(path: string[], method: string) {
  const normalizedMethod = method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(normalizedMethod)) {
    return false;
  }

  const [root] = path;
  return root === 'assignments' || root === 'headquarters' || root === 'sites' || root === 'users';
}

async function handleRequest(
  request: Request,
  context: SafetyRouteContext
): Promise<Response> {
  const { path = [] } = await context.params;
  const response = await proxySafetyApiRequest(request, path);

  if (response.ok && shouldRefreshAdminAnalytics(path, request.method)) {
    try {
      const token = readRequiredAdminToken(request);
      await refreshAdminAnalyticsSnapshot(token, request);
    } catch {
      // Worker writes or unauthenticated proxy calls should not fail because analytics refresh is best effort.
    }
  }

  if (response.ok && shouldRefreshAdminSchedules(path, request.method)) {
    try {
      const token = readRequiredAdminToken(request);
      await refreshAdminScheduleSnapshot(token, request);
    } catch {
      // Snapshot refresh is best effort for proxy writes.
    }
  }

  if (response.ok && shouldInvalidateAdminDirectory(path, request.method)) {
    invalidateAdminDirectorySnapshot();
  }

  if (response.ok) {
    invalidateAdminRouteCaches(resolveAdminRouteInvalidationTargets(path, request.method));
  }

  return response;
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
