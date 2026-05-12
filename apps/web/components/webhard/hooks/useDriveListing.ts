'use client';

import { useDeferredValue, useMemo } from 'react';
import type { DriveItemViewModel, DriveShareViewModel, NavigationMode, SortMode } from '@/lib/webhard/driveTypes';

function sortItems(items: DriveItemViewModel[], sortMode: SortMode) {
  return [...items].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'folder' ? -1 : 1;
    }
    if (sortMode === 'updated') {
      return right.updatedAt.localeCompare(left.updatedAt);
    }
    if (sortMode === 'size') {
      return right.sizeBytes - left.sizeBytes;
    }
    if (sortMode === 'type') {
      return `${left.fileType || left.kind}`.localeCompare(`${right.fileType || right.kind}`, 'ko');
    }
    return left.name.localeCompare(right.name, 'ko');
  });
}

export function useDriveListing(input: {
  currentParentId: string | null;
  items: DriveItemViewModel[];
  navigationMode: NavigationMode;
  query: string;
  shares: DriveShareViewModel[];
  sortMode: SortMode;
}) {
  const { currentParentId, items, navigationMode, shares, sortMode } = input;
  const deferredQuery = useDeferredValue(input.query);

  const visibleItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const sharedIds = new Set(
      shares.filter((share) => !share.isRevoked).map((share) => share.itemId),
    );
    let baseRows = items;
    if (navigationMode === 'trash') {
      baseRows = items.filter((item) => item.isDeleted);
    } else if (navigationMode === 'shared') {
      baseRows = items.filter((item) => !item.isDeleted && sharedIds.has(item.id));
    } else if (navigationMode === 'recent') {
      baseRows = items.filter((item) => !item.isDeleted);
    } else {
      baseRows = items.filter((item) => !item.isDeleted && (item.parentId || null) === currentParentId);
    }
    if (normalizedQuery) {
      baseRows = baseRows.filter((item) =>
        [item.name, item.textContent, item.externalUrl, item.contentType].join(' ').toLowerCase().includes(normalizedQuery),
      );
    }
    const sorted = sortItems(baseRows, sortMode);
    return navigationMode === 'recent' ? sorted.slice(0, 24) : sorted;
  }, [currentParentId, deferredQuery, items, navigationMode, shares, sortMode]);

  return {
    visibleItems,
  };
}
