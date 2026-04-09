import { useMemo, useState } from 'react';
import AppModal from '@/components/ui/AppModal';
import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import { isImageValue } from '@/components/session/workspace/utils';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7FindingFieldsProps {
  item: CurrentHazardFinding;
  onAccidentTypeChange: (value: string) => void;
  onCausativeAgentChange: (value: CausativeAgentKey | '') => void;
  referenceMaterial1Title: string;
  referenceMaterial2Title: string;
  selectValueForRiskLevel: (stored: string) => string;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
}

type ReferencePreviewKind = 'reference1' | 'reference2' | null;

function decodeReferenceFileName(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  try {
    const url = new URL(normalized, 'https://local.invalid');
    const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(lastSegment).trim();
  } catch {
    return '';
  }
}

function buildShortReferenceLabel(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  return normalized.length <= 36 ? normalized : fallback;
}

function PicturePreviewIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.doc7ReferenceIcon}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.5" />
      <path d="M4.5 14.5 8.5 10.5 11.5 13.5 14 11 17 14.5" />
    </svg>
  );
}

export function Doc7FindingFields({
  item,
  onAccidentTypeChange,
  onCausativeAgentChange,
  referenceMaterial1Title,
  referenceMaterial2Title,
  selectValueForRiskLevel,
  updateFinding,
}: Doc7FindingFieldsProps) {
  const [previewKind, setPreviewKind] = useState<ReferencePreviewKind>(null);
  const referenceImageValue = item.referenceMaterialImage || item.referenceMaterial1;
  const referenceDescriptionValue =
    item.referenceMaterialDescription || item.referenceMaterial2;
  const reference1Label = useMemo(() => {
    if (!referenceImageValue.trim()) {
      return '';
    }

    if (referenceMaterial1Title) {
      return referenceMaterial1Title;
    }

    return (
      decodeReferenceFileName(referenceImageValue) ||
      buildShortReferenceLabel(referenceImageValue, '참고자료 이미지') ||
      '참고자료 이미지'
    );
  }, [referenceImageValue, referenceMaterial1Title]);
  const reference2Label = useMemo(() => {
    if (!referenceDescriptionValue.trim()) {
      return '';
    }

    if (referenceMaterial2Title) {
      return referenceMaterial2Title;
    }

    return (
      buildShortReferenceLabel(referenceDescriptionValue, '참고자료 설명') ||
      '참고자료 설명'
    );
  }, [referenceDescriptionValue, referenceMaterial2Title]);
  const hasReferencePreviewImage = isImageValue(referenceImageValue);
  const referenceImageDisplay =
    reference1Label || '자동 매칭된 참고자료가 없습니다.';
  const referenceDescriptionDisplay =
    reference2Label || '자동 매칭된 참고자료가 없습니다.';

  return (
    <>
      <div className={styles.doc7FormColumn}>
        <div className={styles.doc7FieldStack}>
          <div className={styles.doc7TableWrap}>
            <table className={styles.doc7MetaTable}>
              <colgroup>
                <col className={styles.doc7MetaLabelCol} />
                <col className={styles.doc7MetaValueCol} />
                <col className={styles.doc7MetaLabelCol} />
                <col className={styles.doc7MetaValueCol} />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    장소
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <input
                      type="text"
                      className="app-input"
                      value={item.location}
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          location: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <th scope="row" className={styles.doc7LabelCell}>
                    재해유형
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <select
                      className="app-select"
                      value={item.accidentType}
                      onChange={(event) => onAccidentTypeChange(event.target.value)}
                    >
                      <option value="">선택</option>
                      {ACCIDENT_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    위험도
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <select
                      className="app-select"
                      value={selectValueForRiskLevel(item.riskLevel)}
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          riskLevel: event.target.value,
                        }))
                      }
                    >
                      {RISK_TRI_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <th scope="row" className={styles.doc7LabelCell}>
                    기인물
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <select
                      className="app-select"
                      value={item.causativeAgentKey}
                      onChange={(event) =>
                        onCausativeAgentChange(event.target.value as CausativeAgentKey | '')
                      }
                    >
                      <option value="">선택</option>
                      {CAUSATIVE_AGENT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                          {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.doc7TableWrap}>
            <table className={styles.doc7DetailTable}>
              <colgroup>
                <col className={styles.doc7DetailLabelCol} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    유해위험요인
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <textarea
                      className={`app-textarea ${styles.doc7TextareaSingle}`}
                      rows={1}
                      value={item.hazardDescription ?? ''}
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          hazardDescription: event.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    개선요구사항
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <textarea
                      className={`app-textarea ${styles.doc7TextareaDouble}`}
                      rows={2}
                      maxLength={220}
                      value={item.improvementRequest || item.improvementPlan}
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          improvementPlan: event.target.value,
                          improvementRequest: event.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    <>
                      중점관리 위험요인 및
                      <br />
                      관리대책
                    </>
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <textarea
                      className={`app-textarea ${styles.doc7TextareaFive}`}
                      rows={5}
                      value={item.emphasis}
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          emphasis: event.target.value,
                        }))
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    관계 법령
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <input
                      type="text"
                      className="app-input"
                      value={item.legalReferenceTitle}
                      placeholder="법령 제목은 쉼표 또는 줄바꿈으로 구분해 입력"
                      onChange={(event) =>
                        updateFinding((finding) => ({
                          ...finding,
                          legalReferenceId: '',
                          legalReferenceTitle: event.target.value,
                          referenceLawTitles: event.target.value
                            .split(/[\n,]+/)
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        }))
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.doc7TableWrap}>
            <table className={styles.doc7ReferenceTable}>
              <colgroup>
                <col className={styles.doc7DetailLabelCol} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    참고자료 이미지
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div className={styles.doc7ReferenceValueRow}>
                      <div
                        className={`${styles.doc7ReferenceDisplayText} ${
                          reference1Label ? '' : styles.doc7ReferenceDisplayEmpty
                        }`}
                      >
                        {referenceImageDisplay}
                      </div>
                      <button
                        type="button"
                        className={styles.doc7ReferencePreviewButton}
                        onClick={() => setPreviewKind('reference1')}
                        disabled={!referenceImageValue.trim()}
                        aria-label="참고자료 이미지 미리보기"
                      >
                        <PicturePreviewIcon />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    참고자료 설명
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div className={styles.doc7ReferenceValueRow}>
                      <div
                        className={`${styles.doc7ReferenceDisplayText} ${
                          reference2Label ? '' : styles.doc7ReferenceDisplayEmpty
                        }`}
                      >
                        {referenceDescriptionDisplay}
                      </div>
                      <button
                        type="button"
                        className={styles.doc7ReferencePreviewButton}
                        onClick={() => setPreviewKind('reference2')}
                        disabled={!referenceDescriptionValue.trim()}
                        aria-label="참고자료 설명 미리보기"
                      >
                        <PicturePreviewIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AppModal
        open={previewKind !== null}
        title={
          previewKind === 'reference1'
            ? reference1Label || '참고자료 이미지'
            : reference2Label || '참고자료 설명'
        }
        size="large"
        onClose={() => setPreviewKind(null)}
        actions={
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => setPreviewKind(null)}
          >
            닫기
          </button>
        }
      >
        {previewKind === 'reference1' ? (
          <div className={styles.doc7ReferencePreviewModal}>
            {hasReferencePreviewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={referenceImageValue}
                alt={reference1Label || '참고자료 이미지'}
                className={styles.doc7ReferencePreviewImage}
              />
            ) : (
              <div className={styles.doc7ReferencePreviewText}>
                {referenceImageValue || '표시할 참고자료가 없습니다.'}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.doc7ReferencePreviewModal}>
            <div className={styles.doc7ReferencePreviewText}>
              {referenceDescriptionValue || '표시할 참고자료가 없습니다.'}
            </div>
          </div>
        )}
      </AppModal>
    </>
  );
}
