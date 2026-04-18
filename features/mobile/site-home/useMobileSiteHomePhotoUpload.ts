'use client';

import { useEffect, useState } from 'react';
import { uploadPhotoAlbumAsset } from '@/lib/photos/apiClient';
import { createPhotoThumbnail } from '@/lib/photos/thumbnail';

export function useMobileSiteHomePhotoUpload(siteId: string | null, roundNo: number) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadNotice, setPhotoUploadNotice] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUploadNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhotoUploadNotice(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [photoUploadNotice]);

  const handlePhotoCapture = async (files: FileList | null) => {
    const file = Array.from(files ?? []).find((item) => item.size > 0);
    if (!file || !siteId) {
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError(null);
      setPhotoUploadNotice(null);

      const thumbnail = await createPhotoThumbnail(file).catch(() => null);
      await uploadPhotoAlbumAsset({
        file,
        roundNo: Math.max(1, roundNo || 1),
        siteId,
        thumbnail,
      });
      setPhotoUploadNotice('촬영한 사진을 현장 사진첩에 바로 저장했습니다.');
    } catch (error) {
      setPhotoUploadError(
        error instanceof Error ? error.message : '현장 사진 업로드 중 오류가 발생했습니다.',
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return {
    handlePhotoCapture,
    isUploadingPhoto,
    photoUploadError,
    photoUploadNotice,
  };
}
