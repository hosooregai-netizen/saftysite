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
import type { SafetyDoc7ReferenceMaterialCatalogItem } from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7FindingFieldsProps {
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
  item: CurrentHazardFinding;
  onAccidentTypeChange: (value: string) => void;
  onCausativeAgentChange: (value: CausativeAgentKey | '') => void;
  referenceMaterial1Title: string;
  referenceMaterial2Title: string;
  selectValueForRiskLevel: (stored: string) => string;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
  updateFindingWithReferenceMaterial: (
    updater: (finding: CurrentHazardFinding) => CurrentHazardFinding,
  ) => void;
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
  doc7ReferenceMaterials,
  item,
  onAccidentTypeChange,
  onCausativeAgentChange,
  referenceMaterial1Title,
  referenceMaterial2Title,
  selectValueForRiskLevel,
  updateFinding,
  updateFindingWithReferenceMaterial,
}: Doc7FindingFieldsProps) {
  const [previewKind, setPreviewKind] = useState<ReferencePreviewKind>(null);
  const activeCatalog = useMemo(
    () => doc7ReferenceMaterials.filter((row) => row.isActive),
    [doc7ReferenceMaterials],
  );
  const catalogAccidentTypes = useMemo(() => {
    const set = new Set<string>();
    for (const row of activeCatalog) {
      const t = row.accidentType?.trim();
      if (t) {
        set.add(t);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [activeCatalog]);
  const causativeKeysForRefAccident = useMemo(() => {
    const selected = (item.referenceCatalogAccidentType ?? '').trim();
    if (!selected) {
      return [];
    }
    const set = new Set<string>();
    for (const row of activeCatalog) {
      if (row.accidentType === selected && row.causativeAgentKey) {
        set.add(row.causativeAgentKey);
      }
    }
    const keys = [...set];
    const order = new Map(CAUSATIVE_AGENT_OPTIONS.map((o, i) => [o.key, i]));
    keys.sort((a, b) => (order.get(a as CausativeAgentKey) ?? 999) - (order.get(b as CausativeAgentKey) ?? 999));
    return keys;
  }, [activeCatalog, item.referenceCatalogAccidentType ?? '']);
  const hasReferenceImage = isImageValue(item.referenceMaterial1);
  const reference1Label = useMemo(() => {
    if (!item.referenceMaterial1.trim()) {
      return '';
    }

    if (referenceMaterial1Title) {
      return referenceMaterial1Title;
    }

    return (
      decodeReferenceFileName(item.referenceMaterial1) ||
      buildShortReferenceLabel(item.referenceMaterial1, '참고자료 이미지') ||
      '참고자료 이미지'
    );
  }, [item.referenceMaterial1, referenceMaterial1Title]);
  const reference2Label = useMemo(() => {
    if (!item.referenceMaterial2.trim()) {
      return '';
    }

    if (referenceMaterial2Title) {
      return referenceMaterial2Title;
    }

    return buildShortReferenceLabel(item.referenceMaterial2, '참고자료 내용') || '참고자료 내용';
  }, [item.referenceMaterial2, referenceMaterial2Title]);

  return (
    <>
      <div className={styles.doc7FormColumn}>
        <div className={styles.doc7FieldStack}>
          <div className={styles.doc7PairRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>위치/위험요인</span>
              <input
                type="text"
                className="app-input"
                value={item.location}
                onChange={(event) =>
                  updateFinding((finding) => ({ ...finding, location: event.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>위험도</span>
              <select
                className="app-select"
                value={selectValueForRiskLevel(item.riskLevel)}
                onChange={(event) =>
                  updateFinding((finding) => ({ ...finding, riskLevel: event.target.value }))
                }
              >
                {RISK_TRI_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.doc7PairRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>기인물</span>
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
                    {option.number}. {CAUSATIVE_AGENT_LABELS[option.key] ?? option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>재해유형</span>
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
            </label>
          </div>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>강조사항</span>
            <textarea
              className="app-textarea"
              value={item.emphasis}
              onChange={(event) =>
                updateFinding((finding) => ({ ...finding, emphasis: event.target.value }))
              }
            />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>개선대책</span>
            <textarea
              className="app-textarea"
              value={item.improvementPlan}
              onChange={(event) =>
                updateFinding((finding) => ({ ...finding, improvementPlan: event.target.value }))
              }
            />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>관련법령</span>
            <input
              type="text"
              className="app-input"
              value={item.legalReferenceTitle}
              onChange={(event) =>
                updateFinding((finding) => ({
                  ...finding,
                  legalReferenceId: '',
                  legalReferenceTitle: event.target.value,
                }))
              }
            />
          </label>
          <div className={styles.doc7PairRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>참고자료-재해유형</span>
              <select
                className="app-select"
                value={item.referenceCatalogAccidentType ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  updateFindingWithReferenceMaterial((finding) => {
                    if (!value.trim()) {
                      return {
                        ...finding,
                        referenceCatalogAccidentType: '',
                        referenceCatalogCausativeAgentKey: '',
                      };
                    }
                    const allowed = new Set(
                      activeCatalog
                        .filter(
                          (row) =>
                            row.accidentType === value &&
                            row.causativeAgentKey,
                        )
                        .map((row) => row.causativeAgentKey),
                    );
                    const cur = finding.referenceCatalogCausativeAgentKey;
                    const nextCausative =
                      cur && allowed.has(cur) ? cur : '';
                    return {
                      ...finding,
                      referenceCatalogAccidentType: value,
                      referenceCatalogCausativeAgentKey: nextCausative,
                    };
                  });
                }}
              >
                <option value="">선택</option>
                {catalogAccidentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>참고자료 - 기인물</span>
              <select
                className="app-select"
                value={item.referenceCatalogCausativeAgentKey ?? ''}
                disabled={!(item.referenceCatalogAccidentType ?? '').trim()}
                onChange={(event) =>
                  updateFindingWithReferenceMaterial((finding) => ({
                    ...finding,
                    referenceCatalogCausativeAgentKey: event.target.value,
                  }))
                }
              >
                <option value="">선택</option>
                {causativeKeysForRefAccident.map((key) => {
                  const opt = CAUSATIVE_AGENT_OPTIONS.find((o) => o.key === key);
                  return (
                    <option key={key} value={key}>
                      {opt
                        ? `${opt.number}. ${CAUSATIVE_AGENT_LABELS[key as CausativeAgentKey] ?? opt.label}`
                        : key}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          <div className={styles.doc7ReferenceGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>참고자료 1</span>
              <div className={styles.doc7ReferenceInputRow}>
                <input
                  type="text"
                  className={`app-input ${styles.doc7ReferenceInput}`}
                  value={reference1Label}
                  placeholder="자동 매칭된 참고자료가 없습니다."
                  readOnly
                />
                <button
                  type="button"
                  className={styles.doc7ReferencePreviewButton}
                  onClick={() => setPreviewKind('reference1')}
                  disabled={!item.referenceMaterial1.trim()}
                  aria-label="참고자료 1 미리보기"
                >
                  <PicturePreviewIcon />
                </button>
              </div>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>참고자료 2</span>
              <div className={styles.doc7ReferenceInputRow}>
                <input
                  type="text"
                  className={`app-input ${styles.doc7ReferenceInput}`}
                  value={reference2Label}
                  placeholder="자동 매칭된 참고자료가 없습니다."
                  readOnly
                />
                <button
                  type="button"
                  className={styles.doc7ReferencePreviewButton}
                  onClick={() => setPreviewKind('reference2')}
                  disabled={!item.referenceMaterial2.trim()}
                  aria-label="참고자료 2 미리보기"
                >
                  <PicturePreviewIcon />
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>

      <AppModal
        open={previewKind !== null}
        title={
          previewKind === 'reference1'
            ? reference1Label || '참고자료 1'
            : reference2Label || '참고자료 2'
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
            {hasReferenceImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.referenceMaterial1}
                alt={reference1Label || '참고자료 1'}
                className={styles.doc7ReferencePreviewImage}
              />
            ) : (
              <div className={styles.doc7ReferencePreviewText}>
                {item.referenceMaterial1 || '표시할 참고자료가 없습니다.'}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.doc7ReferencePreviewModal}>
            <div className={styles.doc7ReferencePreviewText}>
              {item.referenceMaterial2 || '표시할 참고자료가 없습니다.'}
            </div>
          </div>
        )}
      </AppModal>
    </>
  );
}
