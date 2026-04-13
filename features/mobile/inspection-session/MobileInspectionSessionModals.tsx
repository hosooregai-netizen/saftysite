'use client';

import type { MutableRefObject } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { PhotoAlbumItem } from '@/types/photos';
import { MobileInspectionSessionDoc2ProcessModal } from './MobileInspectionSessionDoc2ProcessModal';
import { MobileInspectionSessionDocumentInfoModal } from './MobileInspectionSessionDocumentInfoModal';
import { MobileInspectionSessionPhotoAlbumModal } from './MobileInspectionSessionPhotoAlbumModal';
import { MobileInspectionSessionPhotoSourceModal } from './MobileInspectionSessionPhotoSourceModal';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionModalsProps {
  applyDoc2ProcessNotesDraft: () => void;
  closePhotoAlbumModal: () => void;
  closePhotoSourceModal: () => void;
  doc2ProcessError: string | null;
  doc2ProcessNotice: string | null;
  doc2ProcessNoteDraft: string;
  handleDoc2ProcessFieldChange: (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => void;
  handleGenerateDoc2ProcessNotes: () => Promise<void>;
  handlePhotoAlbumSelect: (item: PhotoAlbumItem) => Promise<void>;
  handlePhotoSourceInputChange: (
    files: FileList | null,
    input: HTMLInputElement | null,
  ) => Promise<void>;
  hasLoadedSessionPayload: boolean;
  isDoc2ProcessModalOpen: boolean;
  isGeneratingDoc2ProcessNotes: boolean;
  isPhotoAlbumModalOpen: boolean;
  isPhotoSourceModalOpen: boolean;
  openPhotoAlbumPicker: () => void;
  openPhotoSourceCamera: () => void;
  openPhotoSourceGallery: () => void;
  photoAlbumError: string | null;
  photoAlbumLoading: boolean;
  photoAlbumQuery: string;
  photoAlbumRows: PhotoAlbumItem[];
  photoAlbumSelectingId: string | null;
  photoPickerCameraInputRef: MutableRefObject<HTMLInputElement | null>;
  photoPickerGalleryInputRef: MutableRefObject<HTMLInputElement | null>;
  photoSourceTitle: string;
  resetPhotoSourceTarget: () => void;
  screen: InspectionScreenController;
  session: InspectionSessionDraft | null;
  setDocumentInfoOpen: (open: boolean) => void;
  setIsDoc2ProcessModalOpen: (open: boolean) => void;
  setPhotoAlbumQuery: (value: string) => void;
  documentInfoOpen: boolean;
}

export function MobileInspectionSessionModals({
  applyDoc2ProcessNotesDraft,
  closePhotoAlbumModal,
  closePhotoSourceModal,
  doc2ProcessError,
  doc2ProcessNotice,
  doc2ProcessNoteDraft,
  documentInfoOpen,
  handleDoc2ProcessFieldChange,
  handleGenerateDoc2ProcessNotes,
  handlePhotoAlbumSelect,
  handlePhotoSourceInputChange,
  hasLoadedSessionPayload,
  isDoc2ProcessModalOpen,
  isGeneratingDoc2ProcessNotes,
  isPhotoAlbumModalOpen,
  isPhotoSourceModalOpen,
  openPhotoAlbumPicker,
  openPhotoSourceCamera,
  openPhotoSourceGallery,
  photoAlbumError,
  photoAlbumLoading,
  photoAlbumQuery,
  photoAlbumRows,
  photoAlbumSelectingId,
  photoPickerCameraInputRef,
  photoPickerGalleryInputRef,
  photoSourceTitle,
  resetPhotoSourceTarget,
  screen,
  session,
  setDocumentInfoOpen,
  setIsDoc2ProcessModalOpen,
  setPhotoAlbumQuery,
}: MobileInspectionSessionModalsProps) {
  return (
    <>
      <input
        ref={photoPickerGalleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(event) => {
          void handlePhotoSourceInputChange(event.target.files, event.currentTarget);
        }}
      />
      <input
        ref={photoPickerCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          void handlePhotoSourceInputChange(event.target.files, event.currentTarget);
        }}
      />

      <MobileInspectionSessionPhotoSourceModal
        closePhotoSourceModal={closePhotoSourceModal}
        isPhotoSourceModalOpen={isPhotoSourceModalOpen}
        openPhotoAlbumPicker={openPhotoAlbumPicker}
        openPhotoSourceCamera={openPhotoSourceCamera}
        openPhotoSourceGallery={openPhotoSourceGallery}
        photoSourceTitle={photoSourceTitle}
        resetPhotoSourceTarget={resetPhotoSourceTarget}
      />

      <MobileInspectionSessionPhotoAlbumModal
        closePhotoAlbumModal={closePhotoAlbumModal}
        handlePhotoAlbumSelect={handlePhotoAlbumSelect}
        isPhotoAlbumModalOpen={isPhotoAlbumModalOpen}
        photoAlbumError={photoAlbumError}
        photoAlbumLoading={photoAlbumLoading}
        photoAlbumQuery={photoAlbumQuery}
        photoAlbumRows={photoAlbumRows}
        photoAlbumSelectingId={photoAlbumSelectingId}
        setPhotoAlbumQuery={setPhotoAlbumQuery}
      />

      {hasLoadedSessionPayload && session ? (
        <MobileInspectionSessionDocumentInfoModal
          documentInfoOpen={documentInfoOpen}
          screen={screen}
          session={session}
          setDocumentInfoOpen={setDocumentInfoOpen}
        />
      ) : null}

      {hasLoadedSessionPayload && session ? (
        <MobileInspectionSessionDoc2ProcessModal
          applyDoc2ProcessNotesDraft={applyDoc2ProcessNotesDraft}
          doc2ProcessError={doc2ProcessError}
          doc2ProcessNotice={doc2ProcessNotice}
          doc2ProcessNoteDraft={doc2ProcessNoteDraft}
          handleDoc2ProcessFieldChange={handleDoc2ProcessFieldChange}
          handleGenerateDoc2ProcessNotes={handleGenerateDoc2ProcessNotes}
          isDoc2ProcessModalOpen={isDoc2ProcessModalOpen}
          isGeneratingDoc2ProcessNotes={isGeneratingDoc2ProcessNotes}
          session={session}
          setIsDoc2ProcessModalOpen={setIsDoc2ProcessModalOpen}
        />
      ) : null}
    </>
  );
}
