import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemName?: string; // customizable item name (users, content, etc.)
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  perPage,
  onPageChange,
  className = '',
  itemName = 'entries'
}) => {
  // calculate the range of items currently displayed
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);
  const hasMultiplePages = totalPages > 1;
  
  // calculate page numbers to show (max 3)
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, currentPage + 1);
  
  // adjust if we're near the beginning or end
  if (currentPage <= 2) {
    endPage = Math.min(3, totalPages);
  }
  if (currentPage >= totalPages - 1) {
    startPage = Math.max(1, totalPages - 2);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* first page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!hasMultiplePages || currentPage <= 1}
        className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        &laquo;
      </Button>

      {/* previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasMultiplePages || currentPage <= 1}
        className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        &lsaquo;
      </Button>

      {/* page numbers */}
      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 p-0 ${page === currentPage ? 'bg-primary text-white' : ''}`}
        >
          {page}
        </Button>
      ))}

      {/* show ellipsis if there are more pages */}
      {endPage < totalPages && (
        <span className="px-2 text-gray-500">...</span>
      )}

      {/* last page button */}
      {endPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="h-8 w-8 p-0"
        >
          {totalPages}
        </Button>
      )}

      {/* next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMultiplePages || currentPage >= totalPages}
        className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        &rsaquo;
      </Button>

      {/* last page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={!hasMultiplePages || currentPage >= totalPages}
        className={`h-8 w-8 p-0 ${!hasMultiplePages ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        &raquo;
      </Button>
    </div>
  );
};

export default Pagination;
