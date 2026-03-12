'use client';

import { useState, useRef } from 'react';
import { analyzeHazardPhotos } from '@/lib/api';
import { normalizeHazardResponse } from '@/lib/normalizeHazardResponse';

interface HazardUploadPanelProps {
  onSuccess: (reports: import('@/types/hazard').HazardReportItem[]) => void;
  onRawResponse: (raw: unknown) => void;
}

export default function HazardUploadPanel({
  onSuccess,
  onRawResponse,
}: HazardUploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setFiles((prev) => [...prev, ...imageFiles]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
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

    const droppedFiles = Array.from(e.dataTransfer.files ?? []);
    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('사진을 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await analyzeHazardPhotos(files);
      onRawResponse(raw);

      const reports = await normalizeHazardResponse(raw, files);
      onSuccess(reports);
      setFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="rounded-lg border border-black bg-white p-4 print:hidden">
      <h2 className="mb-3 text-sm font-semibold text-black">
        사진 업로드 및 분석
      </h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        className={[
          'mb-3 flex min-h-32 cursor-pointer items-center justify-center rounded border border-dashed px-4 py-6 text-center transition',
          loading ? 'cursor-not-allowed opacity-60' : '',
          dragActive ? 'border-black bg-gray-100' : 'border-gray-400 bg-gray-50 hover:border-black hover:bg-gray-100',
        ].join(' ')}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-black">
            사진을 여기로 드롭하거나 클릭해서 선택
          </p>
          <p className="text-xs text-gray-600">
            여러 장 업로드할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className="rounded border border-black bg-white px-3 py-1.5 text-sm text-black transition hover:bg-gray-100 disabled:opacity-50"
        >
          사진 선택
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="rounded border border-black bg-black px-3 py-1.5 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '분석 중…' : '업로드 및 분석'}
        </button>
      </div>

      {files.length > 0 && (
        <ul className="mb-3 max-h-32 overflow-y-auto text-xs text-gray-600">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2">
              <span className="truncate flex-1">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-red-600 hover:underline"
              >
                제거
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
