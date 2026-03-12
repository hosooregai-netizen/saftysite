import HazardReportTable from '@/components/HazardReportTable';
import HazardUploadPanel from '@/components/HazardUploadPanel';
import type { HazardReportItem } from '@/types/hazard';
import type { DraftState, InspectionHazardItem } from '@/types/inspectionSession';
import { DRAFT_OPTIONS, summarize } from './sessionUtils';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionCurrentHazardsSectionProps {
  items: InspectionHazardItem[];
  selectedItem: InspectionHazardItem | null;
  onSelect: (itemId: string) => void;
  onUploadSuccess: (reports: HazardReportItem[]) => void;
  onAdd: () => void;
  onRemove: (itemId: string) => void;
  onChange: (itemId: string, data: HazardReportItem) => void;
  onStatusChange: (itemId: string, status: DraftState) => void;
}

export default function SessionCurrentHazardsSection({
  items,
  selectedItem,
  onSelect,
  onUploadSuccess,
  onAdd,
  onRemove,
  onChange,
  onStatusChange,
}: SessionCurrentHazardsSectionProps) {
  return (
    <div className={styles.sectionStack}>
      <HazardUploadPanel
        onSuccess={onUploadSuccess}
        onRawResponse={() => undefined}
      />

      <div className={styles.hazardToolbar}>
        <p className={styles.relatedHint}>
          사진 여러 장을 한 번에 올리면 개수만큼 위험요인 초안이 추가됩니다.
        </p>
        <div className={styles.bottomActions}>
          <button
            type="button"
            onClick={onAdd}
            className="app-button app-button-primary"
          >
            수동 항목 추가
          </button>
          {selectedItem && (
            <button
              type="button"
              onClick={() => onRemove(selectedItem.id)}
              className="app-button app-button-secondary"
            >
              선택 항목 삭제
            </button>
          )}
        </div>
      </div>

      <div className={styles.hazardLayout}>
        <aside className={styles.hazardSidebar}>
          <div className={styles.hazardSidebarHeader}>
            <h3 className={styles.hazardSidebarTitle}>위험요인 목록</h3>
            <span className="app-chip">{items.length}건</span>
          </div>

          {items.length > 0 ? (
            <div className={styles.hazardList}>
              {items.map((item, index) => {
                const className = [
                  styles.hazardItemButton,
                  selectedItem?.id === item.id ? styles.hazardItemButtonActive : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={className}
                  >
                    <p className={styles.hazardItemTitle}>위험요인 #{index + 1}</p>
                    <p className={styles.hazardItemMeta}>
                      {item.locationDetail || item.location || '위치 미입력'} ·{' '}
                      {item.status === 'reviewed' ? '검토완료' : '초안'}
                    </p>
                    <p className={styles.hazardItemSnippet}>
                      {summarize(
                        item.hazardFactors,
                        '위험요인 설명을 입력하거나 사진 초안을 생성합니다.'
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyPanel}>
              아직 위험요인 항목이 없습니다. 사진을 업로드하거나 수동 항목을
              추가해 작업을 시작합니다.
            </div>
          )}
        </aside>

        <div className={styles.hazardDetail}>
          {selectedItem ? (
            <>
              <div className={styles.hazardDetailHeader}>
                <div>
                  <h3 className={styles.itemTitle}>선택 항목 상세 편집</h3>
                  <p className={styles.fieldHint}>
                    현장 항목 리스트에서 선택한 초안을 바로 수정합니다.
                  </p>
                </div>

                <div className={styles.statusRow}>
                  {DRAFT_OPTIONS.map((option) => {
                    const className = [
                      styles.statusButton,
                      selectedItem.status === option.value
                        ? styles.statusButtonActive
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onStatusChange(selectedItem.id, option.value)}
                        className={className}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <HazardReportTable
                data={selectedItem}
                onChange={(data) => onChange(selectedItem.id, data)}
                index={items.findIndex((item) => item.id === selectedItem.id)}
              />
            </>
          ) : (
            <div className={styles.emptyPanel}>왼쪽 목록에서 편집할 항목을 선택합니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
