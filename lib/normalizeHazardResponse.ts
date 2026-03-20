import type { HazardReportItem } from '@/types/hazard';
import { extractArray, fileToDataUrl } from '@/lib/normalizeHazardResponse/helpers';
import { mapHazardResponseItem } from '@/lib/normalizeHazardResponse/mappers';

export async function normalizeHazardResponse(
  raw: unknown,
  uploadedFiles?: File[]
): Promise<HazardReportItem[]> {
  const array = extractArray(raw);

  if (array.length === 0) {
    const item = mapHazardResponseItem(raw);
    if (uploadedFiles?.[0]) {
      item.photoUrl = await fileToDataUrl(uploadedFiles[0]);
    }
    return [item];
  }

  const items: HazardReportItem[] = [];
  for (let index = 0; index < array.length; index += 1) {
    const item = mapHazardResponseItem(array[index]);
    if (uploadedFiles?.[index]) {
      item.photoUrl = await fileToDataUrl(uploadedFiles[index]);
    }
    items.push(item);
  }

  return items;
}
