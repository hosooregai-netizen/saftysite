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
  onPhotoSelectStart: (itemId: string) => void;
  onAppendReports: (itemId: string, reports: HazardReportItem[]) => void;
}

export default function SessionCurrentHazardsSection({
  items,
  onAdd,
  onRemove,
  onChange,
  onPhotoSelectStart,
  onAppendReports,
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
      <div className={styles.hazardReportList}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.hazardReportCard}>
            <HazardReportTable
              data={item}
              onChange={(data) => onChange(item.id, data)}
              onPhotoSelectStart={() => onPhotoSelectStart(item.id)}
              onAppendReports={(reports) => onAppendReports(item.id, reports)}
              index={index}
              headerActions={
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className={styles.dangerIconButton}
                  aria-label="항목 삭제"
                  title="항목 삭제"
                >
                  ×
                </button>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
