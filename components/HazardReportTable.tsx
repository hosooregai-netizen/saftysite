'use client';

import HazardReportContent from '@/components/hazard-report/HazardReportContent';
import { DEFAULT_TEXT, syncRiskAssessmentResult, type HazardReportTableProps } from '@/components/hazard-report/shared';
import { useHazardPhotoPicker } from '@/components/hazard-report/useHazardPhotoPicker';

export default function HazardReportTable({
  data,
  onChange,
  onAppendReports,
  onPhotoSelectStart,
  index,
  headerActions,
  topGridExtraContent,
  text,
  implementationPeriodOptions,
  readOnlyFields,
  hiddenFields,
  photoMode = 'analyze',
  photoGroupExtraContent,
  extraContent,
}: HazardReportTableProps) {
  const {
    cameraInputRef,
    galleryInputRef,
    handlePhotoChange,
    handleRemovePhoto,
    isPhotoLoading,
    openPicker,
    photoError,
    pickerModal,
  } = useHazardPhotoPicker({
    data,
    onAppendReports,
    onChange,
    onPhotoSelectStart,
    photoMode,
  });

  const mergedText = { ...DEFAULT_TEXT, ...text };

  return (
    <HazardReportContent
      cameraInputRef={cameraInputRef}
      data={data}
      extraContent={extraContent}
      galleryInputRef={galleryInputRef}
      handlePhotoChange={(event) => {
        void handlePhotoChange(event);
      }}
      handleRemovePhoto={handleRemovePhoto}
      headerActions={headerActions}
      hiddenFields={hiddenFields}
      implementationPeriodOptions={implementationPeriodOptions}
      index={index}
      isPhotoLoading={isPhotoLoading}
      mergedText={mergedText}
      onChange={(patch) => onChange(syncRiskAssessmentResult({ ...data, ...patch }))}
      openPicker={openPicker}
      photoError={photoError}
      photoGroupExtraContent={photoGroupExtraContent}
      photoMode={photoMode}
      pickerModal={pickerModal}
      readOnlyFields={readOnlyFields}
      topGridExtraContent={topGridExtraContent}
    />
  );
}
