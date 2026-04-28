import type { PhotoAlbumItem } from '@/types/photos';

export interface PhotoAlbumSortQuery {
  sortBy?: 'capturedAt' | 'createdAt' | 'fileName' | 'siteName';
  sortDir?: 'asc' | 'desc';
}

function compareRoundNoForDisplay(left: number, right: number) {
  if (left <= 0 && right <= 0) return 0;
  if (left <= 0) return 1;
  if (right <= 0) return -1;
  return left - right;
}

export function comparePhotoAlbumItems(
  left: PhotoAlbumItem,
  right: PhotoAlbumItem,
  query: PhotoAlbumSortQuery,
) {
  const sortBy = query.sortBy || 'capturedAt';
  const sortDir = query.sortDir === 'asc' ? 1 : -1;

  if (sortBy === 'fileName') {
    return left.fileName.localeCompare(right.fileName, 'ko') * sortDir;
  }

  if (sortBy === 'siteName') {
    return (
      left.siteName.localeCompare(right.siteName, 'ko') * sortDir ||
      compareRoundNoForDisplay(left.roundNo, right.roundNo) * sortDir ||
      left.createdAt.localeCompare(right.createdAt) * sortDir
    );
  }

  if (sortBy === 'createdAt') {
    return (
      left.createdAt.localeCompare(right.createdAt) * sortDir ||
      left.fileName.localeCompare(right.fileName, 'ko')
    );
  }

  const leftDate = left.capturedAt || left.createdAt;
  const rightDate = right.capturedAt || right.createdAt;

  return (
    left.siteName.localeCompare(right.siteName, 'ko') ||
    compareRoundNoForDisplay(left.roundNo, right.roundNo) ||
    leftDate.localeCompare(rightDate) * sortDir ||
    left.createdAt.localeCompare(right.createdAt) * sortDir ||
    left.fileName.localeCompare(right.fileName, 'ko')
  );
}
