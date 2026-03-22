import 'server-only';

import { imageSize } from 'image-size';

const EMU_PER_PIXEL = 9525;
const IMAGE_REL_TYPE =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

const MIME_INFO = {
  'image/gif': { contentType: 'image/gif', extension: 'gif' },
  'image/jpeg': { contentType: 'image/jpeg', extension: 'jpeg' },
  'image/jpg': { contentType: 'image/jpeg', extension: 'jpeg' },
  'image/png': { contentType: 'image/png', extension: 'png' },
} as const;

export interface EmbeddedImage {
  contentType: string;
  docPrId: number;
  filename: string;
  heightEmu: number;
  path: string;
  relId: string;
  widthEmu: number;
}

export interface DocumentMediaAsset extends EmbeddedImage {
  buffer: Buffer;
}

export interface InspectionDocContext {
  addImage: (
    src: string,
    options?: { fallbackName?: string; maxHeightPx?: number; maxWidthPx?: number }
  ) => EmbeddedImage | null;
  assets: DocumentMediaAsset[];
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
}

function scaleDimensions(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    height: Math.max(1, Math.round(height * ratio)),
    width: Math.max(1, Math.round(width * ratio)),
  };
}

export function createInspectionDocContext(): InspectionDocContext {
  const assets: DocumentMediaAsset[] = [];
  let assetIndex = 1;

  return {
    assets,
    addImage(src, options) {
      const parsed = src?.trim() ? parseDataUrl(src.trim()) : null;
      if (!parsed) return null;
      const mimeInfo = MIME_INFO[parsed.mime as keyof typeof MIME_INFO];
      if (!mimeInfo) return null;
      const size = imageSize(parsed.buffer);
      if (!size.width || !size.height) return null;
      const scaled = scaleDimensions(
        size.width,
        size.height,
        options?.maxWidthPx ?? 420,
        options?.maxHeightPx ?? 320
      );
      const relId = `rId${assetIndex}`;
      const filename = `${options?.fallbackName ?? 'image'}-${assetIndex}.${mimeInfo.extension}`;
      const asset: DocumentMediaAsset = {
        buffer: parsed.buffer,
        contentType: mimeInfo.contentType,
        docPrId: assetIndex,
        filename,
        heightEmu: scaled.height * EMU_PER_PIXEL,
        path: `media/${filename}`,
        relId,
        widthEmu: scaled.width * EMU_PER_PIXEL,
      };
      assets.push(asset);
      assetIndex += 1;
      return asset;
    },
  };
}

export function buildDocumentRelationships(assets: DocumentMediaAsset[]) {
  const rows = assets
    .map(
      (asset) =>
        `<Relationship Id="${asset.relId}" Type="${IMAGE_REL_TYPE}" Target="${asset.path}"/>`
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows}</Relationships>`;
}

export function buildContentTypeDefaults(assets: DocumentMediaAsset[]) {
  const seen = new Set<string>();
  return assets
    .filter((asset) => {
      if (seen.has(asset.contentType)) return false;
      seen.add(asset.contentType);
      return true;
    })
    .map((asset) => {
      const extension = asset.filename.split('.').pop() ?? 'bin';
      return `<Default Extension="${extension}" ContentType="${asset.contentType}"/>`;
    })
    .join('');
}
