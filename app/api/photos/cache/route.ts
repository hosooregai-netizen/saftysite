import {
  readRequiredAdminToken,
} from '@/server/admin/safetyApiServer';
import { invalidatePhotoAlbumRouteCache } from '@/server/photos/routeCache';

import {
  handlePhotoAlbumCachePost,
  type PhotoAlbumCacheRouteDeps,
} from './routeHandlers';

export const runtime = 'nodejs';

const photoAlbumCacheRouteDeps: PhotoAlbumCacheRouteDeps = {
  invalidatePhotoAlbumRouteCache,
  readRequiredAdminToken,
};

export async function POST(request: Request): Promise<Response> {
  return handlePhotoAlbumCachePost(request, photoAlbumCacheRouteDeps);
}
