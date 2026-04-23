'use client';

const DEFAULT_MAX_EDGE = 960;
const DEFAULT_QUALITY = 0.72;
const OPTIMIZED_UPLOAD_MIN_BYTES = Math.floor(4.5 * 1024 * 1024);
const OPTIMIZED_UPLOAD_MAX_EDGE = 2560;
const OPTIMIZED_UPLOAD_QUALITY = 0.78;

function getThumbnailMimeType(originalType: string) {
  if (originalType === 'image/png' || originalType === 'image/webp') {
    return originalType;
  }

  return 'image/jpeg';
}

function canRenderImageFile(file: File) {
  if (!file.type.startsWith('image/')) return false;
  if (/image\/(?:gif|svg\+xml)/i.test(file.type)) return false;
  if (typeof document === 'undefined' || typeof Image === 'undefined') return false;
  return true;
}

function getJpegFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'photo';
  return `${baseName}.jpg`;
}

async function renderImageFile(
  file: File,
  options: {
    fileName: string;
    maxEdge: number;
    mimeType: string;
    quality: number;
  },
): Promise<File | null> {
  if (!canRenderImageFile(file)) {
    return null;
  }

  const maxEdge = Math.max(320, Math.trunc(options.maxEdge));
  const quality = Math.min(0.95, Math.max(0.5, options.quality));
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('이미지 미리보기를 만들지 못했습니다.'));
      nextImage.src = sourceUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      return null;
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    if (options.mimeType === 'image/jpeg') {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, targetWidth, targetHeight);
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, options.mimeType, quality);
    });

    if (!blob) {
      return null;
    }

    return new File([blob], options.fileName, {
      lastModified: file.lastModified,
      type: options.mimeType,
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function createOptimizedPhotoUpload(file: File): Promise<File> {
  if (file.size <= OPTIMIZED_UPLOAD_MIN_BYTES) {
    return file;
  }

  const optimizedFile = await renderImageFile(file, {
    fileName: getJpegFileName(file.name),
    maxEdge: OPTIMIZED_UPLOAD_MAX_EDGE,
    mimeType: 'image/jpeg',
    quality: OPTIMIZED_UPLOAD_QUALITY,
  });

  if (!optimizedFile || optimizedFile.size >= file.size) {
    return file;
  }

  return optimizedFile;
}

export async function createPhotoThumbnail(
  file: File,
  options?: {
    maxEdge?: number;
    quality?: number;
  },
): Promise<File | null> {
  const mimeType = getThumbnailMimeType(file.type);
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return renderImageFile(file, {
    fileName: `${baseName}-thumb.${extension}`,
    maxEdge: options?.maxEdge ?? DEFAULT_MAX_EDGE,
    mimeType,
    quality: options?.quality ?? DEFAULT_QUALITY,
  });
}
