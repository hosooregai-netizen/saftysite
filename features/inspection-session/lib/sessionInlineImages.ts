import type { InspectionSession } from '@/types/inspectionSession';

const INLINE_IMAGE_DATA_URL_PATTERN = /^data:image\//i;

type SessionImageArrayKey =
  | 'document3Scenes'
  | 'document4FollowUps'
  | 'document7Findings'
  | 'document10Measurements'
  | 'document11EducationRecords'
  | 'document12Activities';

type SessionImageArrayItem = {
  id?: string | null;
  [key: string]: unknown;
};

interface SessionImageFieldDescriptor {
  fileNamePrefix: string;
  propertyKey: string;
}

export interface InspectionSessionInlineImageSlot {
  apply: (session: InspectionSession, nextValue: string) => InspectionSession;
  fileName: string;
  fromValue: string;
}

export interface InspectionSessionInlineImageReplacement {
  nextValue: string;
  slot: InspectionSessionInlineImageSlot;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isInlineImageDataUrl(value: string): boolean {
  return INLINE_IMAGE_DATA_URL_PATTERN.test(normalizeText(value));
}

function getMimeTypeFromDataUrl(value: string): string {
  const matched = normalizeText(value).match(/^data:([^;]+);/i);
  return matched?.[1]?.toLowerCase() || 'image/jpeg';
}

function getImageExtensionFromDataUrl(value: string): string {
  const mimeType = getMimeTypeFromDataUrl(value);

  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/bmp':
      return 'bmp';
    default:
      return 'jpg';
  }
}

function buildInlineImageFileName(
  session: InspectionSession,
  prefix: string,
  order: number,
  source: string,
): string {
  const reportNumber =
    typeof session.reportNumber === 'number' && session.reportNumber > 0
      ? String(session.reportNumber)
      : 'draft';

  return `report-${reportNumber}-${prefix}-${order}.${getImageExtensionFromDataUrl(source)}`;
}

function getSessionArrayItems(
  session: InspectionSession,
  arrayKey: SessionImageArrayKey,
): SessionImageArrayItem[] {
  return session[arrayKey] as unknown as SessionImageArrayItem[];
}

function getSessionArrayItemId(item: SessionImageArrayItem, index: number): string {
  const id = normalizeText(item.id);
  return id || `__index_${index}`;
}

function createArrayImageSlots(
  session: InspectionSession,
  arrayKey: SessionImageArrayKey,
  fields: SessionImageFieldDescriptor[],
): InspectionSessionInlineImageSlot[] {
  const slots: InspectionSessionInlineImageSlot[] = [];
  const items = getSessionArrayItems(session, arrayKey);

  items.forEach((item, index) => {
    const itemId = getSessionArrayItemId(item, index);

    fields.forEach(({ fileNamePrefix, propertyKey }) => {
      const fromValue = normalizeText(item[propertyKey]);
      if (!isInlineImageDataUrl(fromValue)) {
        return;
      }

      slots.push({
        apply: (current, nextValue) => {
          const currentItems = getSessionArrayItems(current, arrayKey);
          let changed = false;

          const nextItems = currentItems.map((currentItem, currentIndex) => {
            if (getSessionArrayItemId(currentItem, currentIndex) !== itemId) {
              return currentItem;
            }

            if (normalizeText(currentItem[propertyKey]) !== fromValue) {
              return currentItem;
            }

            changed = true;
            return {
              ...currentItem,
              [propertyKey]: nextValue,
            };
          });

          if (!changed) {
            return current;
          }

          return {
            ...current,
            [arrayKey]: nextItems,
          } as InspectionSession;
        },
        fileName: buildInlineImageFileName(session, fileNamePrefix, index + 1, fromValue),
        fromValue,
      });
    });
  });

  return slots;
}

function collectInspectionSessionInlineImageSlots(
  session: InspectionSession,
): InspectionSessionInlineImageSlot[] {
  return [
    ...createArrayImageSlots(session, 'document3Scenes', [
      { fileNamePrefix: 'doc3-scene', propertyKey: 'photoUrl' },
    ]),
    ...createArrayImageSlots(session, 'document4FollowUps', [
      { fileNamePrefix: 'doc4-before', propertyKey: 'beforePhotoUrl' },
      { fileNamePrefix: 'doc4-after', propertyKey: 'afterPhotoUrl' },
    ]),
    ...createArrayImageSlots(session, 'document7Findings', [
      { fileNamePrefix: 'doc7-photo-1', propertyKey: 'photoUrl' },
      { fileNamePrefix: 'doc7-photo-2', propertyKey: 'photoUrl2' },
    ]),
    ...createArrayImageSlots(session, 'document10Measurements', [
      { fileNamePrefix: 'doc10-measurement', propertyKey: 'photoUrl' },
    ]),
    ...createArrayImageSlots(session, 'document11EducationRecords', [
      { fileNamePrefix: 'doc11-photo', propertyKey: 'photoUrl' },
      { fileNamePrefix: 'doc11-material', propertyKey: 'materialUrl' },
    ]),
    ...createArrayImageSlots(session, 'document12Activities', [
      { fileNamePrefix: 'doc12-photo-1', propertyKey: 'photoUrl' },
      { fileNamePrefix: 'doc12-photo-2', propertyKey: 'photoUrl2' },
    ]),
  ];
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('보고서 이미지 데이터를 다시 읽는 중 오류가 발생했습니다.');
  }

  const blob = await response.blob();
  return new File([blob], fileName, {
    type: blob.type || getMimeTypeFromDataUrl(dataUrl),
  });
}

export function hasInspectionSessionInlineImages(session: InspectionSession): boolean {
  return collectInspectionSessionInlineImageSlots(session).length > 0;
}

export async function createInspectionSessionInlineImageReplacements(
  session: InspectionSession,
  uploadImage: (file: File) => Promise<string>,
): Promise<InspectionSessionInlineImageReplacement[]> {
  const slots = collectInspectionSessionInlineImageSlots(session);
  const uploadedBySource = new Map<string, Promise<string>>();
  const replacements: InspectionSessionInlineImageReplacement[] = [];

  for (const slot of slots) {
    let uploadPromise = uploadedBySource.get(slot.fromValue);

    if (!uploadPromise) {
      uploadPromise = dataUrlToFile(slot.fromValue, slot.fileName).then((file) => uploadImage(file));
      uploadedBySource.set(slot.fromValue, uploadPromise);
    }

    replacements.push({
      nextValue: await uploadPromise,
      slot,
    });
  }

  return replacements;
}

export function applyInspectionSessionInlineImageReplacements(
  session: InspectionSession,
  replacements: InspectionSessionInlineImageReplacement[],
): InspectionSession {
  return replacements.reduce(
    (current, replacement) => replacement.slot.apply(current, replacement.nextValue),
    session,
  );
}
