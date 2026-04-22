import {
  deleteSafetyPhotoAssetsServer,
  readRequiredAdminToken,
  updateSafetyPhotoAssetsRoundServer,
} from '@/server/admin/safetyApiServer';
import {
  invalidatePhotoAlbumRouteCache,
  readOrCreatePhotoAlbumRouteResponse,
} from '@/server/photos/routeCache';
import { loadPhotoAlbumList } from '@/server/photos/service';
import {
  handlePhotoAlbumDelete,
  handlePhotoAlbumGet,
  handlePhotoAlbumPatch,
  type PhotoAlbumRouteDeps,
} from './routeHandlers';

export const runtime = 'nodejs';

const photoAlbumRouteDeps: PhotoAlbumRouteDeps = {
  deleteSafetyPhotoAssetsServer,
  invalidatePhotoAlbumRouteCache,
  loadPhotoAlbumList,
  readOrCreatePhotoAlbumRouteResponse,
  readRequiredAdminToken,
  updateSafetyPhotoAssetsRoundServer,
};

export async function GET(request: Request): Promise<Response> {
  return handlePhotoAlbumGet(request, photoAlbumRouteDeps);
}

export async function PATCH(request: Request): Promise<Response> {
  return handlePhotoAlbumPatch(request, photoAlbumRouteDeps);
}

export async function DELETE(request: Request): Promise<Response> {
  return handlePhotoAlbumDelete(request, photoAlbumRouteDeps);
}
