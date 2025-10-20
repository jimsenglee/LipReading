import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showItemRange?: boolean;
  className?: string;
  itemName?: string; // e.g., "tutorials", "quizzes", "series"
}

// Enhanced reusable pagination component for both tutorials and quizzes
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemRange = true,
  className = "",
  itemName = "items"
}) => {
  // Don't render if there's only one page or no items
  if (totalPages <= 1 || totalItems === 0) return null;

  // Calculate item range for current page
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex ellipsis logic for more than 7 pages
      if (currentPage <= 4) {
        // Current page is near the beginning
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Current page is near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Current page is in the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  return (
    <motion.div 
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Item Range Display */}
      {showItemRange && (
        <div className="text-sm text-gray-600 order-2 sm:order-1">
          Showing <span className="font-medium">{startItem}-{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> {itemName}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First Page - << */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 disabled:opacity-50"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-3 w-3" />
        </Button>

        {/* Previous Page - < */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 disabled:opacity-50"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {/* Page Numbers with active focus design */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-sm text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageClick(page)}
                  className={`h-8 w-8 p-0 text-sm transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/20 scale-110 shadow-md'
                      : 'border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:scale-105'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Page - > */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 disabled:opacity-50"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>

        {/* Last Page - >> */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 disabled:opacity-50"
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
};

// Export both the enhanced component and the legacy name for compatibility
export default Pagination;
export { Pagination as EducationPagination };
