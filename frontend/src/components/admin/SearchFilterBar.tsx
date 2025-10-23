import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: Array<{ value: string; label: string }>;
  filterLabel?: string;
  className?: string;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterLabel = "Filter by:",
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* search input - on the left */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-primary/20 focus:border-primary"
          />
        </div>
      </div>
      
      {/* filter dropdown - on the far right */}
      {filterOptions.length > 0 && onFilterChange && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">{filterLabel}</Label>
          <Select value={filterValue} onValueChange={onFilterChange}>
            <SelectTrigger className="w-40 border-primary/20 focus:border-primary">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
