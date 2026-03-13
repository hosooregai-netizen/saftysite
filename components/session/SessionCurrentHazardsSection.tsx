'use client';

import { useEffect } from 'react';
import HazardReportTable from '@/components/HazardReportTable';
import type { HazardReportItem } from '@/types/hazard';
import type { InspectionHazardItem } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionCurrentHazardsSectionProps {
  items: InspectionHazardItem[];
  onAdd: () => void;
  onRemove: (itemId: string) => void;
  onChange: (itemId: string, data: HazardReportItem) => void;
}

export default function SessionCurrentHazardsSection({
  items,
  onAdd,
  onRemove,
  onChange,
}: SessionCurrentHazardsSectionProps) {
  useEffect(() => {
    if (items.length === 0) {
      onAdd();
    }
  }, [items.length, onAdd]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectionStack}>
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
    </div>
  );
}
