import { META_TOUCH_FALLBACK_SECTION } from '@/components/session/workspace/constants';
import type {
  CurrentHazardFinding,
  InspectionSectionKey,
} from '@/types/inspectionSession';

export interface ChartEntry {
  count: number;
  label: string;
}

const IMAGE_RESIZE_STEPS = [1600, 1280] as const;
const IMAGE_JPEG_QUALITIES = [0.82, 0.74, 0.66, 0.58] as const;
const TARGET_IMAGE_BYTES = 450 * 1024;
const IMAGE_MIN_SAVINGS_RATIO = 0.95;

export function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

export function isImageValue(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (/^data:image\//i.test(normalized) || /^blob:/i.test(normalized)) return true;

  const imagePathPattern = /\.(png|jpe?g|gif|webp|svg|bmp)(?:$|[?#])/i;

  try {
    if (/^https?:\/\//i.test(normalized)) {
      return imagePathPattern.test(new URL(normalized).pathname);
    }

    if (normalized.startsWith('/')) {
      return imagePathPattern.test(new URL(normalized, 'https://preview.local').pathname);
    }
  } catch {
    return imagePathPattern.test(normalized);
  }

  return imagePathPattern.test(normalized);
}

export function formatDateTime(value: string | null): string {
  if (!value) return '저장 대기 중';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function readFileAsDataUrlRaw(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

function isCompressibleImageFile(file: File): boolean {
  return file.type.startsWith('image/') && !/image\/(gif|svg\+xml)/i.test(file.type);
}

function getScaledDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 파일을 불러오는 중 오류가 발생했습니다.'));
    };
    image.src = objectUrl;
  });
}

function drawImageToCanvas(
  image: HTMLImageElement,
  dimensions: { width: number; height: number },
  options?: { fillBackground?: boolean },
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지 압축용 캔버스를 만들 수 없습니다.');
  }

  if (options?.fillBackground) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasHasTransparency(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return false;

  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const totalPixels = width * height;
  const sampleStride = Math.max(1, Math.floor(totalPixels / 12000));

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += sampleStride) {
    if (data[pixelIndex * 4 + 3] < 255) {
      return true;
    }
  }

  return false;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('압축용 이미지를 생성하지 못했습니다.'));
      },
      type,
      quality,
    );
  });
}

function replaceFileExtension(filename: string, nextExtension: string): string {
  const normalized = filename.trim() || 'upload';
  const safeExtension = nextExtension.replace(/^\./, '').trim().toLowerCase() || 'bin';
  const dotIndex = normalized.lastIndexOf('.');
  const stem = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
  return `${stem}.${safeExtension}`;
}

export async function prepareFileForUpload(file: File): Promise<File> {
  if (!isCompressibleImageFile(file)) {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;
    let bestBlob: Blob | null = null;
    let resized = false;

    for (const maxDimension of IMAGE_RESIZE_STEPS) {
      const dimensions = getScaledDimensions(originalWidth, originalHeight, maxDimension);
      const canvas = drawImageToCanvas(image, dimensions);
      resized =
        resized ||
        dimensions.width !== originalWidth ||
        dimensions.height !== originalHeight;

      const preservePng = file.type === 'image/png' && canvasHasTransparency(canvas);

      if (preservePng) {
        const pngBlob = await canvasToBlob(canvas, 'image/png');
        if (!bestBlob || pngBlob.size < bestBlob.size) {
          bestBlob = pngBlob;
        }

        if (pngBlob.size <= TARGET_IMAGE_BYTES) {
          break;
        }

        continue;
      }

      const jpegCanvas = drawImageToCanvas(image, dimensions, { fillBackground: true });

      for (const quality of IMAGE_JPEG_QUALITIES) {
        const jpegBlob = await canvasToBlob(jpegCanvas, 'image/jpeg', quality);
        if (!bestBlob || jpegBlob.size < bestBlob.size) {
          bestBlob = jpegBlob;
        }

        if (jpegBlob.size <= TARGET_IMAGE_BYTES) {
          break;
        }
      }

      if (bestBlob && bestBlob.size <= TARGET_IMAGE_BYTES) {
        break;
      }
    }

    if (!bestBlob) {
      return file;
    }

    const improvedEnough = bestBlob.size < file.size * IMAGE_MIN_SAVINGS_RATIO;
    if (!resized && !improvedEnough) {
      return file;
    }

    const nextExtension = bestBlob.type === 'image/png' ? 'png' : 'jpg';
    return new File([bestBlob], replaceFileExtension(file.name, nextExtension), {
      type: bestBlob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  try {
    const preparedFile = await prepareFileForUpload(file);
    return await readFileAsDataUrlRaw(preparedFile);
  } catch {
    return readFileAsDataUrlRaw(file);
  }
}

export function getMetaTouchSection(currentSection: InspectionSectionKey): InspectionSectionKey {
  if (currentSection === 'doc1' || currentSection === 'doc13' || currentSection === 'doc14') {
    return META_TOUCH_FALLBACK_SECTION;
  }

  return currentSection;
}

export function hasFindingContent(item: CurrentHazardFinding): boolean {
  return Boolean(
    normalizeText(item.photoUrl) ||
      normalizeText(item.photoUrl2) ||
      normalizeText(item.location) ||
      normalizeText(item.hazardDescription) ||
      normalizeText(item.likelihood) ||
      normalizeText(item.severity) ||
      normalizeText(item.accidentType) ||
      normalizeText(item.causativeAgentKey) ||
      normalizeText(item.inspector) ||
      normalizeText(item.emphasis) ||
      normalizeText(item.improvementPlan) ||
      normalizeText(item.legalReferenceTitle) ||
      normalizeText(item.referenceMaterialImage || item.referenceMaterial1) ||
      normalizeText(item.referenceMaterialDescription || item.referenceMaterial2)
  );
}

export function buildCountEntries(
  items: CurrentHazardFinding[],
  getLabel: (item: CurrentHazardFinding) => string
): ChartEntry[] {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const label = normalizeText(getLabel(item));
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label, 'ko-KR');
    });
}

/** 건수 기준 상위 topN개만 두고, 나머지는 otherLabel(기본 '기타')로 합산 */
export function collapseChartEntriesToTopOther(
  entries: ChartEntry[],
  topN: number,
  otherLabel = '기타',
): ChartEntry[] {
  if (entries.length <= topN) {
    return entries.slice();
  }
  const head = entries.slice(0, topN).map((entry) => ({ ...entry }));
  const tailSum = entries.slice(topN).reduce((sum, entry) => sum + entry.count, 0);
  if (tailSum <= 0) {
    return head;
  }
  const otherIndex = head.findIndex((entry) => entry.label === otherLabel);
  if (otherIndex >= 0) {
    const target = head[otherIndex];
    head[otherIndex] = { ...target, count: target.count + tailSum };
    return head;
  }
  return [...head, { label: otherLabel, count: tailSum }];
}
