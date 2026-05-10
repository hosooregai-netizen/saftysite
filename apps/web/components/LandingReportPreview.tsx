'use client';

import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';
import Image from 'next/image';

export type LandingReportPreviewPage = {
  alt: string;
  id: string;
  label: string;
  src: string;
};

type LandingReportPreviewProps = {
  pages: readonly LandingReportPreviewPage[];
};

export default function LandingReportPreview({ pages }: LandingReportPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = pages.length;
  const activePage = pages[activeIndex] ?? pages[0];

  const pagePositionLabel = useMemo(
    () => `${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    [activeIndex, total],
  );

  function move(direction: 'prev' | 'next') {
    setActiveIndex((current) => {
      if (direction === 'prev') {
        return current === 0 ? total - 1 : current - 1;
      }
      return current === total - 1 ? 0 : current + 1;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move('prev');
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move('next');
    }
  }

  if (!activePage) {
    return null;
  }

  return (
    <div
      className="landing-v3-preview-gallery"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="표준 보고서 미리보기"
    >
      <div className="landing-v3-preview-gallery-head">
        <div className="landing-v3-preview-tabs" role="tablist" aria-label="표준 보고서 페이지 선택">
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`landing-preview-panel-${page.id}`}
              className={`landing-v3-preview-tab ${index === activeIndex ? 'landing-v3-preview-tab-active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              {page.label}
            </button>
          ))}
        </div>

        <div className="landing-v3-preview-controls">
          <button
            type="button"
            className="landing-v3-preview-arrow"
            onClick={() => move('prev')}
            aria-label="이전 표준 보고서 페이지 보기"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <span className="landing-v3-preview-count">{pagePositionLabel}</span>
          <button
            type="button"
            className="landing-v3-preview-arrow"
            onClick={() => move('next')}
            aria-label="다음 표준 보고서 페이지 보기"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <figure
        id={`landing-preview-panel-${activePage.id}`}
        className="landing-v3-preview-sheet"
        role="tabpanel"
        aria-label={activePage.label}
      >
        <Image
          src={activePage.src}
          alt={activePage.alt}
          width={1240}
          height={1754}
          className="landing-v3-preview-image"
        />
      </figure>

      <div className="landing-v3-preview-dots" aria-hidden="true">
        {pages.map((page, index) => (
          <span
            key={page.id}
            className={`landing-v3-preview-dot ${index === activeIndex ? 'landing-v3-preview-dot-active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
