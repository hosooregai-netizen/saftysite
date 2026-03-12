'use client';

import { useCallback, useRef } from 'react';
import type { HazardReportItem } from '@/types/hazard';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

interface HazardReportTableProps {
  data: HazardReportItem;
  onChange: (data: HazardReportItem) => void;
  index: number;
}

export default function HazardReportTable({
  data,
  onChange,
  index,
}: HazardReportTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: hazardFactorsRef, resize: resizeHazard } =
    useAutoResizeTextarea(data.hazardFactors, 88);
  const { ref: improvementItemsRef, resize: resizeImprovement } =
    useAutoResizeTextarea(data.improvementItems, 88);
  const { ref: legalInfoRef, resize: resizeLegal } = useAutoResizeTextarea(
    data.legalInfo,
    128
  );

  const handleChange = useCallback(
    (field: keyof HazardReportItem, value: string) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleChange('photoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    handleChange('photoUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className="mb-8 break-inside-avoid space-y-0">
      <table className="min-w-[680px] w-full table-fixed border-collapse border border-black bg-white text-black">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[32%]" />
          <col className="w-[18%]" />
          <col className="w-[32%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-black p-2 text-center font-semibold">
              유해·위험요소
            </th>
            <th className="border border-black p-2 text-left">
              <input
                type="text"
                value={data.locationDetail}
                onChange={(e) => handleChange('locationDetail', e.target.value)}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="예: 외벽 보수 구간"
              />
            </th>
            <th className="border border-black p-2 text-center font-semibold">
              위험도 평가 결과
            </th>
            <th className="border border-black p-2 text-left">
              <input
                type="text"
                value={data.riskAssessmentResult}
                onChange={(e) =>
                  handleChange('riskAssessmentResult', e.target.value)
                }
                className="w-full min-w-0 border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="예: 보통 (4)"
              />
            </th>
          </tr>
        </thead>
      </table>

      <table className="min-w-[680px] w-full table-fixed border-collapse border border-black border-t-0 bg-white text-black">
        <colgroup>
          <col className="w-[8%]" />
          <col className="w-[25%]" />
          <col className="w-[8%]" />
          <col className="w-[59%]" />
        </colgroup>
        <tbody>
          <tr>
            <td
              className="border border-black p-2 text-center font-semibold"
              colSpan={2}
            >
              유해·위험요인
            </td>
            <td
              className="border border-black p-2 text-center font-semibold"
              colSpan={2}
            >
              지도사항 및 개선대책
            </td>
          </tr>
          <tr>
            <td
              className="border border-black p-2 align-top [&_textarea]:block"
              colSpan={2}
            >
              <textarea
                ref={hazardFactorsRef}
                value={data.hazardFactors}
                onChange={(e) => {
                  handleChange('hazardFactors', e.target.value);
                  requestAnimationFrame(() => resizeHazard());
                }}
                className="w-full resize-none whitespace-pre-wrap break-words border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="예: 개구부 주변에서 작업 중 추락 위험이 확인됨"
                rows={3}
              />
            </td>
            <td
              className="border border-black p-2 align-top [&_textarea]:block"
              colSpan={2}
            >
              <textarea
                ref={improvementItemsRef}
                value={data.improvementItems}
                onChange={(e) => {
                  handleChange('improvementItems', e.target.value);
                  requestAnimationFrame(() => resizeImprovement());
                }}
                className="w-full resize-none whitespace-pre-wrap break-words border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="예: 안전난간 설치, 출입통제, 작업 전 교육 실시"
                rows={3}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 align-top" colSpan={2}>
              <div className="flex min-h-[128px] flex-col items-center justify-center gap-2 bg-slate-50 print:bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id={`hazard-photo-${index}`}
                />
                {data.photoUrl ? (
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.photoUrl}
                      alt="위험요인 사진"
                      className="mx-auto max-h-[180px] w-auto object-contain"
                    />
                    <div className="mt-2 flex gap-2 print:hidden">
                      <label
                        htmlFor={`hazard-photo-${index}`}
                        className="cursor-pointer text-xs font-medium text-sky-700 hover:underline"
                      >
                        사진 변경
                      </label>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        사진 제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`hazard-photo-${index}`}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-slate-400 px-4 py-6 text-sm text-slate-500 hover:border-slate-900 hover:text-slate-900 print:border-slate-300"
                  >
                    <span>이미지 선택</span>
                    <span className="text-xs">클릭해서 사진을 추가하세요.</span>
                  </label>
                )}
              </div>
            </td>
            <td
              className="border border-black p-2 align-top [&_textarea]:block"
              colSpan={2}
            >
              <textarea
                ref={legalInfoRef}
                value={data.legalInfo}
                onChange={(e) => {
                  handleChange('legalInfo', e.target.value);
                  requestAnimationFrame(() => resizeLegal());
                }}
                className="w-full resize-none whitespace-pre-wrap break-words border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="관련 법령, 기준, 참고사항을 입력하세요."
                rows={5}
              />
            </td>
          </tr>
          <tr>
            <td
              className="border border-black p-2 text-center font-semibold"
              colSpan={2}
            >
              이행시기
            </td>
            <td className="border border-black p-2" colSpan={2}>
              <input
                type="text"
                value={data.implementationPeriod}
                onChange={(e) =>
                  handleChange('implementationPeriod', e.target.value)
                }
                className="w-full min-w-0 border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="예: 즉시 이행"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-1 text-sm text-slate-500 print:hidden">
        보고서 #{index + 1}
      </p>
    </section>
  );
}
