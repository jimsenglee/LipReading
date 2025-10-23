import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, FileSpreadsheet, File } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkDelete?: () => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  deleteLabel?: string;
  exportLabel?: string;
  className?: string;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onBulkDelete,
  onExport,
  deleteLabel = "Delete",
  exportLabel = "Export",
  className = ""
}) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // handle click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* export dropdown - always visible */}
      {onExport && (
        <div className="relative" ref={exportDropdownRef}>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowExportDropdown(!showExportDropdown)}
          >
            <Download className="h-4 w-4" />
            {exportLabel}
          </Button>
          {showExportDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onExport('csv');
                    setShowExportDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    onExport('excel');
                    setShowExportDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </button>
                <button
                  onClick={() => {
                    onExport('pdf');
                    setShowExportDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <File className="h-4 w-4" />
                  Export as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* bulk delete button - only show when items are selected */}
      {onBulkDelete && selectedCount > 0 && (
        <Button
          variant="destructive"
          onClick={onBulkDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {deleteLabel} ({selectedCount})
        </Button>
      )}
    </div>
  );
};

export default BulkActions;
