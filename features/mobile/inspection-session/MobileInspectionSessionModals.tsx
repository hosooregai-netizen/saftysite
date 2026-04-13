'use client';

import type { MutableRefObject } from 'react';
import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import type { PhotoAlbumItem } from '@/types/photos';
import AppModal from '@/components/ui/AppModal';
import styles from '@/features/mobile/components/MobileShell.module.css';
import { formatMobilePhotoAlbumDate } from './mobileInspectionSessionHelpers';

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

      <AppModal
        open={isPhotoSourceModalOpen}
        title={photoSourceTitle}
        onClose={() => {
          closePhotoSourceModal();
          resetPhotoSourceTarget();
        }}
        verticalAlign="center"
        mobileActionsLayout="row"
        actions={
          <>
            <button type="button" className="app-button app-button-primary" onClick={openPhotoSourceCamera}>
              카메라
            </button>
            <button type="button" className="app-button app-button-secondary" onClick={openPhotoAlbumPicker}>
              사진첩
            </button>
            <button type="button" className="app-button app-button-secondary" onClick={openPhotoSourceGallery}>
              파일 선택
            </button>
          </>
        }
      >
        <p className={styles.inlineNotice} style={{ margin: 0 }}>
          사진을 가져올 방법을 선택하세요.
        </p>
      </AppModal>

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

      {hasLoadedSessionPayload && session ? (
        <AppModal
          open={documentInfoOpen}
          title="문서정보 확인"
          onClose={() => setDocumentInfoOpen(false)}
          actions={
            <button type="button" className="app-button app-button-secondary" onClick={() => setDocumentInfoOpen(false)}>
              닫기
            </button>
          }
        >
          <div style={{ display: 'grid', gap: '12px' }}>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>현장명</span>
              <input
                className="app-input"
                value={session.meta.siteName}
                placeholder="현장명"
                onChange={(event) => screen.changeMetaField('siteName', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>작성일</span>
              <input
                type="date"
                className="app-input"
                value={session.meta.reportDate}
                onChange={(event) => screen.changeMetaField('reportDate', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>담당</span>
              <input
                className="app-input"
                value={session.meta.drafter}
                placeholder="담당"
                onChange={(event) => screen.changeMetaField('drafter', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>검토</span>
              <input
                className="app-input"
                value={session.meta.reviewer}
                placeholder="검토"
                onChange={(event) => screen.changeMetaField('reviewer', event.target.value)}
              />
            </label>
            <label className={styles.mobileEditorFieldGroup}>
              <span className={styles.mobileEditorFieldLabel}>확인</span>
              <input
                className="app-input"
                value={session.meta.approver}
                placeholder="확인"
                onChange={(event) => screen.changeMetaField('approver', event.target.value)}
              />
            </label>
          </div>
        </AppModal>
      ) : null}

      {hasLoadedSessionPayload && session ? (
        <AppModal
          open={isDoc2ProcessModalOpen}
          title="진행공정 및 특이사항 자동생성"
          onClose={() => setIsDoc2ProcessModalOpen(false)}
          size="large"
          verticalAlign="center"
          actions={
            <>
              <button type="button" className="app-button app-button-secondary" onClick={() => setIsDoc2ProcessModalOpen(false)}>
                닫기
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void handleGenerateDoc2ProcessNotes()}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                {isGeneratingDoc2ProcessNotes ? 'AI 생성 중' : 'AI 생성'}
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={applyDoc2ProcessNotesDraft}
                disabled={isGeneratingDoc2ProcessNotes}
              >
                본문에 반영
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className={styles.inlineNotice} style={{ margin: 0 }}>
              공사개요에 필요한 5개 항목을 입력하면, 개요 2줄은 즉시 정리되고 주요 위험 요인
              2줄은 AI로 생성합니다.
            </p>
            {doc2ProcessError ? (
              <p className={styles.errorNotice} style={{ margin: 0 }}>
                {doc2ProcessError}
              </p>
            ) : null}
            {doc2ProcessNotice ? (
              <p className={styles.inlineNotice} style={{ margin: 0 }}>
                {doc2ProcessNotice}
              </p>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  작업현재 공정
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkContent}
                  onChange={(event) => handleDoc2ProcessFieldChange('processWorkContent', event.target.value)}
                  placeholder="예: 철거작업, 금속작업"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  작업 인원
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processWorkerCount}
                  onChange={(event) => handleDoc2ProcessFieldChange('processWorkerCount', event.target.value)}
                  placeholder="예: 6"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  건설기계 장비
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processEquipment}
                  onChange={(event) => handleDoc2ProcessFieldChange('processEquipment', event.target.value)}
                  placeholder="예: 트럭, 굴착기"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  유해위험기구
                </span>
                <input
                  type="text"
                  className="app-input"
                  value={session.document2Overview.processTools}
                  onChange={(event) => handleDoc2ProcessFieldChange('processTools', event.target.value)}
                  placeholder="예: 핸드브레이커, 용접기"
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                유해위험물질
              </span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processHazardousMaterials}
                onChange={(event) =>
                  handleDoc2ProcessFieldChange('processHazardousMaterials', event.target.value)
                }
                placeholder="예: 페인트, LPG, 용접봉"
              />
            </label>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                padding: '12px',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                4줄 미리보기
              </strong>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#475569',
                }}
              >
                {doc2ProcessNoteDraft}
              </pre>
            </div>
          </div>
        </AppModal>
      ) : null}
    </>
  );
}
