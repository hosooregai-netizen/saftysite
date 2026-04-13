'use client';

import type { KeyboardEventHandler } from 'react';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';

interface MobileInspectionSessionActivityPhotoFieldProps {
  alt: string;
  fieldLabel: string;
  handlePhotoSlotKeyDown: (event: React.KeyboardEvent<HTMLElement>, action: () => void) => void;
  onOpen: () => void;
  onRemove: () => void;
  photoUrl: string;
}

export function MobileInspectionSessionActivityPhotoField({
  alt,
  fieldLabel,
  handlePhotoSlotKeyDown,
  onOpen,
  onRemove,
  photoUrl,
}: MobileInspectionSessionActivityPhotoFieldProps) {
  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) =>
    handlePhotoSlotKeyDown(event, onOpen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600 }}>{fieldLabel}</div>
      <div
        role="button"
        tabIndex={0}
        style={{
          display: 'block',
          width: '100%',
          height: '180px',
          backgroundColor: '#f8fafc',
          border: '1px solid rgba(215, 224, 235, 0.88)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={onOpen}
        onKeyDown={onKeyDown}
      >
        {photoUrl ? (
          <button
            type="button"
            className={workspaceStyles.doc5SummaryDraftBtn}
            style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
          >
            사진 삭제
          </button>
        ) : null}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            사진 업로드
          </div>
        )}
      </div>
    </div>
  );
}
