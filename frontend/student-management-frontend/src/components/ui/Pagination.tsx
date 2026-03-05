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
    for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++)
    {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <p className="text-sm text-slate-500">
        Hiển thị{' '}
        <span className="font-medium text-slate-700">
          {start}–{end}
        </span>{' '}
        trong <span className="font-medium text-slate-700">{totalItems}</span>{' '}
        kết quả
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Trang trước">

          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {pages.map((page, i) =>
        page === '...' ?
        <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">
              …
            </span> :

        <button
          key={page}
          onClick={() => onPageChange(page as number)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>

              {page}
            </button>

        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Trang sau">

          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>);

}