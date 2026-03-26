'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppModal from '@/components/ui/AppModal';

interface UseImageSourcePickerOptions {
  title?: string;
  /** 갤러리·파일 탐색기 (기본: 파일 선택) */
  fileButtonLabel?: string;
  /** 카메라 촬영 (기본: 카메라) */
  cameraButtonLabel?: string;
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
  title = '사진 불러오기',
  fileButtonLabel = '파일 선택',
  cameraButtonLabel = '카메라',
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
    if (isPortableEnvironment) {
      setIsChoiceOpen(true);
      return;
    }

    galleryInputRef.current?.click();
  }, [isPortableEnvironment]);

  const openGallery = useCallback(() => {
    setIsChoiceOpen(false);
    requestAnimationFrame(() => galleryInputRef.current?.click());
  }, []);

  const openCamera = useCallback(() => {
    setIsChoiceOpen(false);
    requestAnimationFrame(() => cameraInputRef.current?.click());
  }, []);

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
          <button type="button" onClick={closeChoice} className="app-button app-button-secondary">
            취소
          </button>
          <button type="button" onClick={openGallery} className="app-button app-button-secondary">
            {fileButtonLabel}
          </button>
          <button type="button" onClick={openCamera} className="app-button app-button-primary">
            {cameraButtonLabel}
          </button>
        </>
      }
    >
      <p>카메라로 촬영하거나 기기에서 파일을 선택하세요.</p>
    </AppModal>
  );

  return {
    galleryInputRef,
    cameraInputRef,
    requestPick,
    pickerModal,
  };
}

