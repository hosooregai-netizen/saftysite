'use client';

import {
  CAUSATIVE_AGENT_SECTIONS,
  createEmptyCausativeAgentMap,
} from '@/constants/siteOverview';
import type {
  CausativeAgentChecklistItem,
  CausativeAgentKey,
  CausativeAgentReport,
} from '@/types/siteOverview';

interface SiteOverviewChecklistProps {
  report: CausativeAgentReport | null;
  onAgentToggle: (key: CausativeAgentKey, checked: boolean) => void;
}

function ChecklistCell({
  item,
  checked,
  onToggle,
}: {
  item: CausativeAgentChecklistItem;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const highlightClass = checked ? 'bg-emerald-50 print:bg-white' : '';

  return (
    <>
      <td
        className={`border border-black p-2 text-center align-middle ${highlightClass}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggle(event.target.checked)}
          className="h-4 w-4 accent-emerald-600"
          aria-label={`${item.number}. ${item.label}`}
        />
      </td>
      <td
        className={`border border-black p-2 align-middle font-semibold ${highlightClass}`}
      >
        {item.number}. {item.label}
      </td>
      <td
        className={`border border-black p-2 align-middle whitespace-pre-wrap ${highlightClass}`}
      >
        {item.guidance}
      </td>
    </>
  );
}

export default function SiteOverviewChecklist({
  report,
  onAgentToggle,
}: SiteOverviewChecklistProps) {
  const agents = report?.agents ?? createEmptyCausativeAgentMap();
  const selectedItems = CAUSATIVE_AGENT_SECTIONS.flatMap((section) =>
    section.rows.flatMap((row) => [row.left, row.right])
  ).filter((item) => agents[item.key]);

  return (
    <section className="space-y-0">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px] bg-white text-black">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-3 text-center text-lg font-semibold">
                  전경사진
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-6">
                  {report?.photoUrl ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.photoUrl}
                        alt="점검 사업장 전경 사진"
                        className="max-h-[420px] w-auto max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                      전경 사진을 업로드하면 여기에 표시됩니다.
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black border-t-0">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[6%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[6%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr>
                <th
                  colSpan={7}
                  className="border border-black p-3 text-center text-lg font-semibold"
                >
                  건설현장 12대 사망사고 기인물 핵심 안전조치
                </th>
              </tr>
              <tr className="text-center">
                <th className="border border-black p-2">구분</th>
                <th className="border border-black p-2">체크</th>
                <th className="border border-black p-2">사망사고 다발 기인물</th>
                <th className="border border-black p-2">필수 지도사항</th>
                <th className="border border-black p-2">체크</th>
                <th className="border border-black p-2">사망사고 다발 기인물</th>
                <th className="border border-black p-2">필수 지도사항</th>
              </tr>
            </thead>
            <tbody>
              {CAUSATIVE_AGENT_SECTIONS.map((section) =>
                section.rows.map((row, rowIndex) => (
                  <tr key={row.left.key}>
                    {rowIndex === 0 && (
                      <td
                        rowSpan={section.rows.length}
                        className="border border-black p-3 text-center align-middle font-semibold"
                      >
                        {section.label}
                      </td>
                    )}
                    <ChecklistCell
                      item={row.left}
                      checked={agents[row.left.key]}
                      onToggle={(checked) =>
                        onAgentToggle(row.left.key, checked)
                      }
                    />
                    <ChecklistCell
                      item={row.right}
                      checked={agents[row.right.key]}
                      onToggle={(checked) =>
                        onAgentToggle(row.right.key, checked)
                      }
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-b-2xl border border-black border-t-0 bg-white p-5 text-sm text-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-950">AI 판독 근거</h2>
          <p className="mt-2 whitespace-pre-wrap leading-6">
            {report?.reasoning || '아직 판독 결과가 없습니다.'}
          </p>
        </div>

        <div className="mt-5">
          <h2 className="text-base font-semibold text-slate-950">
            체크된 기인물
          </h2>
          {selectedItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  {item.number}. {item.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-slate-500">
              체크된 기인물이 없습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
