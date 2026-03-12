import HazardReportTable from '@/components/HazardReportTable';
import HazardUploadPanel from '@/components/HazardUploadPanel';
import type { HazardReportItem } from '@/types/hazard';
import type { InspectionHazardItem } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionCurrentHazardsSectionProps {
  items: InspectionHazardItem[];
  onUploadSuccess: (reports: HazardReportItem[]) => void;
  onAdd: () => void;
  onRemove: (itemId: string) => void;
  onChange: (itemId: string, data: HazardReportItem) => void;
}

export default function SessionCurrentHazardsSection({
  items,
  onUploadSuccess,
  onAdd,
  onRemove,
  onChange,
}: SessionCurrentHazardsSectionProps) {
  return (
    <div className={styles.sectionStack}>
      <HazardUploadPanel
        onSuccess={onUploadSuccess}
        onRawResponse={() => undefined}
      />

      <div className={styles.hazardToolbar}>
        <div className={styles.bottomActions}>
          <button
            type="button"
            onClick={onAdd}
            className="app-button app-button-primary"
          >
            항목 추가
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className={styles.hazardReportList}>
          {items.map((item, index) => (
            <div key={item.id} className={styles.hazardReportCard}>
              <HazardReportTable
                data={item}
                onChange={(data) => onChange(item.id, data)}
                index={index}
                headerActions={
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="app-button app-button-danger"
                  >
                    삭제
                  </button>
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyPanel}>
          아직 위험요인 보고서가 없습니다. 사진을 업로드하거나 항목을 추가해 바로
          작성하면 됩니다.
        </div>
      )}
    </div>
  );
}
