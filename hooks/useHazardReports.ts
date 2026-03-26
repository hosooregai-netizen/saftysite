'use client';

import { useCallback, useState } from 'react';
import type { HazardReportItem } from '@/types/hazard';
import { createEmptyReport, MOCK_DATA } from '@/constants/hazard';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';

export interface UseHazardReportsReturn {
  reports: HazardReportItem[];
  rawResponse: unknown;
  useMock: boolean;
  setUseMock: (value: boolean) => void;
  setRawResponse: (raw: unknown) => void;
  handleReportChange: (index: number, data: HazardReportItem) => void;
  handleApiSuccess: (items: HazardReportItem[]) => void;
  handleUseMock: () => void;
  handleAddReport: () => void;
  handleRemoveReport: (index: number) => void;
  handleApplyDebugJson: (json: string) => Promise<string | null>;
}

export function useHazardReports(): UseHazardReportsReturn {
  const [reports, setReports] = useState<HazardReportItem[]>([]);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [useMock, setUseMock] = useState(false);

  const handleReportChange = useCallback(
    (index: number, newData: HazardReportItem) => {
      setReports((prev) =>
        prev.map((item, itemIndex) => (itemIndex === index ? newData : item))
      );
    },
    []
  );

  const handleApiSuccess = useCallback((items: HazardReportItem[]) => {
    setReports(items);
    setUseMock(false);
  }, []);

  const handleUseMock = useCallback(() => {
    setReports(MOCK_DATA);
    setUseMock(true);
    setRawResponse(null);
  }, []);

  const handleAddReport = useCallback(() => {
    setReports((prev) => [...prev, createEmptyReport()]);
  }, []);

  const handleRemoveReport = useCallback((index: number) => {
    setReports((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }, []);

  const handleApplyDebugJson = useCallback(
    async (json: string): Promise<string | null> => {
      const trimmed = json.trim();
      if (!trimmed) return null;

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const items = await normalizeHazardResponse(parsed);
        if (items.length === 0) {
          return '적용할 보고서 항목이 없습니다.';
        }
        setReports(items);
        setUseMock(false);
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : 'JSON 파싱 오류';
      }
    },
    []
  );

  return {
    reports,
    rawResponse,
    useMock,
    setUseMock,
    setRawResponse,
    handleReportChange,
    handleApiSuccess,
    handleUseMock,
    handleAddReport,
    handleRemoveReport,
    handleApplyDebugJson,
  };
}

