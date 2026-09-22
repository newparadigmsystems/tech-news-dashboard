import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange
}) {
  if (total === 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
      {/* Left side: Results range */}
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-gray-900 dark:text-gray-200">{startItem}</strong> -{' '}
          <strong className="text-gray-900 dark:text-gray-200">{endItem}</strong> of{' '}
          <strong className="text-gray-900 dark:text-gray-200">{total}</strong> articles
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-gray-200 dark:border-gray-800">
          <span>Per page:</span>
          {[15, 30, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                pageSize === size
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Page Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
          Page {page} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
