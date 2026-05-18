'use client';

import { PhotoAlbumPickerModal } from '@/features/photos/components/PhotoAlbumPickerModal';
import type { PhotoAlbumItem } from '@/types/photos';

interface MobileInspectionSessionPhotoAlbumModalProps {
  closePhotoAlbumModal: () => void;
  handlePhotoAlbumSelect: (item: PhotoAlbumItem) => Promise<void>;
  isPhotoAlbumModalOpen: boolean;
  siteId?: string | null;
}

export function MobileInspectionSessionPhotoAlbumModal({
  closePhotoAlbumModal,
  handlePhotoAlbumSelect,
  isPhotoAlbumModalOpen,
  siteId,
}: MobileInspectionSessionPhotoAlbumModalProps) {
  return (
    <PhotoAlbumPickerModal
      open={isPhotoAlbumModalOpen}
      siteId={siteId}
      onClose={closePhotoAlbumModal}
      onSelect={handlePhotoAlbumSelect}
    />
  );
}
