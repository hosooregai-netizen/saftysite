'use client';

import { useEffect } from 'react';
import HazardReportTable from '@/components/HazardReportTable';
import type { HazardReportItem } from '@/types/hazard';
import type { FutureProcessRiskItem } from '@/types/inspectionSession';
import styles from './InspectionSessionWorkspace.module.css';

interface SessionFutureRisksSectionProps {
  items: FutureProcessRiskItem[];
  onAdd: () => void;
  onChange: (itemId: string, data: HazardReportItem) => void;
  onPhotoSelectStart: (itemId: string) => void;
  onAppendReports: (itemId: string, reports: HazardReportItem[]) => void;
  onRemove: (itemId: string) => void;
}

export default function SessionFutureRisksSection({
  items,
  onAdd,
  onChange,
  onPhotoSelectStart,
  onAppendReports,
  onRemove,
}: SessionFutureRisksSectionProps) {
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
              index={index + 100}
              hiddenFields={{
                implementationPeriod: true,
              }}
              text={{
                locationDetailLabel: '다음 진행 공정',
                locationDetailPlaceholder: '예: 철근 가공 및 반입 작업',
                photoLabel: '공정 관련 사진',
                photoAlt: '향후 공정 사진',
                hazardFactorsLabel: '유해위험요인',
                hazardFactorsPlaceholder: '예: 낙하물 충돌, 협착 위험',
                legalInfoLabel: '비고 / 참고사항',
                legalInfoPlaceholder: '예: 공정 전달 메모, 추가 확인 사항',
              }}
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
