import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages: (number | '...')[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col gap-3 border-t ui-divider px-5 py-4 md:flex-row md:items-center md:justify-between">
      <p className="ui-text-muted text-sm">
        Hiển thị{' '}
        <span className="ui-text-base font-medium">
          {start}–{end}
        </span>{' '}
        trong <span className="ui-text-base font-medium">{totalItems}</span>{' '}
        kết quả
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="ui-subtle-surface ui-subtle-hover inline-flex h-9 w-9 items-center justify-center rounded-2xl ui-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang trước"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="ui-text-muted px-2 text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition ${
                currentPage === page
                  ? 'ui-btn-primary-role'
                  : 'ui-subtle-surface ui-subtle-hover ui-text-base'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ui-subtle-surface ui-subtle-hover inline-flex h-9 w-9 items-center justify-center rounded-2xl ui-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang sau"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
