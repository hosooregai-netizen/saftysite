'use client';

import localStyles from './MailboxPanel.module.css';

interface MailboxThreadPaginationProps {
  canGoNextThreadPage: boolean;
  canGoPrevThreadPage: boolean;
  meta: string;
  page: number;
  pageCount: number;
  onMovePage: (nextPage: number) => void;
}

export function MailboxThreadPagination({
  canGoNextThreadPage,
  canGoPrevThreadPage,
  meta,
  page,
  pageCount,
  onMovePage,
}: MailboxThreadPaginationProps) {
  return (
    <>
      <span className={localStyles.paginationMeta}>{meta}</span>
      <button
        type="button"
        className={`app-button app-button-secondary ${localStyles.paginationButton}`}
        onClick={() => onMovePage(1)}
        disabled={!canGoPrevThreadPage}
      >
        처음
      </button>
      <button
        type="button"
        className={`app-button app-button-secondary ${localStyles.paginationButton}`}
        onClick={() => onMovePage(page - 1)}
        disabled={!canGoPrevThreadPage}
      >
        이전
      </button>
      <button
        type="button"
        className={`app-button app-button-secondary ${localStyles.paginationButton}`}
        onClick={() => onMovePage(page + 1)}
        disabled={!canGoNextThreadPage}
      >
        다음
      </button>
      <button
        type="button"
        className={`app-button app-button-secondary ${localStyles.paginationButton}`}
        onClick={() => onMovePage(pageCount)}
        disabled={!canGoNextThreadPage}
      >
        마지막
      </button>
    </>
  );
}
