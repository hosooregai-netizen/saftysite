import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';

export interface PhotoAlbumCacheRouteDeps {
  invalidatePhotoAlbumRouteCache: () => void;
  readRequiredAdminToken: (request: Request) => string;
}

export async function handlePhotoAlbumCachePost(
  request: Request,
  deps: PhotoAlbumCacheRouteDeps,
): Promise<Response> {
  try {
    deps.readRequiredAdminToken(request);
    deps.invalidatePhotoAlbumRouteCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '사진첩 캐시를 비우지 못했습니다.',
      },
      { status: 500 },
    );
  }
}
