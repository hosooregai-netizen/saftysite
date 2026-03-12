'use client';

import { useRef, useState } from 'react';
import { checkCausativeAgents } from '@/lib/api';
import { normalizeCausativeAgentResponse } from '@/lib/normalizeCausativeAgentResponse';
import type { CausativeAgentReport } from '@/types/siteOverview';

interface SiteOverviewUploadPanelProps {
  onSuccess: (report: CausativeAgentReport) => void;
  onRawResponse: (raw: unknown) => void;
}

export default function SiteOverviewUploadPanel({
  onSuccess,
  onRawResponse,
}: SiteOverviewUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setImageFile = (incoming: File | undefined) => {
    if (!incoming) return;
    if (!incoming.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setFile(incoming);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (loading) return;

    setImageFile(e.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('전경 사진을 먼저 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await checkCausativeAgents([file]);
      onRawResponse(raw);

      const normalized = await normalizeCausativeAgentResponse(raw, file);
      onSuccess(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">
          전경 사진 업로드
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          백엔드 응답의 <code>agents</code> 값을 기준으로 체크표를 자동으로
          채웁니다.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={openPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'mb-4 flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition',
          loading ? 'cursor-not-allowed opacity-60' : '',
          dragActive
            ? 'border-slate-950 bg-slate-100'
            : 'border-slate-300 bg-slate-50 hover:border-slate-900 hover:bg-slate-100',
        ].join(' ')}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950">
            전경 사진을 여기로 끌어오거나 클릭해서 선택
          </p>
          <p className="text-xs text-slate-500">
            한 장의 이미지 파일을 업로드합니다.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
        >
          사진 선택
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? '판독 중...' : '업로드 및 판독'}
        </button>
        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setError(null);
            }}
            disabled={loading}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            선택 해제
          </button>
        )}
      </div>

      {file && (
        <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          선택된 파일: <span className="font-medium">{file.name}</span>
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </section>
  );
}
