'use client';

import layoutStyles from '@/components/WebhardScreen.module.css';
import styles from '@/components/webhard/WebhardShared.module.css';
import type { CreateMode } from '@/lib/webhard/driveTypes';

export function DriveCreatePanel({
  createMode,
  linkUrl,
  nameInput,
  noteBody,
  onCancel,
  onSave,
  setLinkUrl,
  setNameInput,
  setNoteBody,
}: {
  createMode: Exclude<CreateMode, null>;
  linkUrl: string;
  nameInput: string;
  noteBody: string;
  onCancel: () => void;
  onSave: () => void;
  setLinkUrl: (value: string) => void;
  setNameInput: (value: string) => void;
  setNoteBody: (value: string) => void;
}) {
  return (
    <article className={layoutStyles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {createMode === 'folder' ? '새 폴더' : createMode === 'note' ? '새 메모' : '새 링크'}
          </h2>
          <p className={styles.cardMeta}>자료를 생성해 현재 폴더에 바로 저장합니다.</p>
        </div>
      </div>
      <label className={styles.fieldStack}>
        <span className={styles.fieldLabel}>이름</span>
        <input className="erp-input" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="이름을 입력하세요." />
      </label>
      {createMode === 'note' ? (
        <label className={styles.fieldStack}>
          <span className={styles.fieldLabel}>내용</span>
          <textarea className="erp-input" rows={10} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="메모 내용을 입력하세요." />
        </label>
      ) : null}
      {createMode === 'link' ? (
        <label className={styles.fieldStack}>
          <span className={styles.fieldLabel}>링크 주소</span>
          <input className="erp-input" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" />
        </label>
      ) : null}
      <div className={styles.detailActions}>
        <button type="button" className="erp-button erp-button-secondary" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="erp-button erp-button-primary" onClick={onSave}>
          저장
        </button>
      </div>
    </article>
  );
}
