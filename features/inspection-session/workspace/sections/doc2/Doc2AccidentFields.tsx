'use client';

import { useState } from 'react';
import { ACCIDENT_OCCURRENCE_OPTIONS } from '@/components/session/workspace/constants';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { OverviewSectionProps } from '@/components/session/workspace/types';
import Doc2AccidentDatePicker from '@/components/session/workspace/sections/Doc2AccidentDatePicker';
import { updateOverviewField } from '@/components/session/workspace/sections/doc2Shared';
import { UploadBox } from '@/components/session/workspace/widgets';
import AppModal from '@/components/ui/AppModal';
import {
  buildDoc2ProcessNotesDraft,
  buildDoc2RiskFallback,
} from '@/features/inspection-session/workspace/sections/doc2/doc2ProcessNotes';

interface Doc2AccidentFieldsProps {
  props: OverviewSectionProps;
}

interface Doc2ProcessNotesResponse {
  riskLines?: string[];
  error?: string;
}

const ACCIDENT_TRACKING_LABELS = {
  occurrencePart: '\uC0AC\uACE0\uBC1C\uC0DD \uBD80\uC704',
  implementationStatus: '\uD604\uC7AC \uC774\uD589\uC0C1\uD0DC',
} as const;

async function generateDoc2RiskLines(input: {
  processWorkContent: string;
  processWorkerCount: string;
  processEquipment: string;
  processTools: string;
  processHazardousMaterials: string;
}) {
  const response = await fetch('/api/ai/doc2-process-notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as Doc2ProcessNotesResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'AI 위험요인 생성에 실패했습니다.');
  }

  return Array.isArray(payload.riskLines) ? payload.riskLines.filter(Boolean).slice(0, 2) : [];
}

