'use client';

import { type ChangeEvent, type ReactNode } from 'react';
import {
  createEducationSupportItem,
  createEquipmentCheckItem,
  createOtherSupportItem,
  createTechnicalMaterialItem,
} from '@/constants/inspectionSession';
import { useImageSourcePicker } from '@/hooks/useImageSourcePicker';
import type {
  EducationSupportItem,
  EquipmentCheckItem,
  OtherSupportItem,
  SupportItems,
  TechnicalMaterialItem,
} from '@/types/inspectionSession';
import { readFileAsDataUrl } from './sessionUtils';
import styles from './SessionSupportSection.module.css';

interface SessionSupportSectionProps {
  items: SupportItems;
  onChange: (items: SupportItems) => void;
}

type RowSectionKey =
  | 'technicalMaterials'
  | 'equipmentChecks'
  | 'educationSupports'
  | 'otherSupports';

type SupportRowMap = {
  technicalMaterials: TechnicalMaterialItem;
  equipmentChecks: EquipmentCheckItem;
  educationSupports: EducationSupportItem;
  otherSupports: OtherSupportItem;
};

function createRowBySection(key: RowSectionKey): SupportRowMap[RowSectionKey] {
  switch (key) {
    case 'technicalMaterials':
      return createTechnicalMaterialItem();
    case 'equipmentChecks':
      return createEquipmentCheckItem();
    case 'educationSupports':
      return createEducationSupportItem();
    case 'otherSupports':
      return createOtherSupportItem();
  }
}

function FieldPair({
  leftLabel,
  leftInput,
  rightLabel,
  rightInput,
}: {
  leftLabel: string;
  leftInput: ReactNode;
  rightLabel?: string;
  rightInput?: ReactNode;
}) {
  return (
    <div className={styles.detailRow}>
      <div className={styles.detailLabel}>{leftLabel}</div>
      <div className={styles.detailValue}>{leftInput}</div>
      {rightLabel ? <div className={styles.detailLabel}>{rightLabel}</div> : null}
      {rightInput ? <div className={styles.detailValue}>{rightInput}</div> : null}
    </div>
  );
}

function FieldWide({
  label,
  input,
}: {
  label: string;
  input: ReactNode;
}) {
  return (
    <div className={`${styles.detailRow} ${styles.detailRowWide}`}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={`${styles.detailValue} ${styles.detailValueWide}`}>{input}</div>
    </div>
  );
}

function PhotoInputCell({
  photoUrl,
  pickerTitle,
  emptyTitle = '이미지 선택',
  emptyHint = '클릭해서 사진을 추가하세요.',
  onChange,
}: {
  photoUrl: string;
  pickerTitle: string;
  emptyTitle?: string;
  emptyHint?: string;
  onChange: (nextPhotoUrl: string) => void;
}) {
  const { galleryInputRef, cameraInputRef, requestPick, pickerModal } =
    useImageSourcePicker({ title: pickerTitle });

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onChange(await readFileAsDataUrl(file));
  };

  return (
    <div className={styles.photoCell}>
      <div className={styles.photoHeader}>사진</div>
      <div className={styles.photoBody}>
        {photoUrl ? (
          <div className={styles.photoPreviewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={pickerTitle} className={styles.photoPreview} />
            <div className={styles.photoActions}>
              <button
                type="button"
                onClick={requestPick}
                className={styles.photoAction}
              >
                사진 변경
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className={styles.photoRemoveButton}
              >
                사진 제거
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={requestPick}
            className={styles.photoPlaceholder}
          >
            <span>{emptyTitle}</span>
            <span className={styles.photoPlaceholderHint}>{emptyHint}</span>
          </button>
        )}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            void handleFileChange(event);
          }}
          className={styles.hiddenInput}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            void handleFileChange(event);
          }}
          className={styles.hiddenInput}
        />
      </div>
      {pickerModal}
    </div>
  );
}

