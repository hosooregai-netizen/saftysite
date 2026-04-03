import { NextResponse } from 'next/server';

import {
  buildPhotoAlbumItemsFromSites,
  findAccessibleSite,
} from '@/server/photos/album';
import { resolvePhotoAlbumAccessContext } from '@/server/photos/service';
import {
  uploadSafetyPhotoAssetServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import {
  buildPhotoAlbumItemFromAsset,
  mapBackendPhotoAsset,
} from '@/server/admin/upstreamMappers';

export const runtime = 'nodejs';

const MAX_PHOTO_UPLOAD_BYTES = 50 * 1024 * 1024;

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeFileName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/:*?"<>|]+/g, '-').trim();
  return normalized || fallback;
}

function isImageFile(file: File) {
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|bmp|webp|heic|heif)$/i.test(file.name);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const formData = await request.formData();
    const siteId = normalizeText(formData.get('site_id'));
    const originalFile = formData.get('file');
    const thumbnailFile = formData.get('thumbnail');

    if (!siteId) {
      return NextResponse.json({ error: '업로드할 현장을 선택해 주세요.' }, { status: 400 });
    }

    if (!(originalFile instanceof File) || !originalFile.name) {
      return NextResponse.json({ error: '업로드할 원본 사진 파일이 없습니다.' }, { status: 400 });
    }

    if (!isImageFile(originalFile)) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }

    if (originalFile.size <= 0 || originalFile.size > MAX_PHOTO_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: '50MB 이하의 유효한 사진 파일만 업로드할 수 있습니다.' },
        { status: 400 },
      );
    }

    if (thumbnailFile instanceof File && thumbnailFile.size > MAX_PHOTO_UPLOAD_BYTES) {
      return NextResponse.json({ error: '썸네일 파일 크기가 너무 큽니다.' }, { status: 400 });
    }

    const access = await resolvePhotoAlbumAccessContext(token, request);
    const site = findAccessibleSite(access.accessibleSites, siteId);
    if (!site) {
      return NextResponse.json(
        { error: '이 현장 사진첩에 접근할 권한이 없습니다.' },
        { status: 403 },
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.set(
      'file',
      originalFile,
      sanitizeFileName(originalFile.name || 'photo-original.jpg', 'photo-original.jpg'),
    );
    uploadFormData.set('site_id', site.id);
    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      uploadFormData.set(
        'thumbnail',
        thumbnailFile,
        sanitizeFileName(thumbnailFile.name || 'photo-thumbnail.jpg', 'photo-thumbnail.jpg'),
      );
    }

    const uploadedAsset = mapBackendPhotoAsset(
      await uploadSafetyPhotoAssetServer(token, uploadFormData, request),
    );
    const nextItem =
      buildPhotoAlbumItemFromAsset(uploadedAsset, site) ??
      buildPhotoAlbumItemsFromSites([site]).find((item) => item.id === uploadedAsset.id) ??
      null;

    return NextResponse.json({
      item: nextItem,
      ok: true,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사진 업로드에 실패했습니다.' },
      { status: 500 },
    );
  }
}
