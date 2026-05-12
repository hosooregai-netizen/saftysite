'use client';

import type { ChangeEvent, RefObject } from 'react';
import { DriveIcon } from '@/features/drive/DriveIcons';
import styles from '@/features/drive/DriveWorkspace.module.css';
import type { DriveCreateKind } from '@/features/drive/types';

export function DriveCreateMenu({
  createKind,
  createLinkUrl,
  createMenuOpen,
  createName,
  createNoteBody,
  onBeginCreate,
  onCloseCreate,
  onSaveCreate,
  onUploadChange,
  onUploadFolderChange,
  setCreateLinkUrl,
  setCreateMenuOpen,
  setCreateName,
  setCreateNoteBody,
  folderUploadInputRef,
  uploadInputRef,
}: {
  createKind: DriveCreateKind;
  createLinkUrl: string;
  createMenuOpen: boolean;
  createName: string;
  createNoteBody: string;
  folderUploadInputRef?: RefObject<HTMLInputElement | null>;
  onBeginCreate: (kind: Exclude<DriveCreateKind, null>) => void;
  onCloseCreate: () => void;
  onSaveCreate: () => void;
  onUploadChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadFolderChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  setCreateLinkUrl: (value: string) => void;
  setCreateMenuOpen: (value: boolean) => void;
  setCreateName: (value: string) => void;
  setCreateNoteBody: (value: string) => void;
  uploadInputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div className={styles.createMenu}>
        <button
          type="button"
          className={styles.createButton}
          aria-label="새로 만들기"
          onClick={() => setCreateMenuOpen(!createMenuOpen)}
        >
          <DriveIcon name="plus" />
          <span>새로 만들기</span>
        </button>
        {uploadInputRef ? <input ref={uploadInputRef} hidden type="file" multiple onChange={onUploadChange} /> : null}
        {folderUploadInputRef ? (
          <input
            ref={folderUploadInputRef}
            hidden
            type="file"
            multiple
            onChange={onUploadFolderChange}
            {...({ directory: 'true', webkitdirectory: 'true' } as Record<string, string>)}
          />
        ) : null}
        {createMenuOpen ? (
          <div className={styles.createMenuPopover}>
            <div className={styles.createMenuList}>
              <button type="button" className={styles.createMenuButton} onClick={() => onBeginCreate('folder')}>
                <strong>새 폴더</strong>
                <span className={styles.muted}>현재 위치에 새 폴더를 만듭니다.</span>
              </button>
              <button
                type="button"
                className={styles.createMenuButton}
                onClick={() => {
                  setCreateMenuOpen(false);
                  uploadInputRef?.current?.click();
                }}
              >
                <strong>파일 업로드</strong>
                <span className={styles.muted}>현재 위치에 파일을 바로 추가합니다.</span>
              </button>
              <button
                type="button"
                className={styles.createMenuButton}
                onClick={() => {
                  setCreateMenuOpen(false);
                  folderUploadInputRef?.current?.click();
                }}
              >
                <strong>폴더 업로드</strong>
                <span className={styles.muted}>폴더 구조를 유지한 채 자료를 올립니다.</span>
              </button>
              <button type="button" className={styles.createMenuButton} onClick={() => onBeginCreate('note')}>
                <strong>새 메모</strong>
                <span className={styles.muted}>텍스트 메모를 자료함 안에 저장합니다.</span>
              </button>
              <button type="button" className={styles.createMenuButton} onClick={() => onBeginCreate('link')}>
                <strong>새 링크</strong>
                <span className={styles.muted}>외부 문서나 페이지 링크를 보관합니다.</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {createKind ? (
        <div className={styles.createDialogScrim} role="presentation" onClick={onCloseCreate}>
          <section className={styles.createDialog} role="dialog" aria-modal="true" aria-label="새 항목 만들기" onClick={(event) => event.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <div>
                <strong>{createKind === 'folder' ? '새 폴더' : createKind === 'note' ? '새 메모' : '새 링크'}</strong>
                <p className={styles.muted}>현재 위치에 저장할 항목 정보를 입력해 주세요.</p>
              </div>
              <button type="button" className={styles.toolbarIconButton} aria-label="닫기" onClick={onCloseCreate}>
                <DriveIcon name="close" />
              </button>
            </div>
            <div className={styles.dialogGrid}>
              <label className={styles.detailField}>
                <span className={styles.fieldLabel}>이름</span>
                <input className={styles.detailInput} value={createName} onChange={(event) => setCreateName(event.target.value)} />
              </label>
              {createKind === 'link' ? (
                <label className={styles.detailField}>
                  <span className={styles.fieldLabel}>링크 주소</span>
                  <input
                    className={styles.detailInput}
                    value={createLinkUrl}
                    onChange={(event) => setCreateLinkUrl(event.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
              ) : null}
              {createKind === 'note' ? (
                <label className={styles.detailField}>
                  <span className={styles.fieldLabel}>메모 내용</span>
                  <textarea className={styles.detailInput} rows={8} value={createNoteBody} onChange={(event) => setCreateNoteBody(event.target.value)} />
                </label>
              ) : null}
            </div>
            <div className={styles.dialogFooter}>
              <button type="button" className="erp-button erp-button-secondary" onClick={onCloseCreate}>
                취소
              </button>
              <button type="button" className="erp-button erp-button-primary" onClick={onSaveCreate}>
                저장
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
