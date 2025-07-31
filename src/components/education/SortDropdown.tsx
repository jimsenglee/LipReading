import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Calendar, Eye, Star, Clock, Type } from 'lucide-react';

export type SortOption = 'newest' | 'most-viewed' | 'title-az' | 'title-za' | 'rating' | 'duration';

interface SortDropdownProps {
  value: SortOption;
  onValueChange: (value: SortOption) => void;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onValueChange,
  className = ""
}) => {
  const sortOptions = [
    {
      value: 'newest' as SortOption,
      label: 'Newest First',
      icon: Calendar
    },
    {
      value: 'most-viewed' as SortOption,
      label: 'Most Viewed',
      icon: Eye
    },
    {
      value: 'title-az' as SortOption,
      label: 'Title (A-Z)',
      icon: Type
    },
    {
      value: 'title-za' as SortOption,
      label: 'Title (Z-A)',
      icon: Type
    },
    {
      value: 'rating' as SortOption,
      label: 'Highest Rated',
      icon: Star
    },
    {
      value: 'duration' as SortOption,
      label: 'Duration',
      icon: Clock
    }
  ];

  const getCurrentOption = () => {
    return sortOptions.find(option => option.value === value);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[160px] border-primary/20 focus:border-primary">
          <SelectValue>
            <div className="flex items-center gap-2">
              {getCurrentOption()?.icon && 
                React.createElement(getCurrentOption()!.icon, { className: "h-3 w-3" })
              }
              {getCurrentOption()?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <option.icon className="h-3 w-3" />
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortDropdown;
