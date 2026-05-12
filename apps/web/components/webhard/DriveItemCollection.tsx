'use client';

import { DriveItemGrid } from '@/components/webhard/DriveItemGrid';
import { DriveItemList } from '@/components/webhard/DriveItemList';
import styles from '@/components/webhard/WebhardShared.module.css';
import type { DriveItemViewModel, DriveShareViewModel, ListingMode } from '@/lib/webhard/driveTypes';

export function DriveItemCollection({
  isLoading,
  items,
  listingMode,
  onOpenFolder,
  onSelectItem,
  selectedItemId,
  shares,
}: {
  isLoading: boolean;
  items: DriveItemViewModel[];
  listingMode: ListingMode;
  onOpenFolder: (folderId: string) => void;
  onSelectItem: (itemId: string) => void;
  selectedItemId: string;
  shares: DriveShareViewModel[];
}) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <strong>{isLoading ? '자료를 불러오는 중입니다.' : '표시할 자료가 없습니다.'}</strong>
        <span className={styles.muted}>새 폴더를 만들거나 파일을 업로드해 자료함을 시작해 주세요.</span>
      </div>
    );
  }

  if (listingMode === 'grid') {
    return <DriveItemGrid items={items} onOpenFolder={onOpenFolder} onSelectItem={onSelectItem} />;
  }

  return (
    <DriveItemList
      items={items}
      onOpenFolder={onOpenFolder}
      onSelectItem={onSelectItem}
      selectedItemId={selectedItemId}
      shares={shares}
    />
  );
}
