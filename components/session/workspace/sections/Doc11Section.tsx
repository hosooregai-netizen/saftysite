'use client';

import { useState } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';
import { UploadBox } from '@/components/session/workspace/widgets';
import {
  buildLocalDoc11EducationContent,
  generateDoc11EducationContentWithOpenAi,
} from '@/lib/openai/generateDoc11EducationContent';
import { resolveOpenAiApiKey } from '@/lib/openai/browserClient';

export default function Doc11Section(props: SupportSectionProps) {
  const { applyDocumentUpdate, session, withFileData } = props;
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [contentGenNotice, setContentGenNotice] = useState<{ id: string; message: string } | null>(null);
  const [contentGenError, setContentGenError] = useState<{ id: string; message: string } | null>(null);

  const patchRecord = (recordId: string, content: string) =>
    applyDocumentUpdate('doc11', 'derived', (current) => ({
      ...current,
      document11EducationRecords: current.document11EducationRecords.map((record) =>
        record.id === recordId ? { ...record, content } : record,
      ),
    }));

  const handleGenerateEducationContent = async (recordId: string) => {
    const record = session.document11EducationRecords.find((r) => r.id === recordId);
    if (!record) return;

    setContentGenError(null);
    setContentGenNotice(null);
    setGeneratingId(recordId);

    const input = {
      topic: record.topic,
      attendeeCount: record.attendeeCount,
      materialName: record.materialName,
    };

    try {
      if (!resolveOpenAiApiKey()) {
        patchRecord(recordId, buildLocalDoc11EducationContent(input));
        setContentGenNotice({ id: recordId, message: 'OpenAI API 키가 없어 규칙 기반 초안을 넣었습니다.' });
        return;
      }

      const text = await generateDoc11EducationContentWithOpenAi(input);
      patchRecord(recordId, text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setContentGenError({ id: recordId, message });
      patchRecord(recordId, buildLocalDoc11EducationContent(input));
      setContentGenNotice({ id: recordId, message: 'AI 호출에 실패해 규칙 기반 초안으로 대체했습니다.' });
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className={styles.sectionStack}>
      {session.document11EducationRecords.map((item, index) => (
        <article key={item.id} className={`${styles.card} ${styles.doc4Card}`}>
          <div className={styles.doc10CardInner}>
            <div className={styles.doc11EducationPhotoRow}>
              <UploadBox
                id={`education-photo-${item.id}`}
                label="교육 사진"
                labelLayout="field"
                fieldClearOverlay
                value={item.photoUrl}
                onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: '' } : record) }))}
                onSelect={async (file) => withFileData(file, (dataUrl) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, photoUrl: dataUrl } : record) })))}
              />
              <UploadBox
                id={`education-material-${item.id}`}
                label="교육 자료"
                labelLayout="field"
                fieldClearOverlay
                value={item.materialUrl}
                onClear={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: '', materialName: '' } : record) }))}
                onSelect={async (file) => withFileData(file, (dataUrl, selectedFile) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, materialUrl: dataUrl, materialName: selectedFile.name } : record) })))}
              />
            </div>
            {session.document11EducationRecords.length > 1 ? (
              <div className={`${styles.doc7Eyebrow} ${styles.doc7EyebrowWithCardDelete}`}>
                <h3 className={styles.cardTitle}>{`교육 기록 ${index + 1}`}</h3>
              </div>
            ) : null}
            <div className={styles.measurementCardBody}>
              <div className={`${styles.formGrid} ${styles.measurementMetaRow}`}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>참석인원</span>
                  <input type="text" className="app-input" value={item.attendeeCount} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, attendeeCount: event.target.value } : record) }))} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>교육 주제</span>
                  <input type="text" className="app-input" value={item.topic} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, topic: event.target.value } : record) }))} />
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <div className={styles.doc5SummaryFieldHeader}>
                    <span className={styles.fieldLabel}>교육내용</span>
                    {generatingId === item.id ? (
                      <span className={styles.doc3AiInline} role="status" aria-live="polite">
                        <span className={styles.doc3AiSpinner} aria-hidden />
                        <span className={styles.doc3AiCaption}>(ai 생성중)</span>
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={styles.doc5SummaryDraftBtn}
                      disabled={generatingId === item.id}
                      onClick={() => void handleGenerateEducationContent(item.id)}
                    >
                      내용 자동 생성
                    </button>
                  </div>
                  {contentGenError?.id === item.id ? <p className={styles.fieldAssistError}>{contentGenError.message}</p> : null}
                  {contentGenNotice?.id === item.id ? <p className={styles.fieldAssist}>{contentGenNotice.message}</p> : null}
                  <textarea className="app-textarea" value={item.content} onChange={(event) => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.map((record) => record.id === item.id ? { ...record, content: event.target.value } : record) }))} />
                </label>
              </div>
            </div>
          </div>
          {session.document11EducationRecords.length > 1 ? (
            <button
              type="button"
              className={`${styles.inlineDangerButton} ${styles.doc4CardDeleteOverlay}`}
              onClick={() => applyDocumentUpdate('doc11', 'manual', (current) => ({ ...current, document11EducationRecords: current.document11EducationRecords.filter((record) => record.id !== item.id) }))}
            >
              삭제
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

