import JSZip from 'jszip';
import { NextResponse } from 'next/server';

import {
  assertDownloadItemLimit,
  buildDownloadZipEntryName,
  resolvePhotoAlbumItemBinary,
} from '@/server/photos/album';
import {
  downloadSafetyPhotoAssetServer,
  readRequiredAdminToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import { loadResolvedPhotoAlbumSelection } from '@/server/photos/service';

export const runtime = 'nodejs';

function encodeDownloadName(value: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(value)}`;
}

function getTimestampToken() {
  return new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
}

function makeUniqueEntryName(name: string, taken: Set<string>) {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }

  const index = name.lastIndexOf('.');
  const base = index >= 0 ? name.slice(0, index) : name;
  const extension = index >= 0 ? name.slice(index) : '';

  let suffix = 2;
  while (taken.has(`${base} (${suffix})${extension}`)) {
    suffix += 1;
  }

  const nextName = `${base} (${suffix})${extension}`;
  taken.add(nextName);
  return nextName;
}

function parseItemIdsFromRequest(request: Request, body?: unknown) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const itemId = (url.searchParams.get('item_id') || '').trim();
    return itemId ? [itemId] : [];
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const rawItems = Array.isArray(record.item_ids)
      ? record.item_ids
      : Array.isArray(record.itemIds)
        ? record.itemIds
        : [];
    return rawItems
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
  }

  return [];
}

async function downloadAlbumUploadBinary(
  token: string,
  request: Request,
  itemId: string,
  fallbackContentType: string,
  fallbackFileName: string,
) {
  const response = await downloadSafetyPhotoAssetServer(token, itemId, request);
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') || fallbackContentType || 'application/octet-stream',
    fileName: fallbackFileName || 'photo.jpg',
  };
}

async function buildDownloadResponse(
  token: string,
  request: Request,
  itemIds: string[],
): Promise<Response> {
  assertDownloadItemLimit(itemIds);

  const selection = await loadResolvedPhotoAlbumSelection(token, request, itemIds);
  const { accessibleSites, items: selectedItems, reportsBySiteId } = selection;

  if (selectedItems.length !== itemIds.length) {
    return NextResponse.json(
      { error: 'Some selected photos were not found or are not accessible.' },
      { status: 404 },
    );
  }

  if (selectedItems.length === 1) {
    const item = selectedItems[0];
    const binary =
      item.sourceKind === 'album_upload'
        ? await downloadAlbumUploadBinary(token, request, item.id, item.contentType, item.fileName)
        : await resolvePhotoAlbumItemBinary(item, accessibleSites, reportsBySiteId);

    return new Response(new Uint8Array(binary.buffer), {
      headers: {
        'Content-Disposition': encodeDownloadName(binary.fileName),
        'Content-Type': binary.contentType || 'application/octet-stream',
      },
      status: 200,
    });
  }

  const zip = new JSZip();
  const takenNames = new Set<string>();

  for (const item of selectedItems) {
    const binary =
      item.sourceKind === 'album_upload'
        ? await downloadAlbumUploadBinary(token, request, item.id, item.contentType, item.fileName)
        : await resolvePhotoAlbumItemBinary(item, accessibleSites, reportsBySiteId);
    zip.file(
      makeUniqueEntryName(buildDownloadZipEntryName(item), takenNames),
      binary.buffer,
    );
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filename = `photo-album-${getTimestampToken()}.zip`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Disposition': encodeDownloadName(filename),
      'Content-Type': 'application/zip',
    },
    status: 200,
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const itemIds = parseItemIdsFromRequest(request);
    return buildDownloadResponse(token, request, itemIds);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Photo download failed.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const body = await request.json().catch(() => ({}));
    const itemIds = parseItemIdsFromRequest(request, body);
    return buildDownloadResponse(token, request, itemIds);
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Photo download failed.' },
      { status: 500 },
    );
  }
}
