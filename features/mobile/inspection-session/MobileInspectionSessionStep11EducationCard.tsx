'use client';

import type { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import workspaceStyles from '@/components/session/InspectionSessionWorkspace.module.css';
import styles from '@/features/mobile/components/MobileShell.module.css';
import type { MobilePhotoSourceTarget } from './mobileInspectionSessionHelpers';

type InspectionScreenController = ReturnType<typeof useInspectionSessionScreen>;
type InspectionSessionDraft = NonNullable<InspectionScreenController['sectionSession']>;

interface MobileInspectionSessionStep11EducationCardProps {
  doc11ContentError: { id: string; message: string } | null;
  doc11ContentNotice: { id: string; message: string } | null;
  doc11GeneratingId: string | null;
  handleGenerateDoc11Content: (recordId: string) => Promise<void>;
  index: number;
  openPhotoSourcePicker: (target: MobilePhotoSourceTarget) => void;
  record: InspectionSessionDraft['document11EducationRecords'][number];
  screen: InspectionScreenController;
}

export function MobileInspectionSessionStep11EducationCard({
  doc11ContentError,
  doc11ContentNotice,
  doc11GeneratingId,
  handleGenerateDoc11Content,
  index,
  openPhotoSourcePicker,
  record,
  screen,
}: MobileInspectionSessionStep11EducationCardProps) {
  const updateRecord = (
    patch: Partial<InspectionSessionDraft['document11EducationRecords'][number]>,
  ) => {
    screen.applyDocumentUpdate('doc11', 'manual', (current) => ({
      ...current,
      document11EducationRecords: current.document11EducationRecords.map((item) =>
        item.id === record.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  return (
    <article style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{`교육 기록 ${index + 1}`}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px', gap: '10px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 주제</span>
            <input className="app-input" value={record.topic} onChange={(event) => updateRecord({ topic: event.target.value })} placeholder="예: 추락주의" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>참석 인원 (명)</span>
            <input className="app-input" type="number" value={record.attendeeCount} onChange={(event) => updateRecord({ attendeeCount: event.target.value })} placeholder="0" />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 현장 사진</span>
              {record.photoUrl ? (
                <button type="button" className={workspaceStyles.doc5SummaryDraftBtn} onClick={() => updateRecord({ photoUrl: '' })}>
                  사진 삭제
                </button>
              ) : null}
            </div>
            <button
              type="button"
              style={{ display: 'block', width: '100%', height: '156px', backgroundColor: '#f1f5f9', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '6px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              onClick={() =>
                openPhotoSourcePicker({
                  fieldLabel: '안전교육 사진',
                  onAlbumSelected: (albumItem) => updateRecord({ photoUrl: albumItem.previewUrl }),
                  onFileSelected: async (file) => {
                    await screen.withFileData(file, (value) => updateRecord({ photoUrl: value }));
                  },
                })
              }
            >
              {record.photoUrl ? (
                <img src={record.photoUrl} alt="안전교육 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                  사진 업로드
                </div>
              )}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 자료</span>
              {record.materialUrl ? (
                <button type="button" className={workspaceStyles.doc5SummaryDraftBtn} onClick={() => updateRecord({ materialUrl: '', materialName: '' })}>
                  자료 삭제
                </button>
              ) : null}
            </div>
            <label style={{ display: 'block', width: '100%', height: '156px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '6px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
              {record.materialUrl && (record.materialUrl.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(record.materialName)) ? (
                <img src={record.materialUrl} alt={record.materialName || '교육 자료'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : record.materialUrl ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '12px', textAlign: 'center', padding: '12px', lineHeight: 1.5 }}>
                  {record.materialName || '업로드된 자료'}
                </div>
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
                  자료 업로드
                </div>
              )}
              <input
                type="file"
                accept="image/*,.pdf,.hwp,.hwpx,.ppt,.pptx,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void screen.withFileData(file, (value, selectedFile) => {
                      updateRecord({ materialUrl: value, materialName: selectedFile.name });
                    });
                  }
                }}
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 내용</span>
            <button type="button" className={workspaceStyles.doc5SummaryDraftBtn} disabled={doc11GeneratingId === record.id} onClick={() => void handleGenerateDoc11Content(record.id)}>
              {doc11GeneratingId === record.id ? 'AI 생성 중' : '내용 자동 생성'}
            </button>
          </div>
          {doc11ContentError?.id === record.id ? <p className={styles.errorNotice} style={{ margin: 0 }}>{doc11ContentError.message}</p> : null}
          {doc11ContentNotice?.id === record.id ? <p className={styles.inlineNotice} style={{ margin: 0 }}>{doc11ContentNotice.message}</p> : null}
          <textarea className="app-input" value={record.content} onChange={(event) => updateRecord({ content: event.target.value })} placeholder="교육 내용을 입력하세요." style={{ width: '100%', minHeight: '120px', resize: 'vertical' }} />
        </div>
      </div>
    </article>
  );
}
