'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppModal from '@/components/ui/AppModal';

interface UseImageSourcePickerOptions {
  albumButtonLabel?: string;
  enablePhotoAlbum?: boolean;
  title?: string;
  /** 갤러리·파일 탐색기 (기본: 파일 선택) */
  fileButtonLabel?: string;
  /** 카메라 촬영 (기본: 카메라) */
  cameraButtonLabel?: string;
  onOpenPhotoAlbum?: () => void;
}

function isPortableUploadEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileLikeAgent = /(android|iphone|ipad|ipod|tablet|mobile)/.test(userAgent);

  return coarsePointer || touchPoints > 1 || mobileLikeAgent;
}

export function useImageSourcePicker({
  albumButtonLabel = '사진첩에서 선택',
  enablePhotoAlbum = false,
  title = '사진 불러오기',
  fileButtonLabel = '파일 선택',
  cameraButtonLabel = '카메라',
  onOpenPhotoAlbum,
}: UseImageSourcePickerOptions = {}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isPortableEnvironment, setIsPortableEnvironment] = useState(false);
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pointerMediaQuery = window.matchMedia('(pointer: coarse)');
    const updateEnvironment = () => {
      setIsPortableEnvironment(isPortableUploadEnvironment());
    };

    updateEnvironment();
    if (typeof pointerMediaQuery.addEventListener === 'function') {
      pointerMediaQuery.addEventListener('change', updateEnvironment);
    } else {
      pointerMediaQuery.addListener(updateEnvironment);
    }
    window.addEventListener('resize', updateEnvironment);

    return () => {
      if (typeof pointerMediaQuery.removeEventListener === 'function') {
        pointerMediaQuery.removeEventListener('change', updateEnvironment);
      } else {
        pointerMediaQuery.removeListener(updateEnvironment);
      }
      window.removeEventListener('resize', updateEnvironment);
    };
  }, []);

  const requestPick = useCallback(() => {
    if (isPortableEnvironment || enablePhotoAlbum) {
      setIsChoiceOpen(true);
      return;
    }

    galleryInputRef.current?.click();
  }, [enablePhotoAlbum, isPortableEnvironment]);

  const openGallery = useCallback(() => {
    setIsChoiceOpen(false);
    requestAnimationFrame(() => galleryInputRef.current?.click());
  }, []);

  const openCamera = useCallback(() => {
    setIsChoiceOpen(false);
    requestAnimationFrame(() => cameraInputRef.current?.click());
  }, []);

  const openPhotoAlbum = useCallback(() => {
    setIsChoiceOpen(false);
    onOpenPhotoAlbum?.();
  }, [onOpenPhotoAlbum]);

  const closeChoice = useCallback(() => {
    setIsChoiceOpen(false);
  }, []);

  const pickerModal = (
    <AppModal
      open={isChoiceOpen}
      title={title}
      onClose={closeChoice}
      actions={
        <>
          {isPortableEnvironment && !enablePhotoAlbum ? (
            <button type="button" onClick={closeChoice} className="app-button app-button-secondary">
              취소
            </button>
          ) : null}
          <button type="button" onClick={openGallery} className="app-button app-button-secondary">
            {fileButtonLabel}
          </button>
          {enablePhotoAlbum ? (
            <button type="button" onClick={openPhotoAlbum} className="app-button app-button-primary">
              {albumButtonLabel}
            </button>
          ) : null}
          {isPortableEnvironment ? (
            <button
              type="button"
              onClick={openCamera}
              className={`app-button ${enablePhotoAlbum ? 'app-button-secondary' : 'app-button-primary'}`}
            >
              {cameraButtonLabel}
            </button>
          ) : null}
        </>
      }
    />
  );

  return {
    galleryInputRef,
    cameraInputRef,
    requestPick,
    pickerModal,
  };
}

