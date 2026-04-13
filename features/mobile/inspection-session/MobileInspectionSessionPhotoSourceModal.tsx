'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';

interface MobileInspectionSessionPhotoSourceModalProps {
  closePhotoSourceModal: () => void;
  isPhotoSourceModalOpen: boolean;
  openPhotoAlbumPicker: () => void;
  openPhotoSourceCamera: () => void;
  openPhotoSourceGallery: () => void;
  photoSourceTitle: string;
  resetPhotoSourceTarget: () => void;
}

export function MobileInspectionSessionPhotoSourceModal({
  closePhotoSourceModal,
  isPhotoSourceModalOpen,
  openPhotoAlbumPicker,
  openPhotoSourceCamera,
  openPhotoSourceGallery,
  photoSourceTitle,
  resetPhotoSourceTarget,
}: MobileInspectionSessionPhotoSourceModalProps) {
  return (
    <AppModal
      open={isPhotoSourceModalOpen}
      title={photoSourceTitle}
      onClose={() => {
        closePhotoSourceModal();
        resetPhotoSourceTarget();
      }}
      verticalAlign="center"
      mobileActionsLayout="row"
      actions={
        <>
          <button type="button" className="app-button app-button-primary" onClick={openPhotoSourceCamera}>
            카메라
          </button>
          <button type="button" className="app-button app-button-secondary" onClick={openPhotoAlbumPicker}>
            사진첩
          </button>
          <button type="button" className="app-button app-button-secondary" onClick={openPhotoSourceGallery}>
            파일 선택
          </button>
        </>
      }
    >
      <p className={styles.inlineNotice} style={{ margin: 0 }}>
        사진을 가져올 방법을 선택하세요.
      </p>
    </AppModal>
  );
}
