import 'server-only';

import type { InspectionSession } from '@/types/inspectionSession';

const IMAGE_CONTENT_TYPES = new Set([
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
  'image/webp',
]);

const IMAGE_EXTENSION_TO_MIME: Record<string, string> = {
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

const IMAGE_PATH_PATTERN = /\.(bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;

function isDataImageUrl(value: string): boolean {
  return /^data:image\/[^;,]+;base64,/i.test(value);
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isRelativePath(value: string): boolean {
  return value.startsWith('/');
}

function toAbsoluteUrl(value: string, requestOrigin: string): string | null {
  if (isAbsoluteHttpUrl(value)) return value;
  if (isRelativePath(value)) return new URL(value, requestOrigin).toString();
  return null;
}

function inferImageMimeType(value: string): string | null {
  const match = value.match(/\.([a-z0-9]+)(?:$|[?#])/i);
  if (!match) return null;
  return IMAGE_EXTENSION_TO_MIME[match[1].toLowerCase()] ?? null;
}

function shouldAttemptImageFetch(value: string, options?: { imageLikeOnly?: boolean }): boolean {
  if (!value.trim() || isDataImageUrl(value)) return false;
  if (!isAbsoluteHttpUrl(value) && !isRelativePath(value)) return false;
  if (!options?.imageLikeOnly) return true;
  return IMAGE_PATH_PATTERN.test(value);
}

async function resolveImageAssetValue(
  value: string,
  requestOrigin: string,
  cache: Map<string, Promise<string>>,
  options?: { imageLikeOnly?: boolean }
): Promise<string> {
  const normalized = value.trim();
  if (!shouldAttemptImageFetch(normalized, options)) return value;

  const cached = cache.get(normalized);
  if (cached) {
    return cached;
  }

  const task = (async () => {
    const absoluteUrl = toAbsoluteUrl(normalized, requestOrigin);
    if (!absoluteUrl) return value;

    try {
      const response = await fetch(absoluteUrl, { cache: 'no-store' });
      if (!response.ok) return value;

      const headerContentType = response.headers
        .get('content-type')
        ?.split(';')[0]
        ?.trim()
        ?.toLowerCase();
      const contentType =
        (headerContentType && IMAGE_CONTENT_TYPES.has(headerContentType)
          ? headerContentType
          : inferImageMimeType(absoluteUrl)) ?? null;

      if (!contentType) return value;

      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch {
      return value;
    }
  })();

  cache.set(normalized, task);
  return task;
}

async function resolveSessionAssetUrls(
  session: InspectionSession,
  requestOrigin: string,
  cache: Map<string, Promise<string>>
) {
  await Promise.all(
    session.document3Scenes.map(async (scene) => {
      scene.photoUrl = await resolveImageAssetValue(scene.photoUrl, requestOrigin, cache);
    })
  );

  await Promise.all(
    session.document4FollowUps.map(async (item) => {
      const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
        resolveImageAssetValue(item.beforePhotoUrl, requestOrigin, cache),
        resolveImageAssetValue(item.afterPhotoUrl, requestOrigin, cache),
      ]);
      item.beforePhotoUrl = beforePhotoUrl;
      item.afterPhotoUrl = afterPhotoUrl;
    })
  );

  await Promise.all(
    session.document7Findings.map(async (item) => {
      const [photoUrl, referenceMaterial1, referenceMaterial2] = await Promise.all([
        resolveImageAssetValue(item.photoUrl, requestOrigin, cache),
        resolveImageAssetValue(item.referenceMaterial1, requestOrigin, cache, {
          imageLikeOnly: true,
        }),
        resolveImageAssetValue(item.referenceMaterial2, requestOrigin, cache, {
          imageLikeOnly: true,
        }),
      ]);
      item.photoUrl = photoUrl;
      item.referenceMaterial1 = referenceMaterial1;
      item.referenceMaterial2 = referenceMaterial2;
    })
  );

  await Promise.all(
    session.document11EducationRecords.map(async (item) => {
      const [photoUrl, materialUrl] = await Promise.all([
        resolveImageAssetValue(item.photoUrl, requestOrigin, cache),
        resolveImageAssetValue(item.materialUrl, requestOrigin, cache, {
          imageLikeOnly: true,
        }),
      ]);
      item.photoUrl = photoUrl;
      item.materialUrl = materialUrl;
    })
  );

  await Promise.all(
    session.document12Activities.map(async (item) => {
      item.photoUrl = await resolveImageAssetValue(item.photoUrl, requestOrigin, cache);
    })
  );

  await Promise.all(
    session.document13Cases.map(async (item) => {
      item.imageUrl = await resolveImageAssetValue(item.imageUrl, requestOrigin, cache, {
        imageLikeOnly: true,
      });
    })
  );

  await Promise.all(
    session.document14SafetyInfos.map(async (item) => {
      item.imageUrl = await resolveImageAssetValue(item.imageUrl, requestOrigin, cache, {
        imageLikeOnly: true,
      });
    })
  );
}

export async function resolveInspectionDocumentAssets(
  session: InspectionSession,
  siteSessions: InspectionSession[],
  requestOrigin: string
) {
  const cache = new Map<string, Promise<string>>();
  const resolvedSession = structuredClone(session);
  const resolvedSiteSessions = structuredClone(siteSessions);

  await Promise.all([
    resolveSessionAssetUrls(resolvedSession, requestOrigin, cache),
    ...resolvedSiteSessions.map((item) =>
      resolveSessionAssetUrls(item, requestOrigin, cache)
    ),
  ]);

  return {
    session: resolvedSession,
    siteSessions: resolvedSiteSessions,
  };
}
