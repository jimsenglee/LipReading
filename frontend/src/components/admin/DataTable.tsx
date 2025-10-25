import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, AlertCircle, Download, Trash2 } from 'lucide-react';
import Pagination from '@/components/ui/pagination';

// column definition interface
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

// action definition interface
export interface Action<T> {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: (item: T) => void;
  variant?: 'ghost' | 'destructive' | 'outline';
  className?: string;
}

// pagination info interface
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// data table props interface
export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  pagination?: PaginationInfo;
  selectedItems?: Set<number>;
  onItemSelect?: (id: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (value: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  error?: any;
  onRetry?: () => void;
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  title?: string;
  description?: string;
  getItemId: (item: T) => number;
  className?: string;
  onExport?: () => void;
  onBulkDelete?: () => void;
  showHeaderActions?: boolean;
}

const DataTable = <T,>({
  data,
  columns,
  actions = [],
  pagination,
  selectedItems = new Set(),
  onItemSelect,
  onSelectAll,
  onPageChange,
  onItemsPerPageChange,
  sortBy,
  sortOrder = 'asc',
  onSort,
  error,
  onRetry,
  emptyStateIcon,
  emptyStateTitle = "No Data",
  emptyStateDescription = "No data available.",
  emptyStateAction,
  title,
  description,
  getItemId,
  className = "",
  onExport,
  onBulkDelete,
  showHeaderActions = false
}: DataTableProps<T>) => {
  // get sort icon for column
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // handle column header click for sorting
  const handleColumnClick = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <Card className={`border-primary/20 ${className}`}>
      {/* table header */}
      {(title || description) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-primary">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {/* Export and Delete buttons in header */}
            {showHeaderActions && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={onBulkDelete}
                  disabled={selectedItems.size === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedItems.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* error state */}
        {error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">There was a problem loading the data.</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : data.length === 0 ? (
          /* empty state */
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md mx-auto">
              {emptyStateIcon}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyStateTitle}</h3>
              <p className="text-gray-600 mb-4">{emptyStateDescription}</p>
              <div className="flex justify-center">
                {emptyStateAction}
              </div>
            </div>
          </div>
        ) : (
          /* data table */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {/* select all checkbox */}
                  {onItemSelect && onSelectAll && (
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedItems.size === data.length && data.length > 0}
                        onCheckedChange={onSelectAll}
                      />
                    </th>
                  )}
                  
                  {/* numbering column */}
                  <th 
                    className="text-left py-3 px-4 w-16 cursor-pointer hover:bg-gray-50"
                    onClick={() => onSort && onSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      No.
                      {onSort && getSortIcon('id')}
                    </div>
                  </th>
                  
                  {/* column headers */}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`text-left py-3 px-4 ${column.className || ''} ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                      }`}
                      onClick={() => handleColumnClick(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  
                  {/* actions column */}
                  {actions.length > 0 && (
                    <th className="text-left py-3 px-4">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const itemId = getItemId(item);
                  // Calculate row number based on sort order
                  let rowNumber: number;
                  if (pagination) {
                    const baseIndex = (pagination.current_page - 1) * pagination.per_page;
                    // If sorting by 'id' descending, show numbers from total_count downwards
                    // Otherwise, show sequential numbering
                    if (sortBy === 'id' && sortOrder === 'desc') {
                      rowNumber = pagination.total_count - baseIndex - index;
                    } else {
                      rowNumber = baseIndex + index + 1;
                    }
                  } else {
                    rowNumber = index + 1;
                  }
                  return (
                    <tr key={itemId} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* select checkbox */}
                      {onItemSelect && (
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedItems.has(itemId)}
                            onCheckedChange={(checked) => onItemSelect(itemId, checked as boolean)}
                          />
                        </td>
                      )}
                      
                      {/* numbering cell */}
                      <td className="py-3 px-4 text-sm text-gray-600 font-medium">
                        {rowNumber}
                      </td>
                      
                      {/* data columns */}
                      {columns.map((column) => (
                        <td key={column.key} className={`py-3 px-4 ${column.className || ''}`}>
                          {column.render ? column.render(item) : (item as any)[column.key]}
                        </td>
                      ))}
                      
                      {/* action buttons */}
                      {actions.length > 0 && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {actions.map((action) => (
                              <Button
                                key={action.key}
                                variant={action.variant || 'ghost'}
                                size="sm"
                                onClick={() => action.onClick(item)}
                                className={`h-8 w-8 p-0 ${action.className || ''}`}
                                title={action.label}
                              >
                                {action.icon}
                              </Button>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* pagination controls - bottom */}
        {pagination && onPageChange && onItemsPerPageChange && (
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">Show numbers of</Label>
              <Select value={pagination.per_page.toString()} onValueChange={onItemsPerPageChange}>
                <SelectTrigger className="w-24 border-primary/20 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-sm font-medium text-gray-700">entries</Label>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total_count)} of {pagination.total_count} entries
              </span>
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                totalCount={pagination.total_count}
                perPage={pagination.per_page}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
