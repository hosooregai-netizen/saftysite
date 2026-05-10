import {
  assertDownloadItemLimit,
  buildDownloadZipEntryName,
  resolvePhotoAlbumItemBinary,
} from '@/server/photos/album';
import {
  downloadSafetyPhotoAssetServer,
  readRequiredAdminToken,
} from '@/server/admin/safetyApiServer';
import { loadResolvedPhotoAlbumSelection } from '@/server/photos/service';
import {
  handlePhotoAlbumDownloadGet,
  handlePhotoAlbumDownloadPost,
  type PhotoAlbumDownloadRouteDeps,
} from './routeHandlers';

export const runtime = 'nodejs';

const photoAlbumDownloadRouteDeps: PhotoAlbumDownloadRouteDeps = {
  assertDownloadItemLimit,
  buildDownloadZipEntryName,
  downloadSafetyPhotoAssetServer,
  loadResolvedPhotoAlbumSelection,
  readRequiredAdminToken,
  resolvePhotoAlbumItemBinary,
};

export async function GET(request: Request): Promise<Response> {
  return handlePhotoAlbumDownloadGet(request, photoAlbumDownloadRouteDeps);
}

export async function POST(request: Request): Promise<Response> {
  return handlePhotoAlbumDownloadPost(request, photoAlbumDownloadRouteDeps);
}
