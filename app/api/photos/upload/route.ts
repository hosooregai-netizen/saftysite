import {
  uploadSafetyPhotoAssetServer,
  readRequiredAdminToken,
} from '@/server/admin/safetyApiServer';
import { invalidatePhotoAlbumRouteCache } from '@/server/photos/routeCache';
import {
  handlePhotoAlbumUploadPost,
  type PhotoAlbumUploadRouteDeps,
} from './routeHandlers';

export const runtime = 'nodejs';

const photoAlbumUploadRouteDeps: PhotoAlbumUploadRouteDeps = {
  invalidatePhotoAlbumRouteCache,
  readRequiredAdminToken,
  uploadSafetyPhotoAssetServer,
};

export async function POST(request: Request): Promise<Response> {
  return handlePhotoAlbumUploadPost(request, photoAlbumUploadRouteDeps);
}
