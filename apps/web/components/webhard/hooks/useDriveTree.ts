'use client';

import { useMemo } from 'react';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

function compareByName(left: DriveItemViewModel, right: DriveItemViewModel) {
  return left.name.localeCompare(right.name, 'ko');
}

export function useDriveTree(items: DriveItemViewModel[], currentParentId: string | null) {
  const byId = useMemo(() => {
    const nextMap = new Map<string, DriveItemViewModel>();
    items.forEach((item) => {
      nextMap.set(item.id, item);
    });
    return nextMap;
  }, [items]);

  const childrenByParent = useMemo(() => {
    const nextMap = new Map<string | null, DriveItemViewModel[]>();
    items.forEach((item) => {
      const key = item.parentId ?? null;
      const rows = nextMap.get(key);
      if (rows) {
        rows.push(item);
      } else {
        nextMap.set(key, [item]);
      }
    });
    nextMap.forEach((rows) => rows.sort(compareByName));
    return nextMap;
  }, [items]);

  const activeFolders = useMemo(
    () => items.filter((item) => item.kind === 'folder' && !item.isDeleted).sort(compareByName),
    [items],
  );

  const childCountByParent = useMemo(() => {
    const nextMap = new Map<string, number>();
    childrenByParent.forEach((rows, parentId) => {
      if (!parentId) return;
      nextMap.set(
        parentId,
        rows.filter((row) => !row.isDeleted).length,
      );
    });
    return nextMap;
  }, [childrenByParent]);

  const currentPath = useMemo(() => {
    const path: DriveItemViewModel[] = [];
    let cursor = currentParentId ? byId.get(currentParentId) ?? null : null;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      path.push(cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
    }
    return path.reverse();
  }, [byId, currentParentId]);

  const collectDescendantIds = (rootId: string) => {
    const descendantIds = new Set<string>();
    const queue = [rootId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || descendantIds.has(currentId)) continue;
      descendantIds.add(currentId);
      const children = childrenByParent.get(currentId) ?? [];
      children.forEach((child) => queue.push(child.id));
    }
    return descendantIds;
  };

  return {
    activeFolders,
    byId,
    childCountByParent,
    childrenByParent,
    collectDescendantIds,
    currentPath,
  };
}
