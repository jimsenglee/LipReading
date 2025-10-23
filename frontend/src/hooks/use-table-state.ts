import { useState } from 'react';

// ============================================================================
// SHARED TABLE STATE HOOK
// ============================================================================

export interface TableState {
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  selectedItems: Set<number>;
}

export interface TableFilters {
  [key: string]: string | number | boolean;
}

export const useTableState = (initialState: Partial<TableState> = {}) => {
  const [searchTerm, setSearchTerm] = useState(initialState.searchTerm || '');
  const [currentPage, setCurrentPage] = useState(initialState.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(initialState.itemsPerPage || 10);
  const [sortBy, setSortBy] = useState(initialState.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialState.sortOrder || 'asc');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(initialState.selectedItems || new Set());
  const [filters, setFilters] = useState<TableFilters>({});

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleFilter = (key: string, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (allIds: number[]) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      const allSelected = allIds.every(id => newSet.has(id));
      
      if (allSelected) {
        // Deselect all
        allIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        allIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({});
    setCurrentPage(1);
  };

  return {
    // State
    searchTerm,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    selectedItems,
    filters,
    
    // Actions
    setSearchTerm,
    setCurrentPage,
    setItemsPerPage,
    setSortBy,
    setSortOrder,
    setSelectedItems,
    setFilters,
    
    // Handlers
    handleSearch,
    handleSort,
    handleFilter,
    handlePageChange,
    handleItemsPerPageChange,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    resetFilters,
  };
};
