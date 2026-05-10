'use client';

import { triggerDownload } from '@/lib/fileData';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

export function buildShareUrl(token: string) {
  if (typeof window === 'undefined') {
    return `/share/${token}`;
  }
  return `${window.location.origin}/share/${token}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatSize(sizeBytes: number) {
  if (!sizeBytes) return '-';
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  if (sizeBytes >= 1024) return `${Math.round(sizeBytes / 1024)}KB`;
  return `${sizeBytes}B`;
}

export function isImageContentType(contentType: string) {
  return contentType.startsWith('image/');
}

export function isPdfContentType(contentType: string) {
  return contentType === 'application/pdf';
}

export function isTextLikeItem(item: Pick<DriveItemViewModel, 'contentType' | 'fileType'>) {
  return item.fileType === 'note' || item.contentType.startsWith('text/') || item.contentType.includes('json');
}

export function dataUrlToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  return Uint8Array.from(window.atob(base64), (char) => char.charCodeAt(0));
}

export function triggerDriveDownload(item: Pick<DriveItemViewModel, 'contentType' | 'dataUrl' | 'name' | 'textContent'>) {
  if (item.dataUrl.startsWith('data:')) {
    triggerDownload({
      contentType: item.contentType || 'application/octet-stream',
      data: dataUrlToUint8Array(item.dataUrl),
      filename: item.name,
    });
    return;
  }

  triggerDownload({
    contentType: item.contentType || 'text/plain;charset=utf-8',
    data: item.textContent || '',
    filename: item.name,
  });
}
