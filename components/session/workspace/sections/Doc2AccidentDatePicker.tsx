'use client';

import { useId, useMemo, useRef, useState } from 'react';
import styles from '@/components/session/InspectionSessionWorkspace.module.css';

function daysInMonth(year: number, month1Based: number): number {
  return new Date(year, month1Based, 0).getDate();
}

function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [ys, ms, ds] = value.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
}

function toIsoDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatButtonLabel(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return '날짜 선택';
  return `${parsed.y}년 ${parsed.m}월 ${parsed.d}일`;
}

export default function Doc2AccidentDatePicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [y, setY] = useState(() => new Date().getFullYear());
  const [m, setM] = useState(() => new Date().getMonth() + 1);
  const [d, setD] = useState(() => new Date().getDate());

  const yearRange = useMemo(() => {
    const end = new Date().getFullYear() + 1;
    const start = 1990;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, []);

  const maxDay = daysInMonth(y, m);
  const safeDay = Math.min(d, maxDay);
  const dayOptions = useMemo(
    () => Array.from({ length: maxDay }, (_, index) => index + 1),
    [maxDay]
  );

  const openDialog = () => {
    const parsed = parseIsoDate(value);
    const now = new Date();
    const base = parsed ?? {
      y: now.getFullYear(),
      m: now.getMonth() + 1,
      d: now.getDate(),
    };
    setY(base.y);
    setM(base.m);
    setD(Math.min(base.d, daysInMonth(base.y, base.m)));
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className="app-input text-left"
        disabled={disabled}
        onClick={openDialog}
      >
        {formatButtonLabel(value)}
      </button>
      <dialog ref={dialogRef} className={styles.doc2DateDialog} aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.doc2DateDialogTitle}>
          최근 발생일자
        </h2>
        <div className={styles.doc2DateDialogPickers}>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>년</span>
            <select className="app-select" value={y} onChange={(event) => setY(Number(event.target.value))}>
              {yearRange.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </label>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>월</span>
            <select className="app-select" value={m} onChange={(event) => setM(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </label>
          <label className={styles.doc2DateDialogField}>
            <span className={styles.fieldLabel}>일</span>
            <select className="app-select" value={safeDay} onChange={(event) => setD(Number(event.target.value))}>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}일
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.doc2DateDialogActions}>
          <button type="button" className="app-button app-button-secondary" onClick={() => dialogRef.current?.close()}>
            취소
          </button>
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => {
              onChange(toIsoDate(y, m, safeDay));
              dialogRef.current?.close();
            }}
          >
            확인
          </button>
        </div>
      </dialog>
    </>
  );
}
