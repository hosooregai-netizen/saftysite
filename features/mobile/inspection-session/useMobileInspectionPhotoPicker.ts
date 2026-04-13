'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { assetUrlToFile } from '@/components/session/workspace/doc7Ai';
import { fetchPhotoAlbum } from '@/lib/photos/apiClient';
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
  const [photoAlbumQuery, setPhotoAlbumQuery] = useState('');
  const [photoAlbumRows, setPhotoAlbumRows] = useState<PhotoAlbumItem[]>([]);
  const [photoAlbumLoading, setPhotoAlbumLoading] = useState(false);
  const [photoAlbumError, setPhotoAlbumError] = useState<string | null>(null);
  const [photoAlbumSelectingId, setPhotoAlbumSelectingId] = useState<string | null>(null);
  const deferredPhotoAlbumQuery = useDeferredValue(photoAlbumQuery.trim());

  useEffect(() => {
    if (!isPhotoAlbumModalOpen || !siteId) {
      return;
    }

    let cancelled = false;
    setPhotoAlbumLoading(true);
    setPhotoAlbumError(null);

    void fetchPhotoAlbum({
      all: true,
      query: deferredPhotoAlbumQuery,
      siteId,
      sortBy: 'capturedAt',
      sortDir: 'desc',
    })
      .then((response) => {
        if (!cancelled) {
          setPhotoAlbumRows(response.rows);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPhotoAlbumRows([]);
          setPhotoAlbumError(
            error instanceof Error ? error.message : '사진첩을 불러오지 못했습니다.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPhotoAlbumLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredPhotoAlbumQuery, isPhotoAlbumModalOpen, siteId]);

  const resetPhotoSourceTarget = () => {
    photoSourceTargetRef.current = null;
  };

  const closePhotoSourceModal = () => {
    setIsPhotoSourceModalOpen(false);
  };

  const closePhotoAlbumModal = () => {
    setIsPhotoAlbumModalOpen(false);
    setPhotoAlbumQuery('');
    setPhotoAlbumError(null);
    setPhotoAlbumSelectingId(null);
    resetPhotoSourceTarget();
  };

  const openPhotoSourcePicker = (target: MobilePhotoSourceTarget) => {
    photoSourceTargetRef.current = target;
    setPhotoSourceTitle(`${target.fieldLabel} 사진 가져오기`);
    setPhotoAlbumError(null);
    setPhotoAlbumQuery('');
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
    setPhotoAlbumError(null);
    setPhotoAlbumQuery('');
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

    try {
      setPhotoAlbumSelectingId(item.id);
      setPhotoAlbumError(null);
      if (target.onAlbumSelected) {
        await Promise.resolve(target.onAlbumSelected(item));
      } else {
        const file = await assetUrlToFile(item.previewUrl, item.fileName || 'photo.jpg');
        await Promise.resolve(target.onFileSelected(file));
      }
      setIsPhotoAlbumModalOpen(false);
      setPhotoAlbumQuery('');
      setPhotoAlbumError(null);
      resetPhotoSourceTarget();
    } catch (error) {
      setPhotoAlbumError(
        error instanceof Error ? error.message : '사진을 반영하는 중 오류가 발생했습니다.',
      );
    } finally {
      setPhotoAlbumSelectingId(null);
    }
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
    photoAlbumError,
    photoAlbumLoading,
    photoAlbumQuery,
    photoAlbumRows,
    photoAlbumSelectingId,
    photoPickerCameraInputRef,
    photoPickerGalleryInputRef,
    photoSourceTitle,
    resetPhotoSourceTarget,
    setPhotoAlbumQuery,
  };
}
