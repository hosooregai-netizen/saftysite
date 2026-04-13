'use client';

import type { PhotoAlbumItem } from '@/types/photos';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { formatMobilePhotoAlbumDate } from './mobileInspectionSessionHelpers';

interface MobileInspectionSessionPhotoAlbumModalProps {
  closePhotoAlbumModal: () => void;
  handlePhotoAlbumSelect: (item: PhotoAlbumItem) => Promise<void>;
  isPhotoAlbumModalOpen: boolean;
  photoAlbumError: string | null;
  photoAlbumLoading: boolean;
  photoAlbumQuery: string;
  photoAlbumRows: PhotoAlbumItem[];
  photoAlbumSelectingId: string | null;
  setPhotoAlbumQuery: (value: string) => void;
}

export function MobileInspectionSessionPhotoAlbumModal({
  closePhotoAlbumModal,
  handlePhotoAlbumSelect,
  isPhotoAlbumModalOpen,
  photoAlbumError,
  photoAlbumLoading,
  photoAlbumQuery,
  photoAlbumRows,
  photoAlbumSelectingId,
  setPhotoAlbumQuery,
}: MobileInspectionSessionPhotoAlbumModalProps) {
  return (
    <AppModal
      open={isPhotoAlbumModalOpen}
      title="사진첩에서 선택"
      onClose={closePhotoAlbumModal}
      size="large"
      actions={
        <button type="button" className="app-button app-button-secondary" onClick={closePhotoAlbumModal}>
          닫기
        </button>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <input
          className="app-input"
          value={photoAlbumQuery}
          onChange={(event) => setPhotoAlbumQuery(event.target.value)}
          placeholder="파일명, 현장명, 보고서명, 업로더 검색"
        />
        {photoAlbumError ? (
          <p className={styles.errorNotice} style={{ margin: 0 }}>
            {photoAlbumError}
          </p>
        ) : null}
        {photoAlbumLoading ? (
          <div
            style={{
              minHeight: '220px',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            사진첩을 불러오는 중입니다.
          </div>
        ) : photoAlbumRows.length === 0 ? (
          <div
            style={{
              minHeight: '220px',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '14px',
              textAlign: 'center',
              padding: '16px',
            }}
          >
            선택할 사진이 없습니다.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '10px',
            }}
          >
            {photoAlbumRows.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={photoAlbumSelectingId === item.id}
                onClick={() => {
                  void handlePhotoAlbumSelect(item);
                }}
                style={{
                  display: 'grid',
                  gap: '6px',
                  padding: '6px',
                  border: '1px solid #d7e0eb',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  textAlign: 'left',
                  cursor: photoAlbumSelectingId === item.id ? 'wait' : 'pointer',
                  opacity: photoAlbumSelectingId === item.id ? 0.68 : 1,
                }}
              >
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      backgroundColor: '#e2e8f0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    미리보기 없음
                  </div>
                )}
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.fileName}
                >
                  {item.fileName}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  {formatMobilePhotoAlbumDate(item.capturedAt || item.createdAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppModal>
  );
}
