import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  X,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
  searchTerm: string;
  selectedCategories: string[];
  selectedDifficulties: string[];
  selectedDurations: string[];
  selectedProgress: string[];
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'checkbox' | 'radio';
  options: string[];
  defaultCollapsed?: boolean;
}

interface FilterDrawerProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  customFilterOptions?: FilterOption[];
  searchPlaceholder?: string;
  hasActiveFilters?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filters,
  onFiltersChange,
  customFilterOptions,
  searchPlaceholder = "Search tutorials...",
  hasActiveFilters = false,
  isOpen,
  onClose
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    category: false,
    difficulty: false,
    duration: true,
    progress: true
  });

  // default filter options
  const defaultCategories = ['General', 'Advanced', 'Business', 'Medical', 'Technology', 'Education', 'Entertainment', 'Sports', 'Science', 'Arts'];
  const defaultDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const defaultDurations = ['0-5 min', '5-15 min', '15-30 min', '30+ min'];
  const defaultProgressOptions = ['Not Started', 'In Progress', 'Completed'];

  const categories = customFilterOptions?.find(opt => opt.key === 'category')?.options || defaultCategories;
  const difficulties = customFilterOptions?.find(opt => opt.key === 'difficulty')?.options || defaultDifficulties;
  const durations = customFilterOptions?.find(opt => opt.key === 'duration')?.options || defaultDurations;
  const progressOptions = customFilterOptions?.find(opt => opt.key === 'progress')?.options || defaultProgressOptions;

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode; 
  }) => (
    <Collapsible
      open={!collapsedSections[sectionKey]}
      onOpenChange={() => toggleSection(sectionKey)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-medium text-left hover:bg-transparent"
        >
          <span className="text-sm font-medium text-gray-700">{title}</span>
          {collapsedSections[sectionKey] ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchTerm: value
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updatedCategories = checked
      ? [...filters.selectedCategories, category]
      : filters.selectedCategories.filter(c => c !== category);
    
    onFiltersChange({
      ...filters,
      selectedCategories: updatedCategories
    });
  };

  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    const updatedDifficulties = checked
      ? [...filters.selectedDifficulties, difficulty]
      : filters.selectedDifficulties.filter(d => d !== difficulty);
    onFiltersChange({
      ...filters,
      selectedDifficulties: updatedDifficulties
    });
  };

  const handleDurationChange = (duration: string, checked: boolean) => {
    const updatedDurations = checked
      ? [...filters.selectedDurations, duration]
      : filters.selectedDurations.filter(d => d !== duration);
    onFiltersChange({
      ...filters,
      selectedDurations: updatedDurations
    });
  };

  const handleProgressChange = (progress: string, checked: boolean) => {
    const updatedProgress = checked
      ? [...filters.selectedProgress, progress]
      : filters.selectedProgress.filter(p => p !== progress);
    onFiltersChange({
      ...filters,
      selectedProgress: updatedProgress
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      selectedCategories: [],
      selectedDifficulties: [],
      selectedDurations: [],
      selectedProgress: []
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 5rem)' }}
        >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                  </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={searchPlaceholder}
                        value={filters.searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 border-gray-300 focus:border-purple-500"
                      />
                      {filters.searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                          onClick={() => handleSearchChange('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <FilterSection title="Category" sectionKey="category">
                    <div className="space-y-3">
                      {categories.map((category, index) => (
                        <div key={`category-${category}-${index}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={filters.selectedCategories.includes(category)}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category, checked as boolean)
                            }
                            className="border-primary/30 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Difficulty Filter */}
                  <FilterSection title="Difficulty" sectionKey="difficulty">
                    <div className="space-y-3">
                      {difficulties.map((difficulty, index) => (
                        <div key={`difficulty-${difficulty}-${index}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`difficulty-${difficulty}`}
                            checked={filters.selectedDifficulties.includes(difficulty)}
                            onCheckedChange={(checked) => 
                              handleDifficultyChange(difficulty, checked as boolean)
                            }
                            className="border-primary/30 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`difficulty-${difficulty}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {difficulty}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Duration Filter */}
                  <FilterSection title="Duration" sectionKey="duration">
                    <div className="space-y-3">
                      {durations.map((duration, index) => (
                        <div key={`duration-${duration}-${index}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`duration-${duration}`}
                            checked={filters.selectedDurations.includes(duration)}
                            onCheckedChange={(checked) => 
                              handleDurationChange(duration, checked as boolean)
                            }
                            className="border-primary/30 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`duration-${duration}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {duration}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Progress Filter */}
                  <FilterSection title="Progress" sectionKey="progress">
                    <div className="space-y-3">
                      {progressOptions.map((progress, index) => (
                        <div key={`progress-${progress}-${index}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`progress-${progress}`}
                            checked={filters.selectedProgress.includes(progress)}
                            onCheckedChange={(checked) => 
                              handleProgressChange(progress, checked as boolean)
                            }
                            className="border-primary/30 data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`progress-${progress}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {progress}
                          </label>
                        </div>
                      ))}
                    </div>
                  </FilterSection>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