function TechnicalMaterialCard({
  item,
  onChange,
  onRemove,
}: {
  item: TechnicalMaterialItem;
  onChange: (patch: Partial<TechnicalMaterialItem>) => void;
  onRemove: () => void;
}) {
  return (
    <article className={styles.entryCard}>
      <div className={styles.entryGrid}>
        <PhotoInputCell
          photoUrl={item.photoUrl}
          pickerTitle="기술자료 사진 추가"
          onChange={(photoUrl) => onChange({ photoUrl })}
        />

        <div className={styles.contentCell}>
          <div className={styles.contentHeader}>
            <span className={styles.contentHeaderTitle}>내용</span>
            <button type="button" onClick={onRemove} className={styles.removeButton}>
              삭제
            </button>
          </div>

          <div className={styles.detailTable}>
            <FieldPair
              leftLabel="자료명칭"
              leftInput={
                <input
                  type="text"
                  value={item.materialName}
                  onChange={(event) => onChange({ materialName: event.target.value })}
                  className="app-input"
                  placeholder="예: 산업안전보건자료"
                />
              }
              rightLabel="제공수(종류)"
              rightInput={
                <input
                  type="text"
                  value={item.providedKinds}
                  onChange={(event) => onChange({ providedKinds: event.target.value })}
                  className="app-input"
                  placeholder="예: 3종 / 12부"
                />
              }
            />
            <FieldWide
              label="교육인원"
              input={
                <input
                  type="text"
                  value={item.participantCount}
                  onChange={(event) => onChange({ participantCount: event.target.value })}
                  className="app-input"
                  placeholder="예: 23명"
                />
              }
            />
            <FieldWide
              label="교육내용"
              input={
                <textarea
                  value={item.educationContent}
                  onChange={(event) => onChange({ educationContent: event.target.value })}
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={5}
                  placeholder="교육내용을 입력합니다."
                />
              }
            />
            <FieldWide
              label="비고"
              input={
                <textarea
                  value={item.note}
                  onChange={(event) => onChange({ note: event.target.value })}
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={3}
                  placeholder="추가 메모가 있으면 입력합니다."
                />
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function EquipmentCheckCard({
  item,
  onChange,
  onRemove,
}: {
  item: EquipmentCheckItem;
  onChange: (patch: Partial<EquipmentCheckItem>) => void;
  onRemove: () => void;
}) {
  return (
    <article className={styles.entryCard}>
      <div className={styles.entryGrid}>
        <PhotoInputCell
          photoUrl={item.photoUrl}
          pickerTitle="장비 사진 추가"
          onChange={(photoUrl) => onChange({ photoUrl })}
        />

        <div className={styles.contentCell}>
          <div className={styles.contentHeader}>
            <span className={styles.contentHeaderTitle}>내용</span>
            <button type="button" onClick={onRemove} className={styles.removeButton}>
              삭제
            </button>
          </div>

          <div className={styles.detailTable}>
            <FieldPair
              leftLabel="장비명"
              leftInput={
                <input
                  type="text"
                  value={item.equipmentName}
                  onChange={(event) => onChange({ equipmentName: event.target.value })}
                  className="app-input"
                  placeholder="예: 조도계"
                />
              }
              rightLabel="측정 장소"
              rightInput={
                <input
                  type="text"
                  value={item.measurementLocation}
                  onChange={(event) =>
                    onChange({ measurementLocation: event.target.value })
                  }
                  className="app-input"
                  placeholder="예: 6층"
                />
              }
            />
            <FieldWide
              label="측정 기준"
              input={
                <textarea
                  value={item.measurementCriteria}
                  onChange={(event) =>
                    onChange({ measurementCriteria: event.target.value })
                  }
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={4}
                  placeholder="측정 기준을 입력합니다."
                />
              }
            />
            <FieldPair
              leftLabel="측정값"
              leftInput={
                <input
                  type="text"
                  value={item.measuredValue}
                  onChange={(event) => onChange({ measuredValue: event.target.value })}
                  className="app-input"
                  placeholder="예: 243Lux"
                />
              }
              rightLabel="적합 여부"
              rightInput={
                <input
                  type="text"
                  value={item.suitability}
                  onChange={(event) => onChange({ suitability: event.target.value })}
                  className="app-input"
                  placeholder="예: 적합"
                />
              }
            />
            <FieldWide
              label="비고"
              input={
                <textarea
                  value={item.note}
                  onChange={(event) => onChange({ note: event.target.value })}
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={3}
                  placeholder="비고를 입력합니다."
                />
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function SupportEntryCard({
  title,
  item,
  onChange,
  onRemove,
}: {
  title: string;
  item: EducationSupportItem | OtherSupportItem;
  onChange: (patch: Partial<EducationSupportItem | OtherSupportItem>) => void;
  onRemove: () => void;
}) {
  return (
    <article className={styles.entryCard}>
      <div className={styles.entryGrid}>
        <PhotoInputCell
          photoUrl={item.photoUrl}
          pickerTitle={`${title} 사진 추가`}
          onChange={(photoUrl) => onChange({ photoUrl })}
        />

        <div className={styles.contentCell}>
          <div className={styles.contentHeader}>
            <span className={styles.contentHeaderTitle}>내용</span>
            <button type="button" onClick={onRemove} className={styles.removeButton}>
              삭제
            </button>
          </div>

          <div className={styles.detailTable}>
            <FieldWide
              label="지원사항"
              input={
                <input
                  type="text"
                  value={item.supportItem}
                  onChange={(event) => onChange({ supportItem: event.target.value })}
                  className="app-input"
                  placeholder="예: TBM 및 위험성평가 지도"
                />
              }
            />
            <FieldWide
              label="구체적 사항"
              input={
                <textarea
                  value={item.details}
                  onChange={(event) => onChange({ details: event.target.value })}
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={6}
                  placeholder="구체적 사항을 입력합니다."
                />
              }
            />
            <FieldWide
              label="비고"
              input={
                <textarea
                  value={item.note}
                  onChange={(event) => onChange({ note: event.target.value })}
                  className={`app-textarea ${styles.detailTextarea}`}
                  rows={3}
                  placeholder="비고를 입력합니다."
                />
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function AccidentSummaryCard({
  items,
  onChange,
}: {
  items: SupportItems['accidentSummary'];
  onChange: (patch: Partial<SupportItems['accidentSummary']>) => void;
}) {
  return (
    <div className={styles.accidentCard}>
      <div className={styles.accidentHeader}>산업재해 발생 유무</div>
      <div className={styles.accidentTable}>
        <FieldPair
          leftLabel="기간 시작"
          leftInput={
            <input
              type="date"
              value={items.periodStart}
              onChange={(event) => onChange({ periodStart: event.target.value })}
              className="app-input"
            />
          }
          rightLabel="기간 종료"
          rightInput={
            <input
              type="date"
              value={items.periodEnd}
              onChange={(event) => onChange({ periodEnd: event.target.value })}
              className="app-input"
            />
          }
        />
        <FieldWide
          label="재해 내용"
          input={
            <textarea
              value={items.accidentDescription}
              onChange={(event) =>
                onChange({ accidentDescription: event.target.value })
              }
              className={`app-textarea ${styles.detailTextarea}`}
              rows={4}
              placeholder="재해 내용을 입력합니다."
            />
          }
        />
        <FieldWide
          label="재해발생 유무"
          input={
            <div className={styles.choiceRow}>
              <button
                type="button"
                onClick={() => onChange({ occurred: false })}
                className={[
                  styles.choiceButton,
                  !items.occurred ? styles.choiceButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                무
              </button>
              <button
                type="button"
                onClick={() => onChange({ occurred: true })}
                className={[
                  styles.choiceButton,
                  items.occurred ? styles.choiceButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                유
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default function SessionSupportSection({
  items,
  onChange,
}: SessionSupportSectionProps) {
  const updateRows = <K extends RowSectionKey>(
    key: K,
    updater: (rows: SupportRowMap[K][]) => SupportRowMap[K][]
  ) => {
    onChange({
      ...items,
      [key]: updater(items[key] as SupportRowMap[K][]),
    } as SupportItems);
  };

  const addRow = (key: RowSectionKey) => {
    updateRows(key, (rows) => [...rows, createRowBySection(key) as SupportRowMap[typeof key]]);
  };

  const updateRow = <K extends RowSectionKey>(
    key: K,
    itemId: string,
    patch: Partial<SupportRowMap[K]>
  ) => {
    updateRows(key, (rows) =>
      rows.map((row) => (row.id === itemId ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (key: RowSectionKey, itemId: string) => {
    updateRows(key, (rows) => {
      const nextRows = rows.filter((row) => row.id !== itemId);
      return nextRows.length > 0
        ? nextRows
        : [createRowBySection(key) as SupportRowMap[typeof key]];
    });
  };

  return (
    <div className={styles.sectionStack}>
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>기술자료 배포 및 교육실적</h3>
          <button
            type="button"
            onClick={() => addRow('technicalMaterials')}
            className="app-button app-button-secondary"
          >
            행 추가
          </button>
        </div>
        <div className={styles.entryList}>
          {items.technicalMaterials.map((item) => (
            <TechnicalMaterialCard
              key={item.id}
              item={item}
              onChange={(patch) => updateRow('technicalMaterials', item.id, patch)}
              onRemove={() => removeRow('technicalMaterials', item.id)}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>장비</h3>
          <button
            type="button"
            onClick={() => addRow('equipmentChecks')}
            className="app-button app-button-secondary"
          >
            행 추가
          </button>
        </div>
        <div className={styles.entryList}>
          {items.equipmentChecks.map((item) => (
            <EquipmentCheckCard
              key={item.id}
              item={item}
              onChange={(patch) => updateRow('equipmentChecks', item.id, patch)}
              onRemove={() => removeRow('equipmentChecks', item.id)}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>교육</h3>
          <button
            type="button"
            onClick={() => addRow('educationSupports')}
            className="app-button app-button-secondary"
          >
            행 추가
          </button>
        </div>
        <div className={styles.entryList}>
          {items.educationSupports.map((item) => (
            <SupportEntryCard
              key={item.id}
              title="교육"
              item={item}
              onChange={(patch) => updateRow('educationSupports', item.id, patch)}
              onRemove={() => removeRow('educationSupports', item.id)}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>기타</h3>
          <button
            type="button"
            onClick={() => addRow('otherSupports')}
            className="app-button app-button-secondary"
          >
            행 추가
          </button>
        </div>
        <div className={styles.entryList}>
          {items.otherSupports.map((item) => (
            <SupportEntryCard
              key={item.id}
              title="기타"
              item={item}
              onChange={(patch) => updateRow('otherSupports', item.id, patch)}
              onRemove={() => removeRow('otherSupports', item.id)}
            />
          ))}
        </div>
      </section>

      <AccidentSummaryCard
        items={items.accidentSummary}
        onChange={(patch) =>
          onChange({
            ...items,
            accidentSummary: {
              ...items.accidentSummary,
              ...patch,
            },
          })
        }
      />
    </div>
  );
}
