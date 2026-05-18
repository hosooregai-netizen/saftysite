'use client';

import { useRef, useState } from 'react';
import { assetUrlToFile } from '@/components/session/workspace/doc7Ai';
import type { PhotoAlbumItem } from '@/types/photos';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';

interface UseMobileInspectionPhotoPickerOptions { siteId?: string }

export function useMobileInspectionPhotoPicker({ siteId }: UseMobileInspectionPhotoPickerOptions) {
  const photoPickerGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const photoPickerCameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoSourceTargetRef = useRef<MobilePhotoSourceTarget | null>(null);
  const [isPhotoSourceModalOpen, setIsPhotoSourceModalOpen] = useState(false);
  const [isPhotoAlbumModalOpen, setIsPhotoAlbumModalOpen] = useState(false);
  const [photoSourceTitle, setPhotoSourceTitle] = useState('사진 가져오기');

  const resetPhotoSourceTarget = () => {
    photoSourceTargetRef.current = null;
  };

  const closePhotoSourceModal = () => {
    setIsPhotoSourceModalOpen(false);
  };

  const closePhotoAlbumModal = () => {
    setIsPhotoAlbumModalOpen(false);
    resetPhotoSourceTarget();
  };

  const openPhotoSourcePicker = (target: MobilePhotoSourceTarget) => {
    photoSourceTargetRef.current = target;
    setPhotoSourceTitle(`${target.fieldLabel} 사진 가져오기`);
    setIsPhotoSourceModalOpen(true);
  };

  const handlePhotoSourceInputChange = async (
    files: FileList | null,
    input: HTMLInputElement | null,
  ) => {
    const file = Array.from(files ?? []).find((item) => item.size > 0);
    if (!file) {
      if (input) {
        input.value = '';
      }
      resetPhotoSourceTarget();
      return;
    }

    const target = photoSourceTargetRef.current;
    if (!target) {
      if (input) {
        input.value = '';
      }
      return;
    }

    try {
      await Promise.resolve(target.onFileSelected(file));
    } finally {
      if (input) {
        input.value = '';
      }
      resetPhotoSourceTarget();
    }
  };

  const openPhotoSourceCamera = () => {
    setIsPhotoSourceModalOpen(false);
    requestAnimationFrame(() => photoPickerCameraInputRef.current?.click());
  };

  const openPhotoSourceGallery = () => {
    setIsPhotoSourceModalOpen(false);
    requestAnimationFrame(() => photoPickerGalleryInputRef.current?.click());
  };

  const openPhotoAlbumPicker = () => {
    setIsPhotoSourceModalOpen(false);
    setIsPhotoAlbumModalOpen(true);
  };

  const handlePhotoSlotKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    action: () => void,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const handlePhotoAlbumSelect = async (item: PhotoAlbumItem) => {
    const target = photoSourceTargetRef.current;
    if (!target) {
      return;
    }

    if (target.onAlbumSelected) {
      await Promise.resolve(target.onAlbumSelected(item));
    } else {
      const file = await assetUrlToFile(item.originalUrl || item.previewUrl, item.fileName || 'photo.jpg');
      await Promise.resolve(target.onFileSelected(file));
    }
    setIsPhotoAlbumModalOpen(false);
    resetPhotoSourceTarget();
  };

  return {
    closePhotoAlbumModal,
    closePhotoSourceModal,
    handlePhotoAlbumSelect,
    handlePhotoSlotKeyDown,
    handlePhotoSourceInputChange,
    isPhotoAlbumModalOpen,
    isPhotoSourceModalOpen,
    openPhotoAlbumPicker,
    openPhotoSourceCamera,
    openPhotoSourceGallery,
    openPhotoSourcePicker,
    photoPickerCameraInputRef,
    photoPickerGalleryInputRef,
    photoSourceTitle,
    resetPhotoSourceTarget,
    siteId,
  };
}
