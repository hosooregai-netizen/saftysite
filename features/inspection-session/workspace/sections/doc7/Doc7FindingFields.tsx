import { useMemo, useState, type FocusEvent } from 'react';
import {
  ACCIDENT_TYPE_OPTIONS,
  CAUSATIVE_AGENT_LABELS,
  CAUSATIVE_AGENT_OPTIONS,
} from '@/constants/inspectionSession/doc7Catalog';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import { RISK_TRI_LEVEL_OPTIONS } from '@/components/session/workspace/constants';
import {
  applyHazardCountermeasureSelectionToFinding,
  clearHazardCountermeasureSelectionFromFinding,
  getHazardCountermeasureFieldText,
  getHazardCountermeasureRecommendations,
  type HazardCountermeasureCatalogMatchField,
} from '@/lib/hazardCountermeasureCatalog';
import {
  applyDoc7ReferenceMaterialSelection,
  buildDoc7ReferenceMaterialLabel,
  clearDoc7ReferenceMaterialSelection,
} from '@/lib/doc7ReferenceMaterials';
import type {
  SafetyDoc7ReferenceMaterialCatalogItem,
  SafetyHazardCountermeasureCatalogItem,
} from '@/types/backend';
import type { CurrentHazardFinding } from '@/types/inspectionSession';
import type { CausativeAgentKey } from '@/types/siteOverview';
import { Doc7ReferenceMaterialPickerModal } from './Doc7ReferenceMaterialPickerModal';
import { Doc7ReferenceMaterialPreviewModal } from './Doc7ReferenceMaterialPreviewModal';

interface Doc7FindingFieldsProps {
  doc7ReferenceMaterials: SafetyDoc7ReferenceMaterialCatalogItem[];
  hazardCountermeasureCatalog: SafetyHazardCountermeasureCatalogItem[];
  item: CurrentHazardFinding;
  onAccidentTypeChange: (value: string) => void;
  onCausativeAgentChange: (value: CausativeAgentKey | '') => void;
  selectValueForRiskLevel: (stored: string) => string;
  updateFinding: (updater: (finding: CurrentHazardFinding) => CurrentHazardFinding) => void;
}

const DOC7_TEMPLATE_LABELS = {
  controlMeasure: '관리대책',
  hazard: '위험요인',
  inspectorEmphasis: '지도요원 강조사항',
  legacyReferenceLabel: '기존 참고자료',
  legalPlaceholder: '법령 제목은 쉼표 또는 줄바꿈으로 구분해 입력',
  legalReference: '참고법령',
  referenceEmpty: '선택된 참고자료가 없습니다.',
  referenceLabel: '관련 중대재해 사례 및 예방대책',
  referencePreviewEmpty: '표시할 참고자료가 없습니다.',
} as const;

function buildReferenceDisplayLabel(
  item: CurrentHazardFinding,
  hasSelectedReference: boolean,
): string {
  const accidentType = item.referenceCatalogAccidentType.trim();
  const causative = item.referenceCatalogCausativeAgentKey.trim();

  if (accidentType) {
    const label = buildDoc7ReferenceMaterialLabel({
      accidentType,
      causativeAgentKey: causative || '일반',
    });
    return label;
  }

  return hasSelectedReference
    ? DOC7_TEMPLATE_LABELS.legacyReferenceLabel
    : DOC7_TEMPLATE_LABELS.referenceEmpty;
}

export function Doc7FindingFields({
  doc7ReferenceMaterials,
  hazardCountermeasureCatalog,
  item,
  onAccidentTypeChange,
  onCausativeAgentChange,
  selectValueForRiskLevel,
  updateFinding,
}: Doc7FindingFieldsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeRecommendationField, setActiveRecommendationField] =
    useState<HazardCountermeasureCatalogMatchField | null>(null);

  const referenceImageValue = item.referenceMaterialImage || item.referenceMaterial1;
  const referenceDescriptionValue =
    item.referenceMaterialDescription || item.referenceMaterial2;
  const hasSelectedReference = Boolean(
    referenceImageValue.trim() || referenceDescriptionValue.trim(),
  );
  const referenceDisplayLabel = useMemo(
    () => buildReferenceDisplayLabel(item, hasSelectedReference),
    [hasSelectedReference, item],
  );
  const recommendationListId =
    activeRecommendationField
      ? `doc7-hazard-countermeasure-${item.id}-${activeRecommendationField}`
      : '';
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

  const selectHazardCountermeasureItem = (
    catalogItem: SafetyHazardCountermeasureCatalogItem,
  ) => {
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
                    사고유형
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
                    {DOC7_TEMPLATE_LABELS.referenceLabel}
                  </th>
                  <td className={styles.doc7ValueCell}>
                    <div className={styles.doc7ReferenceSelectionRow}>
                      <button
                        type="button"
                        className={`${styles.doc7ReferenceSelectionValue} ${
                          hasSelectedReference ? '' : styles.doc7ReferenceDisplayEmpty
                        }`}
                        onClick={() => setIsPreviewOpen(true)}
                        disabled={!hasSelectedReference}
                      >
                        {referenceDisplayLabel}
                      </button>
                      <div className={styles.doc7ReferenceSelectionActions}>
                        <button
                          type="button"
                          className={styles.doc7ReferenceActionButton}
                          onClick={() => setIsPickerOpen(true)}
                        >
                          참고자료 선택
                        </button>
                        <button
                          type="button"
                          className={styles.doc7ReferenceActionButton}
                          onClick={() =>
                            updateFinding((finding) => ({
                              ...clearDoc7ReferenceMaterialSelection(finding),
                              referenceCatalogAccidentType: '',
                              referenceCatalogCausativeAgentKey: '',
                            }))
                          }
                          disabled={!hasSelectedReference}
                        >
                          해제
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Doc7ReferenceMaterialPreviewModal
        description={referenceDescriptionValue}
        imageUrl={referenceImageValue}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={
          hasSelectedReference
            ? referenceDisplayLabel
            : DOC7_TEMPLATE_LABELS.referencePreviewEmpty
        }
      />
      <Doc7ReferenceMaterialPickerModal
        items={doc7ReferenceMaterials}
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(referenceItem) =>
          updateFinding((finding) => ({
            ...applyDoc7ReferenceMaterialSelection(finding, referenceItem),
            referenceCatalogAccidentType: referenceItem.accidentType,
            referenceCatalogCausativeAgentKey: referenceItem.causativeAgentKey,
          }))
        }
      />
    </>
  );
}
