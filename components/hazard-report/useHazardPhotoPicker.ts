'use client';

import { type ChangeEvent, useCallback, useState } from 'react';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import { analyzeHazardPhotos } from '@/lib/safetyApi/ai';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';
import type { HazardReportItem } from '@/types/hazard';
import { readFileAsDataUrl, syncRiskAssessmentResult } from './shared';

interface UseHazardPhotoPickerOptions {
  data: HazardReportItem;
  onChange: (data: HazardReportItem) => void;
  onAppendReports?: (reports: HazardReportItem[]) => void;
  onPhotoSelectStart?: () => void;
  photoMode: 'analyze' | 'upload' | 'readonly';
}

export function useHazardPhotoPicker({
  data,
  onChange,
  onAppendReports,
  onPhotoSelectStart,
  photoMode,
}: UseHazardPhotoPickerOptions) {
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const { galleryInputRef, cameraInputRef, requestPick, pickerModal } =
    useImageSourcePicker({ title: '사진 추가' });

  const updateReport = useCallback(
    (patch: Partial<HazardReportItem>) => {
      setPhotoError(null);
      onChange(syncRiskAssessmentResult({ ...data, ...patch }));
    },
    [data, onChange]
  );

  const mergeAnalyzedReport = useCallback(
    (next: HazardReportItem): HazardReportItem =>
      syncRiskAssessmentResult({
        ...data,
        location: next.location || data.location,
        locationDetail: next.locationDetail || data.locationDetail,
        likelihood: next.likelihood || data.likelihood,
        severity: next.severity || data.severity,
        hazardFactors: next.hazardFactors || data.hazardFactors,
        improvementItems: next.improvementItems || data.improvementItems,
        photoUrl: next.photoUrl || data.photoUrl,
        legalInfo: next.legalInfo || data.legalInfo,
        implementationPeriod: next.implementationPeriod || data.implementationPeriod,
        metadata: next.metadata ?? data.metadata,
        objects: next.objects && next.objects.length > 0 ? next.objects : data.objects,
      }),
    [data]
  );

  const handlePhotoChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length === 0 || photoMode === 'readonly') return;

      onPhotoSelectStart?.();
      setIsPhotoLoading(true);
      setPhotoError(null);

      try {
        if (photoMode === 'upload') {
          const [firstPhotoUrl, ...restPhotoUrls] = await Promise.all(
            files.map((file) => readFileAsDataUrl(file))
          );
          if (!firstPhotoUrl) return;

          updateReport({ photoUrl: firstPhotoUrl, metadata: undefined, objects: undefined });
          if (restPhotoUrls.length > 0 && onAppendReports) {
            onAppendReports(
              restPhotoUrls.map((photoUrl) =>
                syncRiskAssessmentResult({
                  ...data,
                  photoUrl,
                  metadata: undefined,
                  objects: undefined,
                })
              )
            );
          }
          return;
        }

        const reports = await normalizeHazardResponse(await analyzeHazardPhotos(files), files);
        const [analyzedReport, ...restReports] = reports;
        if (!analyzedReport) {
          throw new Error('분석 결과를 불러오지 못했습니다.');
        }

        onChange(mergeAnalyzedReport(analyzedReport));
        if (restReports.length > 0 && onAppendReports) onAppendReports(restReports);
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsPhotoLoading(false);
      }
    },
    [data, mergeAnalyzedReport, onAppendReports, onChange, onPhotoSelectStart, photoMode, updateReport]
  );

  const handleRemovePhoto = useCallback(() => {
    if (photoMode === 'readonly') return;
    setPhotoError(null);
    onChange(syncRiskAssessmentResult({ ...data, photoUrl: '', metadata: undefined, objects: undefined }));
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [cameraInputRef, data, galleryInputRef, onChange, photoMode]);

  const openPicker = useCallback(() => {
    if (isPhotoLoading || photoMode === 'readonly') return;
    requestPick();
  }, [isPhotoLoading, photoMode, requestPick]);

  return {
    cameraInputRef,
    galleryInputRef,
    handlePhotoChange,
    handleRemovePhoto,
    isPhotoLoading,
    openPicker,
    photoError,
    pickerModal,
  };
}

