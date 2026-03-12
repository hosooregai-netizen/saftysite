'use client';

import { useRef, useCallback } from 'react';
import { type HazardReportItem } from '@/types/hazard';
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
  const { ref: hazardFactorsRef, resize: resizeHazard } = useAutoResizeTextarea(data.hazardFactors, 80);
  const { ref: improvementItemsRef, resize: resizeImprovement } = useAutoResizeTextarea(data.improvementItems, 80);
  const { ref: legalInfoRef, resize: resizeLegal } = useAutoResizeTextarea(data.legalInfo, 120);

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
    <div className="mb-8 break-inside-avoid space-y-0">
      {/* 상단: 유해·위험장소 / 위험성 평가 결과 (좌우 1:1) */}
      <table className="min-w-[640px] w-full border-collapse border border-black bg-white text-black overflow-visible table-fixed">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[32%]" />
          <col className="w-[18%]" />
          <col className="w-[32%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border border-black p-2 text-center font-semibold align-top whitespace-nowrap">
              유해·위험장소
            </th>
            <th className="border border-black p-2 text-left align-top">
              <input
                type="text"
                value={data.locationDetail}
                onChange={(e) => handleChange('locationDetail', e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                placeholder="전층 복층 구간"
              />
            </th>
            <th className="border border-black p-2 text-center font-semibold align-top whitespace-nowrap">
              위험성 평가 결과
            </th>
            <th className="border border-black p-2 text-left align-top">
              <input
                type="text"
                value={data.riskAssessmentResult}
                onChange={(e) =>
                  handleChange('riskAssessmentResult', e.target.value)
                }
                className="w-full border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                placeholder="보통 (4)"
              />
            </th>
          </tr>
        </thead>
      </table>

      {/* 유해·위험요인 ~ 이행시기 (좌우 1:2) */}
      <table className="min-w-[640px] w-full border-collapse border border-black border-t-0 bg-white text-black overflow-visible table-fixed">
        <colgroup>
          <col className="w-[8%]" />
          <col className="w-[25%]" />
          <col className="w-[8%]" />
          <col className="w-[59%]" />
        </colgroup>
        <tbody>
          {/* 유해·위험요인 (타이틀 위 | 데이터 아래) */}
          <tr>
            <td className="border border-black p-2 font-semibold align-middle text-center" colSpan={2}>
              유해·위험요인
            </td>
            <td className="border border-black p-2 font-semibold align-middle text-center" colSpan={2}>
              지적사항(재해예방 대책)
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 align-top overflow-visible [&_textarea]:block" colSpan={2}>
              <textarea
                ref={hazardFactorsRef}
                value={data.hazardFactors}
                onChange={(e) => {
                  handleChange('hazardFactors', e.target.value);
                  requestAnimationFrame(() => resizeHazard());
                }}
                className="w-full min-h-[80px] border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre-wrap break-words"
                placeholder="복층의 상층부에서 작업 중 부주의 시 떨어짐 위험"
                rows={2}
              />
            </td>
            <td className="border border-black p-2 align-top overflow-visible [&_textarea]:block" colSpan={2}>
              <textarea
                ref={improvementItemsRef}
                value={data.improvementItems}
                onChange={(e) => {
                  handleChange('improvementItems', e.target.value);
                  requestAnimationFrame(() => resizeImprovement());
                }}
                className="w-full min-h-[80px] border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre-wrap break-words"
                placeholder="안전모 및 안전대 착용, 출입문 폐쇄 등"
                rows={3}
              />
            </td>
          </tr>
          {/* 사진 / 법률 (제목 셀과 내용 셀 통합) */}
          <tr>
            <td className="border border-black p-2 align-top overflow-visible" colSpan={2}>
              <div className="min-h-[120px] flex flex-col items-center justify-center gap-2 bg-gray-50 print:bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id={`photo-${index}`}
                />
                {data.photoUrl ? (
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.photoUrl}
                      alt="위험 구역 사진"
                      className="mx-auto max-h-[160px] w-auto object-contain"
                    />
                    <div className="mt-2 flex gap-2 print:hidden">
                      <label
                        htmlFor={`photo-${index}`}
                        className="cursor-pointer text-xs text-blue-600 underline"
                      >
                        변경
                      </label>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs text-red-600 underline"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={`photo-${index}`}
                    className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-gray-400 py-6 text-sm text-gray-500 hover:border-black hover:text-black print:border-gray-300"
                  >
                    <span>이미지 선택</span>
                    <span className="text-xs">클릭하여 사진 추가</span>
                  </label>
                )}
              </div>
            </td>
            <td className="border border-black p-2 align-top overflow-visible [&_textarea]:block" colSpan={2}>
              <textarea
                ref={legalInfoRef}
                value={data.legalInfo}
                onChange={(e) => {
                  handleChange('legalInfo', e.target.value);
                  requestAnimationFrame(() => resizeLegal());
                }}
                className="w-full min-h-[120px] border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none whitespace-pre-wrap break-words"
                placeholder="산업안전보건기준에 관한 규칙 제43조 등"
                rows={5}
              />
            </td>
          </tr>
          {/* 이행시기 / 이행시기 데이터 */}
          <tr>
            <td className="border border-black p-2 font-semibold text-center" colSpan={2}>
              이행시기
            </td>
            <td
              colSpan={2}
              className="border border-black p-2"
            >
              <input
                type="text"
                value={data.implementationPeriod}
                onChange={(e) =>
                  handleChange('implementationPeriod', e.target.value)
                }
                className="w-full border-0 bg-transparent p-0 text-inherit focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                placeholder="즉시 이행가능"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-500 mt-1 print:hidden">
        보고서 #{index + 1}
      </p>
    </div>
  );
}
