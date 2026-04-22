import type { PhotoAlbumListResponse } from '@/types/photos';

const PHOTO_ALBUM_ROUTE_CACHE_TTL_MS = 1000 * 15;
const PHOTO_ALBUM_ROUTE_CACHE_KEY = '__SAFETY_PHOTO_ALBUM_ROUTE_CACHE__';
const PHOTO_ALBUM_ROUTE_IN_FLIGHT_KEY = '__SAFETY_PHOTO_ALBUM_ROUTE_IN_FLIGHT__';

interface PhotoAlbumRouteCacheEntry {
  payload: PhotoAlbumListResponse;
  savedAt: number;
}

interface PhotoAlbumRouteCacheOptions {
  now?: number;
  ttlMs?: number;
}

function getPhotoAlbumRouteCache() {
  const globalRecord = globalThis as typeof globalThis & {
    [PHOTO_ALBUM_ROUTE_CACHE_KEY]?: Map<string, PhotoAlbumRouteCacheEntry>;
  };
  if (!(PHOTO_ALBUM_ROUTE_CACHE_KEY in globalRecord)) {
    globalRecord[PHOTO_ALBUM_ROUTE_CACHE_KEY] = new Map();
  }
  return globalRecord[PHOTO_ALBUM_ROUTE_CACHE_KEY]!;
}

function getPhotoAlbumRouteInFlight() {
  const globalRecord = globalThis as typeof globalThis & {
    [PHOTO_ALBUM_ROUTE_IN_FLIGHT_KEY]?: Map<string, Promise<PhotoAlbumListResponse>>;
  };
  if (!(PHOTO_ALBUM_ROUTE_IN_FLIGHT_KEY in globalRecord)) {
    globalRecord[PHOTO_ALBUM_ROUTE_IN_FLIGHT_KEY] = new Map();
  }
  return globalRecord[PHOTO_ALBUM_ROUTE_IN_FLIGHT_KEY]!;
}

function buildPhotoAlbumRouteCacheKey(request: Request) {
  const url = new URL(request.url);
  return `${request.headers.get('authorization') || ''}:${url.searchParams.toString()}`;
}

function resolveNow(options?: PhotoAlbumRouteCacheOptions) {
  return options?.now ?? Date.now();
}

function resolveTtlMs(options?: PhotoAlbumRouteCacheOptions) {
  return options?.ttlMs ?? PHOTO_ALBUM_ROUTE_CACHE_TTL_MS;
}

export function getCachedPhotoAlbumRouteResponse(
  request: Request,
  options?: PhotoAlbumRouteCacheOptions,
) {
  const cacheKey = buildPhotoAlbumRouteCacheKey(request);
  const cached = getPhotoAlbumRouteCache().get(cacheKey);
  if (!cached) {
    return null;
  }

  if (resolveNow(options) - cached.savedAt >= resolveTtlMs(options)) {
    getPhotoAlbumRouteCache().delete(cacheKey);
    return null;
  }

  return cached.payload;
}

export function setCachedPhotoAlbumRouteResponse(
  request: Request,
  payload: PhotoAlbumListResponse,
  options?: PhotoAlbumRouteCacheOptions,
) {
  getPhotoAlbumRouteCache().set(buildPhotoAlbumRouteCacheKey(request), {
    payload,
    savedAt: resolveNow(options),
  });
}

export function readOrCreatePhotoAlbumRouteResponse(
  request: Request,
  loader: () => Promise<PhotoAlbumListResponse>,
  options?: PhotoAlbumRouteCacheOptions,
) {
  const cached = getCachedPhotoAlbumRouteResponse(request, options);
  if (cached) {
    return Promise.resolve(cached);
  }

  const cacheKey = buildPhotoAlbumRouteCacheKey(request);
  const inFlight = getPhotoAlbumRouteInFlight();
  const existing = inFlight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const nextRequest = Promise.resolve(loader())
    .then((payload) => {
      setCachedPhotoAlbumRouteResponse(request, payload, options);
      return payload;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });
  inFlight.set(cacheKey, nextRequest);
  return nextRequest;
}

export function invalidatePhotoAlbumRouteCache() {
  getPhotoAlbumRouteCache().clear();
  getPhotoAlbumRouteInFlight().clear();
}

