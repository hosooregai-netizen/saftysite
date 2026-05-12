import JSZip from 'jszip';
import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { SafetyReport, SafetySite } from '@/types/backend';
import type { PhotoAlbumItem } from '@/types/photos';

interface ResolvedPhotoBinary {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

interface ResolvedPhotoAlbumSelection {
  accessibleSites: SafetySite[];
  items: PhotoAlbumItem[];
  reportsBySiteId: Map<string, SafetyReport[]>;
}

export interface PhotoAlbumDownloadRouteDeps {
  assertDownloadItemLimit: (itemIds: string[]) => void;
  buildDownloadZipEntryName: (item: PhotoAlbumItem) => string;
  downloadSafetyPhotoAssetServer: (
    token: string,
    assetId: string,
    request?: Request | null,
  ) => Promise<Response>;
  loadResolvedPhotoAlbumSelection: (
    token: string,
    request: Request,
    itemIds: string[],
  ) => Promise<ResolvedPhotoAlbumSelection>;
  readRequiredAdminToken: (request: Request) => string;
  resolvePhotoAlbumItemBinary: (
    item: PhotoAlbumItem,
    accessibleSites: SafetySite[],
    reportsBySiteId: Map<string, SafetyReport[]>,
  ) => Promise<ResolvedPhotoBinary>;
}

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
  deps: PhotoAlbumDownloadRouteDeps,
) {
  const response = await deps.downloadSafetyPhotoAssetServer(token, itemId, request);
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get('content-type') || fallbackContentType || 'application/octet-stream',
    fileName: fallbackFileName || 'photo.jpg',
  };
}

async function resolveDownloadBinary(
  token: string,
  request: Request,
  item: PhotoAlbumItem,
  selection: ResolvedPhotoAlbumSelection,
  deps: PhotoAlbumDownloadRouteDeps,
) {
  return item.sourceKind === 'album_upload'
    ? downloadAlbumUploadBinary(token, request, item.id, item.contentType, item.fileName, deps)
    : deps.resolvePhotoAlbumItemBinary(item, selection.accessibleSites, selection.reportsBySiteId);
}

function buildItemDownloadError(
  item: PhotoAlbumItem,
  entryName: string,
  error: unknown,
) {
  const reason = error instanceof Error ? error.message : 'Unknown download error.';
  const fileName = item.fileName || entryName;
  return `Failed to download selected photo item ${item.id} (${fileName}) for ZIP entry ${entryName}: ${reason}`;
}

async function buildDownloadResponse(
  token: string,
  request: Request,
  itemIds: string[],
  deps: PhotoAlbumDownloadRouteDeps,
): Promise<Response> {
  deps.assertDownloadItemLimit(itemIds);

  const selection = await deps.loadResolvedPhotoAlbumSelection(token, request, itemIds);
  const { items: selectedItems } = selection;

  if (selectedItems.length !== itemIds.length) {
    return NextResponse.json(
      { error: 'Some selected photos were not found or are not accessible.' },
      { status: 404 },
    );
  }

  if (selectedItems.length === 1) {
    const item = selectedItems[0];
    const binary = await resolveDownloadBinary(token, request, item, selection, deps);

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
    const entryName = makeUniqueEntryName(deps.buildDownloadZipEntryName(item), takenNames);
    let binary: ResolvedPhotoBinary;

    try {
      binary = await resolveDownloadBinary(token, request, item, selection, deps);
    } catch (error) {
      const message = buildItemDownloadError(item, entryName, error);
      if (error instanceof SafetyServerApiError) {
        throw new SafetyServerApiError(message, error.status);
      }
      throw new Error(message);
    }

    zip.file(entryName, binary.buffer);
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

function buildUnexpectedDownloadErrorResponse(error: unknown) {
  if (error instanceof SafetyServerApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: 'Photo download failed.' }, { status: 500 });
}

export async function handlePhotoAlbumDownloadGet(
  request: Request,
  deps: PhotoAlbumDownloadRouteDeps,
): Promise<Response> {
  try {
    const token = deps.readRequiredAdminToken(request);
    const itemIds = parseItemIdsFromRequest(request);
    return await buildDownloadResponse(token, request, itemIds, deps);
  } catch (error) {
    return buildUnexpectedDownloadErrorResponse(error);
  }
}

export async function handlePhotoAlbumDownloadPost(
  request: Request,
  deps: PhotoAlbumDownloadRouteDeps,
): Promise<Response> {
  try {
    const token = deps.readRequiredAdminToken(request);
    const body = await request.json().catch(() => ({}));
    const itemIds = parseItemIdsFromRequest(request, body);
    return await buildDownloadResponse(token, request, itemIds, deps);
  } catch (error) {
    return buildUnexpectedDownloadErrorResponse(error);
  }
}
