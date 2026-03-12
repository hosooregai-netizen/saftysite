'use client';

import { useRef, useEffect, useLayoutEffect } from 'react';

export function useAutoResizeTextarea(value: string, minHeight = 80) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '1px';
    el.style.overflow = 'hidden';
    const newHeight = Math.max(el.scrollHeight + 4, minHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflow = 'hidden';
  };

  useLayoutEffect(() => {
    resize();
  }, [value, minHeight]);

  useEffect(() => {
    const t1 = setTimeout(resize, 0);
    const t2 = setTimeout(resize, 50);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [value]);

  return { ref, resize };
}
