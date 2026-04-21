'use client';

import AppModal from '@/components/ui/AppModal';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { isImageValue } from '@/components/session/workspace/utils';

interface Doc7ReferenceMaterialPreviewModalProps {
  description: string;
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  title: string;
}

export function Doc7ReferenceMaterialPreviewModal({
  description,
  imageUrl,
  open,
  onClose,
  title,
}: Doc7ReferenceMaterialPreviewModalProps) {
  const hasImage = isImageValue(imageUrl);

  return (
    <AppModal
      open={open}
      title={title}
      size="large"
      onClose={onClose}
      actions={
        <button
          type="button"
          className="app-button app-button-primary"
          onClick={onClose}
        >
          닫기
        </button>
      }
    >
      <div className={styles.doc7ReferencePreviewModal}>
        {imageUrl.trim() ? (
          hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className={styles.doc7ReferencePreviewImage}
            />
          ) : (
            <div className={styles.doc7ReferencePreviewText}>{imageUrl}</div>
          )
        ) : null}
        <div className={styles.doc7ReferencePreviewText}>
          {description.trim() || '표시할 참고자료가 없습니다.'}
        </div>
      </div>
    </AppModal>
  );
}
