import { NextResponse } from 'next/server';

import {
  buildPhotoAssetsForSiteMemo,
  buildPhotoAlbumItemsFromSites,
  findAccessibleSite,
} from '@/server/photos/album';
import { resolvePhotoAlbumAccessContext } from '@/server/photos/service';
import {
  readRequiredAdminToken,
  SafetyServerApiError,
  updateAdminSite,
  uploadSafetyAssetServer,
} from '@/server/admin/safetyApiServer';
import type { SafetyPhotoAsset } from '@/types/photos';

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

function toIsoString(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return '';
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
}

async function parseExifSummary(input: ArrayBuffer | File) {
  try {
    const exifrModule = await import('exifr');
    const source = input instanceof File ? await input.arrayBuffer() : input;
    const parsed = await exifrModule.parse(source);
    if (!parsed || typeof parsed !== 'object') {
      return {
        capturedAt: '',
        exifJson: null,
        gpsLatitude: null,
        gpsLongitude: null,
      };
    }

    const record = parsed as Record<string, unknown>;
    const gpsLatitude =
      toFiniteNumber(record.latitude) ??
      toFiniteNumber(record.lat) ??
      toFiniteNumber(record.GPSLatitude);
    const gpsLongitude =
      toFiniteNumber(record.longitude) ??
      toFiniteNumber(record.lon) ??
      toFiniteNumber(record.GPSLongitude);

    return {
      capturedAt:
        toIsoString(record.DateTimeOriginal) ||
        toIsoString(record.CreateDate) ||
        toIsoString(record.ModifyDate),
      exifJson: {
        createDate: toIsoString(record.CreateDate),
        dateTimeOriginal: toIsoString(record.DateTimeOriginal),
        gpsLatitude,
        gpsLongitude,
        height: toFiniteNumber(record.ExifImageHeight) ?? toFiniteNumber(record.ImageHeight),
        make: normalizeText(record.Make),
        model: normalizeText(record.Model),
        modifyDate: toIsoString(record.ModifyDate),
        orientation: record.Orientation ?? null,
        width: toFiniteNumber(record.ExifImageWidth) ?? toFiniteNumber(record.ImageWidth),
      },
      gpsLatitude,
      gpsLongitude,
    };
  } catch {
    return {
      capturedAt: '',
      exifJson: null,
      gpsLatitude: null,
      gpsLongitude: null,
    };
  }
}

async function uploadPhotoFile(
  token: string,
  request: Request,
  file: File,
  fallbackName: string,
) {
  const formData = new FormData();
  formData.set('file', file, sanitizeFileName(file.name || fallbackName, fallbackName));
  return uploadSafetyAssetServer(token, formData, request);
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

    const originalBuffer = await originalFile.arrayBuffer();
    const originalUploadFile = new File([originalBuffer], originalFile.name || 'photo-original.jpg', {
      type: originalFile.type || 'image/jpeg',
    });
    const thumbnailUploadFile =
      thumbnailFile instanceof File && thumbnailFile.size > 0
        ? new File([await thumbnailFile.arrayBuffer()], thumbnailFile.name || 'photo-thumbnail.jpg', {
            type: thumbnailFile.type || 'image/jpeg',
          })
        : null;

    const [originalUpload, exifSummary, uploadedThumbnail] = await Promise.all([
      uploadPhotoFile(token, request, originalUploadFile, 'photo-original.jpg'),
      parseExifSummary(originalBuffer),
      thumbnailUploadFile
        ? uploadPhotoFile(token, request, thumbnailUploadFile, 'photo-thumbnail.jpg')
        : Promise.resolve(null),
    ]);

    const nextAsset: SafetyPhotoAsset = {
      capturedAt: exifSummary.capturedAt,
      contentType: originalUpload.content_type || originalFile.type || 'image/jpeg',
      createdAt: new Date().toISOString(),
      exifJson:
        exifSummary.exifJson &&
        Object.values(exifSummary.exifJson).some((value) => value !== null && value !== '')
          ? exifSummary.exifJson
          : null,
      fileName: sanitizeFileName(originalUpload.file_name || originalFile.name, 'photo.jpg'),
      gpsLatitude: exifSummary.gpsLatitude,
      gpsLongitude: exifSummary.gpsLongitude,
      headquarterId: site.headquarter_id,
      id: crypto.randomUUID(),
      originalPath: originalUpload.path,
      sizeBytes: originalUpload.size || originalFile.size,
      siteId: site.id,
      sourceKind: 'album_upload',
      thumbnailPath: uploadedThumbnail?.path || '',
      uploadedByName: access.currentUser.name,
      uploadedByUserId: access.currentUser.id,
    };

    const updatedSite = await updateAdminSite(
      token,
      site.id,
      {
        memo: buildPhotoAssetsForSiteMemo(site, nextAsset),
      },
      request,
    );

    const nextItem =
      buildPhotoAlbumItemsFromSites([updatedSite]).find((item) => item.id === nextAsset.id) ?? null;

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
