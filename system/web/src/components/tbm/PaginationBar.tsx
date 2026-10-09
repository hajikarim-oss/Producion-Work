import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function PaginationBar({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = "",
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`px-4 py-2.5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-600 ${className}`}
    >
      {/* Range and total indicator */}
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="font-semibold text-slate-900">{startItem}</strong>–
          <strong className="font-semibold text-slate-900">{endItem}</strong> of{" "}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> items
        </span>

        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-500 text-[11.5px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="h-7 px-2 text-[11.5px] rounded border border-slate-200 bg-slate-50/60 text-slate-800 font-medium focus:outline-hidden focus:border-slate-800"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="h-7 px-2 text-[11.5px] font-medium text-slate-700 hover:text-black disabled:opacity-40"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
        </Button>

        <div className="hidden sm:flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ell-${idx}`} className="px-1 text-slate-400">
                  …
                </span>
              );
            }
            const isCurrent = p === safePage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(Number(p))}
                className={`h-7 min-w-7 px-2 rounded text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-[#FFE600] text-slate-950 border border-black/10 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="xs"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="h-7 px-2 text-[11.5px] font-medium text-slate-700 hover:text-black disabled:opacity-40"
        >
          Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