export function Doc2AccidentFields({ props }: Doc2AccidentFieldsProps) {
  const { session } = props;
  const [isProcessNotesModalOpen, setIsProcessNotesModalOpen] = useState(false);
  const [isGeneratingProcessNotes, setIsGeneratingProcessNotes] = useState(false);
  const [processRiskLines, setProcessRiskLines] = useState<string[] | null>(null);
  const [processNotesError, setProcessNotesError] = useState<string | null>(null);
  const [processNotesNotice, setProcessNotesNotice] = useState<string | null>(null);
  const accidentOccurredYes = session.document2Overview.accidentOccurred === 'yes';
  const fallbackRiskLines = buildDoc2RiskFallback(session.document2Overview);
  const previewRiskLines = processRiskLines ?? fallbackRiskLines;
  const processNoteDraft = buildDoc2ProcessNotesDraft(session.document2Overview, previewRiskLines);

  const resetProcessNotesState = () => {
    setProcessRiskLines(null);
    setProcessNotesError(null);
    setProcessNotesNotice(null);
  };

  const handleProcessFieldChange = (
    key:
      | 'processWorkContent'
      | 'processWorkerCount'
      | 'processEquipment'
      | 'processTools'
      | 'processHazardousMaterials',
    value: string,
  ) => {
    resetProcessNotesState();
    updateOverviewField(props, key, value);
  };

  const handleGenerateProcessNotes = async () => {
    setIsGeneratingProcessNotes(true);
    setProcessNotesError(null);
    setProcessNotesNotice(null);

    try {
      const generatedRiskLines = await generateDoc2RiskLines({
        processWorkContent: session.document2Overview.processWorkContent,
        processWorkerCount: session.document2Overview.processWorkerCount,
        processEquipment: session.document2Overview.processEquipment,
        processTools: session.document2Overview.processTools,
        processHazardousMaterials: session.document2Overview.processHazardousMaterials,
      });

      if (generatedRiskLines.length === 0) {
        throw new Error('AI 위험요인 생성 결과가 비어 있습니다.');
      }

      setProcessRiskLines(generatedRiskLines);
      setProcessNotesNotice('AI가 주요 위험 요인 2줄을 생성했습니다.');
    } catch (error) {
      setProcessRiskLines(null);
      setProcessNotesError(error instanceof Error ? error.message : 'AI 위험요인 생성에 실패했습니다.');
      setProcessNotesNotice('AI 생성에 실패해 규칙 기반 위험 요인으로 미리보기를 유지합니다.');
    } finally {
      setIsGeneratingProcessNotes(false);
    }
  };

  const applyProcessNotesDraft = () => {
    updateOverviewField(props, 'processAndNotes', processNoteDraft, 'derived');
    setIsProcessNotesModalOpen(false);
  };

  const handleAccidentPhotoSelect = async (
    key: 'accidentPhotoUrl' | 'accidentPhotoUrl2',
    file: File,
  ) => {
    const value = await props.withFileData(file);
    if (!value) return;

    updateOverviewField(props, key, value);
  };

  return (
    <div className={styles.doc2AccidentSections}>
      <section className={styles.doc2AccidentSectionBlock}>
        <h3 className={styles.doc2SubsectionTitle}>재해 유무</h3>
        <article className={styles.tableCard}>
          <div className={styles.doc2AccidentTableWrap}>
            <table className={styles.doc2AccidentTable}>
              <colgroup>
                <col className={styles.doc2AccidentLabelCol} />
                <col className={styles.doc2AccidentValueCol} />
                <col className={styles.doc2AccidentLabelCol} />
                <col className={styles.doc2AccidentValueCol} />
                <col className={styles.doc2AccidentLabelCol} />
                <col className={styles.doc2AccidentValueCol} />
              </colgroup>
              <tbody>
                {accidentOccurredYes ? (
                  <>
                    <tr>
                      <th scope="row" className={styles.doc2AccidentLabelCell}>
                        산업재해 발생유무
                      </th>
                      <td className={styles.doc2AccidentValueCell}>
                        <select
                          className="app-select"
                          value={
                            session.document2Overview.accidentOccurred === 'yes' ? 'yes' : 'no'
                          }
                          onChange={(event) =>
                            updateOverviewField(props, 'accidentOccurred', event.target.value)
                          }
                        >
                          {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <th scope="row" className={styles.doc2AccidentLabelCell}>
                        최근 발생일자
                      </th>
                      <td className={styles.doc2AccidentValueCell}>
                        <Doc2AccidentDatePicker
                          value={session.document2Overview.recentAccidentDate}
                          disabled={false}
                          onChange={(next) =>
                            updateOverviewField(props, 'recentAccidentDate', next)
                          }
                        />
                      </td>
                      <th scope="row" className={styles.doc2AccidentLabelCell}>
                        재해형태
                      </th>
                      <td className={styles.doc2AccidentValueCell}>
                        <input
                          type="text"
                          className="app-input"
                          value={session.document2Overview.accidentType}
                          onChange={(event) =>
                            updateOverviewField(props, 'accidentType', event.target.value)
                          }
                          placeholder="예: 추락"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className={styles.doc2AccidentLabelCell}>재해개요</th>
                      <td colSpan={5} className={styles.doc2AccidentValueCell}>
                        <input
                          type="text"
                          className="app-input"
                          value={session.document2Overview.accidentSummary}
                          onChange={(event) =>
                            updateOverviewField(props, 'accidentSummary', event.target.value)
                          }
                          placeholder="재해 개요 입력"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={6}
                        className={`${styles.doc2AccidentValueCell} ${styles.doc2AccidentMediaRowCell}`}
                      >
                        <div className={styles.doc2AccidentMediaGrid}>
                          <div className={styles.doc2AccidentMediaItem}>
                            <div className={styles.doc2AccidentMediaLabel}>
                              {ACCIDENT_TRACKING_LABELS.occurrencePart}
                            </div>
                            <div className={styles.doc2AccidentMediaField}>
                              <UploadBox
                                id="doc2-accident-photo-1"
                                label={ACCIDENT_TRACKING_LABELS.occurrencePart}
                                labelLayout="field"
                                fieldBodyHeight={160}
                                fieldClearOverlay
                                fieldLabelMode="omit"
                                fitImageToBox
                                value={session.document2Overview.accidentPhotoUrl}
                                onClear={() =>
                                  updateOverviewField(props, 'accidentPhotoUrl', '')
                                }
                                onSelect={async (file) =>
                                  handleAccidentPhotoSelect('accidentPhotoUrl', file)
                                }
                              />
                            </div>
                          </div>
                          <div className={styles.doc2AccidentMediaItem}>
                            <div className={styles.doc2AccidentMediaLabel}>
                              {ACCIDENT_TRACKING_LABELS.implementationStatus}
                            </div>
                            <div className={styles.doc2AccidentMediaField}>
                              <UploadBox
                                id="doc2-accident-photo-2"
                                label={ACCIDENT_TRACKING_LABELS.implementationStatus}
                                labelLayout="field"
                                fieldBodyHeight={160}
                                fieldClearOverlay
                                fieldLabelMode="omit"
                                fitImageToBox
                                value={session.document2Overview.accidentPhotoUrl2}
                                onClear={() =>
                                  updateOverviewField(props, 'accidentPhotoUrl2', '')
                                }
                                onSelect={async (file) =>
                                  handleAccidentPhotoSelect('accidentPhotoUrl2', file)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th scope="row" className={styles.doc2AccidentLabelCell}>
                      산업재해 발생유무
                    </th>
                    <td colSpan={5} className={styles.doc2AccidentValueCell}>
                      <select
                        className="app-select"
                        value={session.document2Overview.accidentOccurred === 'yes' ? 'yes' : 'no'}
                        onChange={(event) =>
                          updateOverviewField(props, 'accidentOccurred', event.target.value)
                        }
                      >
                        {ACCIDENT_OCCURRENCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={styles.doc2AccidentSectionBlock}>
        <div className={styles.doc2SubsectionHeader}>
          <h3 className={styles.doc2SubsectionTitle}>진행공정 및 특이사항</h3>
          <button
            type="button"
            className={styles.doc5SummaryDraftBtn}
            onClick={() => setIsProcessNotesModalOpen(true)}
          >
            자동생성
          </button>
        </div>
        <article className={styles.tableCard}>
          <div className={styles.doc2AccidentTableWrap}>
            <table className={`${styles.doc2AccidentTable} ${styles.doc2AccidentNotesTable}`}>
              <colgroup>
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className={styles.doc2AccidentValueCell}>
                    <textarea
                      className={`app-textarea ${styles.doc2AccidentTextarea}`}
                      value={session.document2Overview.processAndNotes}
                      onChange={(event) =>
                        updateOverviewField(props, 'processAndNotes', event.target.value)
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <AppModal
        open={isProcessNotesModalOpen}
        title="진행공정 및 특이사항 자동생성"
        onClose={() => setIsProcessNotesModalOpen(false)}
        size="large"
        verticalAlign="center"
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setIsProcessNotesModalOpen(false)}
            >
              닫기
            </button>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => void handleGenerateProcessNotes()}
              disabled={isGeneratingProcessNotes}
            >
              {isGeneratingProcessNotes ? 'AI 생성 중' : 'AI 생성'}
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={applyProcessNotesDraft}
              disabled={isGeneratingProcessNotes}
            >
              본문에 반영
            </button>
          </>
        }
      >
        <div className={styles.doc2ProcessPromptStack}>
          <p className={styles.fieldAssist}>
            공사개요에 필요한 5개 항목만 입력하면, 개요 2줄은 즉시 정리되고 주요 위험 요인
            2줄은 AI로 생성합니다.
          </p>
          {processNotesError ? <p className={styles.fieldAssistError}>{processNotesError}</p> : null}
          {processNotesNotice ? <p className={styles.fieldAssist}>{processNotesNotice}</p> : null}
          <div className={styles.doc2ProcessPromptGrid}>
            <label className={styles.doc2ProcessPromptField}>
              <span className={styles.fieldLabel}>작업현재 공정</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processWorkContent}
                onChange={(event) =>
                  handleProcessFieldChange('processWorkContent', event.target.value)
                }
                placeholder="예: 철거작업, 금속작업, 도장작업"
              />
            </label>
            <label className={styles.doc2ProcessPromptField}>
              <span className={styles.fieldLabel}>작업 인원</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processWorkerCount}
                onChange={(event) =>
                  handleProcessFieldChange('processWorkerCount', event.target.value)
                }
                placeholder="예: 6"
              />
            </label>
            <label className={styles.doc2ProcessPromptField}>
              <span className={styles.fieldLabel}>건설기계 장비</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processEquipment}
                onChange={(event) =>
                  handleProcessFieldChange('processEquipment', event.target.value)
                }
                placeholder="예: 트럭, 굴착기, 고소작업대"
              />
            </label>
            <label className={styles.doc2ProcessPromptField}>
              <span className={styles.fieldLabel}>유해위험기구</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processTools}
                onChange={(event) => handleProcessFieldChange('processTools', event.target.value)}
                placeholder="예: 핸드브레이커, 이동식 사다리, 용접기"
              />
            </label>
            <label
              className={`${styles.doc2ProcessPromptField} ${styles.doc2ProcessPromptFieldWide}`}
            >
              <span className={styles.fieldLabel}>유해위험물질</span>
              <input
                type="text"
                className="app-input"
                value={session.document2Overview.processHazardousMaterials}
                onChange={(event) =>
                  handleProcessFieldChange('processHazardousMaterials', event.target.value)
                }
                placeholder="예: 페인트, LPG, 용접봉"
              />
            </label>
          </div>
          <div className={styles.doc2ProcessPreviewCard}>
            <strong className={styles.fieldLabel}>4줄 미리보기</strong>
            <pre className={styles.doc2ProcessPreviewText}>{processNoteDraft}</pre>
          </div>
        </div>
      </AppModal>
    </div>
  );
}
