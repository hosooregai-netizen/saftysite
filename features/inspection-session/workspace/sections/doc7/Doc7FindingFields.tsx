import { useMemo, useState, type FocusEvent } from 'react';
import AppModal from '@/components/ui/AppModal';
import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import { isImageValue } from '@/components/session/workspace/utils';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import {
  applyHazardCountermeasureSelectionToFinding,
  clearHazardCountermeasureSelectionFromFinding,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';
import type { SafetyHazardCountermeasureCatalogItem } from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';

interface Doc7FindingFieldsProps {
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  item: CurrentHazardFinding;
  onAccidentTypeChange: (value: string) => void;
  onCausativeAgentChange: (value: CausativeAgentKey | '') => void;
  referenceMaterial1Title: string;
  referenceMaterial2Title: string;
  selectValueForRiskLevel: (stored: string) => string;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
}

type ReferencePreviewKind = 'reference1' | 'reference2' | null;

const DOC7_TEMPLATE_LABELS = {
  reference1Fallback: '\uAD00\uB828 \uC911\uB300\uC7AC\uD574 \uC0AC\uB840',
  reference2Fallback: '\uC608\uBC29\uB300\uCC45',
  referenceEmpty: '\uC790\uB3D9 \uB9E4\uCE6D\uB41C \uCC38\uACE0\uC790\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
  inspectorEmphasis: '\uC9C0\uB3C4\uC694\uC6D0 \uAC15\uC870\uC0AC\uD56D',
  hazard: '\uC704\uD5D8\uC694\uC778',
  controlMeasure: '\uAD00\uB9AC\uB300\uCC45',
  legalReference: '\uCC38\uACE0\uBC95\uB839',
  legalPlaceholder:
    '\uBC95\uB839 \uC81C\uBAA9\uC740 \uC27C\uD45C \uB610\uB294 \uC904\uBC14\uAFC8\uC73C\uB85C \uAD6C\uBD84\uD574 \uC785\uB825',
  reference1Label: '\uAD00\uB828 \uC911\uB300\uC7AC\uD574 \uC0AC\uB840',
  reference1PreviewAria: '\uAD00\uB828 \uC911\uB300\uC7AC\uD574 \uC0AC\uB840 \uBBF8\uB9AC\uBCF4\uAE30',
  reference2Label: '\uC608\uBC29\uB300\uCC45',
  reference2PreviewAria: '\uC608\uBC29\uB300\uCC45 \uBBF8\uB9AC\uBCF4\uAE30',
  close: '\uB2EB\uAE30',
  previewEmpty: '\uD45C\uC2DC\uD560 \uCC38\uACE0\uC790\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
} as const;

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
  hazardCountermeasureCatalog,
  item,
  onAccidentTypeChange,
  onCausativeAgentChange,
  referenceMaterial1Title,
  referenceMaterial2Title,
  selectValueForRiskLevel,
  updateFinding,
}: Doc7FindingFieldsProps) {
  const [previewKind, setPreviewKind] = useState<ReferencePreviewKind>(null);
  const [activeRecommendationField, setActiveRecommendationField] =
    useState<HazardCountermeasureCatalogMatchField | null>(null);
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
      buildShortReferenceLabel(referenceImageValue, DOC7_TEMPLATE_LABELS.reference1Fallback) ||
      DOC7_TEMPLATE_LABELS.reference1Fallback
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
      buildShortReferenceLabel(
        referenceDescriptionValue,
        DOC7_TEMPLATE_LABELS.reference2Fallback,
      ) || DOC7_TEMPLATE_LABELS.reference2Fallback
    );
  }, [referenceDescriptionValue, referenceMaterial2Title]);
  const hasReferencePreviewImage = isImageValue(referenceImageValue);
  const referenceImageDisplay = reference1Label || DOC7_TEMPLATE_LABELS.referenceEmpty;
  const referenceDescriptionDisplay =
    reference2Label || DOC7_TEMPLATE_LABELS.referenceEmpty;
  const recommendationListId =
    activeRecommendationField ? `doc7-hazard-countermeasure-${item.id}-${activeRecommendationField}` : '';
  const activeRecommendationQuery =
    activeRecommendationField === 'expectedRisk'
      ? item.improvementRequest || item.improvementPlan
      : activeRecommendationField === 'countermeasure'
        ? item.emphasis
        : activeRecommendationField === 'legalReference'
          ? item.legalReferenceTitle
          : '';
  const activeRecommendations =
    activeRecommendationField === null
      ? []
      : getHazardCountermeasureRecommendations(
          hazardCountermeasureCatalog,
          activeRecommendationQuery,
          activeRecommendationField,
          {
            excludeId: item.hazardCountermeasureItemId,
          },
        );

  const handleRecommendationBlur = (
    field: HazardCountermeasureCatalogMatchField,
    event: FocusEvent<HTMLDivElement>,
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActiveRecommendationField((current) => (current === field ? null : current));
    }
  };

  const selectHazardCountermeasureItem = (catalogItem: SafetyHazardCountermeasureCatalogItem) => {
    updateFinding((finding) =>
      applyHazardCountermeasureSelectionToFinding(finding, catalogItem),
    );
    setActiveRecommendationField(null);
  };

  const buildRecommendationLabel = (
    catalogItem: SafetyHazardCountermeasureCatalogItem,
    field: HazardCountermeasureCatalogMatchField,
  ) => {
    const primary =
      getHazardCountermeasureFieldText(catalogItem, field).trim() ||
      catalogItem.title.trim() ||
      catalogItem.expectedRisk.trim() ||
      catalogItem.countermeasure.trim() ||
      catalogItem.legalReference.trim();

    const title = catalogItem.title.trim();
    return title && primary !== title ? `${primary} (${title})` : primary;
  };

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
                    {DOC7_TEMPLATE_LABELS.inspectorEmphasis}
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
                    {DOC7_TEMPLATE_LABELS.hazard}
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div
                      style={{ position: 'relative' }}
                      onBlur={(event) => handleRecommendationBlur('expectedRisk', event)}
                    >
                      <textarea
                        className={`app-textarea ${styles.doc7TextareaDouble}`}
                        rows={2}
                        maxLength={220}
                        value={item.improvementRequest || item.improvementPlan}
                        onFocus={() => setActiveRecommendationField('expectedRisk')}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveRecommendationField((current) =>
                              current === 'expectedRisk' ? null : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updateFinding((finding) => {
                            const nextFinding =
                              clearHazardCountermeasureSelectionFromFinding(finding);
                            return {
                              ...nextFinding,
                              improvementPlan: event.target.value,
                              improvementRequest: event.target.value,
                            };
                          })
                        }
                      />
                      {activeRecommendationField === 'expectedRisk' &&
                      activeRecommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {activeRecommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectHazardCountermeasureItem(catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'expectedRisk')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    {DOC7_TEMPLATE_LABELS.controlMeasure}
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div
                      style={{ position: 'relative' }}
                      onBlur={(event) => handleRecommendationBlur('countermeasure', event)}
                    >
                      <textarea
                        className={`app-textarea ${styles.doc7TextareaFive}`}
                        rows={5}
                        value={item.emphasis}
                        onFocus={() => setActiveRecommendationField('countermeasure')}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveRecommendationField((current) =>
                              current === 'countermeasure' ? null : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updateFinding((finding) => ({
                            ...clearHazardCountermeasureSelectionFromFinding(finding),
                            emphasis: event.target.value,
                          }))
                        }
                      />
                      {activeRecommendationField === 'countermeasure' &&
                      activeRecommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {activeRecommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectHazardCountermeasureItem(catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'countermeasure')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    {DOC7_TEMPLATE_LABELS.legalReference}
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div
                      style={{ position: 'relative' }}
                      onBlur={(event) => handleRecommendationBlur('legalReference', event)}
                    >
                      <input
                        type="text"
                        className="app-input"
                        value={item.legalReferenceTitle}
                        placeholder={DOC7_TEMPLATE_LABELS.legalPlaceholder}
                        onFocus={() => setActiveRecommendationField('legalReference')}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            setActiveRecommendationField((current) =>
                              current === 'legalReference' ? null : current,
                            );
                          }
                        }}
                        onChange={(event) =>
                          updateFinding((finding) => ({
                            ...clearHazardCountermeasureSelectionFromFinding(finding),
                            legalReferenceId: '',
                            legalReferenceTitle: event.target.value,
                            referenceLawTitles: event.target.value
                              .split(/[\n,]+/)
                              .map((entry) => entry.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                      {activeRecommendationField === 'legalReference' &&
                      activeRecommendations.length > 0 ? (
                        <div
                          id={recommendationListId}
                          className={styles.doc8RecommendationList}
                          role="listbox"
                          style={{ top: 'calc(100% + 6px)', left: 0, right: 0 }}
                        >
                          {activeRecommendations.map((catalogItem) => (
                            <button
                              key={catalogItem.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={styles.doc8RecommendationButton}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectHazardCountermeasureItem(catalogItem)}
                            >
                              {buildRecommendationLabel(catalogItem, 'legalReference')}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
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
                    {DOC7_TEMPLATE_LABELS.reference1Label}
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
                        aria-label={DOC7_TEMPLATE_LABELS.reference1PreviewAria}
                      >
                        <PicturePreviewIcon />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={styles.doc7LabelCell}>
                    {DOC7_TEMPLATE_LABELS.reference2Label}
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
                        aria-label={DOC7_TEMPLATE_LABELS.reference2PreviewAria}
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
            ? reference1Label || DOC7_TEMPLATE_LABELS.reference1Label
            : reference2Label || DOC7_TEMPLATE_LABELS.reference2Label
        }
        size="large"
        onClose={() => setPreviewKind(null)}
        actions={
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => setPreviewKind(null)}
          >
            {DOC7_TEMPLATE_LABELS.close}
          </button>
        }
      >
        {previewKind === 'reference1' ? (
          <div className={styles.doc7ReferencePreviewModal}>
            {hasReferencePreviewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={referenceImageValue}
                alt={reference1Label || DOC7_TEMPLATE_LABELS.reference1Label}
                className={styles.doc7ReferencePreviewImage}
              />
            ) : (
              <div className={styles.doc7ReferencePreviewText}>
                {referenceImageValue || DOC7_TEMPLATE_LABELS.previewEmpty}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.doc7ReferencePreviewModal}>
            <div className={styles.doc7ReferencePreviewText}>
              {referenceDescriptionValue || DOC7_TEMPLATE_LABELS.previewEmpty}
            </div>
          </div>
        )}
      </AppModal>
    </>
  );
}
