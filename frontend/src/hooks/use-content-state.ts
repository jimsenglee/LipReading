import { useState } from 'react';

// ============================================================================
// SHARED CONTENT STATE MANAGEMENT
// ============================================================================

export interface ContentState {
  searchTerm: string;
  category: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'id' | 'title' | 'category' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
  selectedItems: Set<string>;
}

export interface ContentStateActions {
  setSearchTerm: (value: string) => void;
  setCategory: (value: string) => void;
  setStatus: (value: 'all' | 'active' | 'inactive') => void;
  setSortBy: (field: 'id' | 'title' | 'category' | 'created_at' | 'updated_at') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSelectedItems: (items: Set<string>) => void;
  handleSearch: (value: string) => void;
  handleFilter: (category: string, status: string) => void;
  handleSort: (field: 'id' | 'title' | 'category' | 'created_at' | 'updated_at') => void;
  handleItemSelect: (itemId: string, checked: boolean) => void;
  handleSelectAll: (checked: boolean, allItemIds: string[]) => void;
  resetSelection: () => void;
}

export const useContentState = (initialState?: Partial<ContentState>): [ContentState, ContentStateActions] => {
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || '');
  const [category, setCategory] = useState(initialState?.category || 'all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>(initialState?.status || 'all');
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'category' | 'created_at' | 'updated_at'>(initialState?.sortBy || 'id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialState?.sortOrder || 'asc');
  const [currentPage, setCurrentPage] = useState(initialState?.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(initialState?.itemsPerPage || 10);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(initialState?.selectedItems || new Set());

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Don't reset page to prevent jumping effect
  };

  const handleFilter = (categoryValue: string, statusValue: string) => {
    setCategory(categoryValue);
    setStatus(statusValue as 'all' | 'active' | 'inactive');
    // Don't reset page to prevent jumping effect
  };

  const handleSort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    // Don't reset page to prevent jumping
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean, allItemIds: string[]) => {
    if (checked) {
      setSelectedItems(new Set(allItemIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const resetSelection = () => {
    setSelectedItems(new Set());
  };

  const state: ContentState = {
    searchTerm,
    category,
    status,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
    selectedItems
  };

  const actions: ContentStateActions = {
    setSearchTerm,
    setCategory,
    setStatus,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setItemsPerPage,
    setSelectedItems,
    handleSearch,
    handleFilter,
    handleSort,
    handleItemSelect,
    handleSelectAll,
    resetSelection
  };

  return [state, actions];
};

