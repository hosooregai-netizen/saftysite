'use client';

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.84;

function getThumbnailMimeType(originalType: string) {
  if (originalType === 'image/png' || originalType === 'image/webp') {
    return originalType;
  }

  return 'image/jpeg';
}

export async function createPhotoThumbnail(
  file: File,
  options?: {
    maxEdge?: number;
    quality?: number;
  },
): Promise<File | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  const maxEdge = Math.max(320, Math.trunc(options?.maxEdge ?? DEFAULT_MAX_EDGE));
  const quality = Math.min(0.95, Math.max(0.5, options?.quality ?? DEFAULT_QUALITY));
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

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const mimeType = getThumbnailMimeType(file.type);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) {
      return null;
    }

    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}-thumb.${extension}`, {
      type: mimeType,
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
