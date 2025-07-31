import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import { motion } from 'framer-motion';

export interface FilterState {
  searchTerm: string;
  selectedCategories: string[];
  selectedDifficulties: string[];
  selectedDurations: string[];
  selectedProgress: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  className = ""
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    category: false,
    difficulty: false,
    duration: true,
    progress: true
  });

  const categories = [
    'Fundamentals',
    'Phonemes', 
    'Conversations',
    'Numbers',
    'Medical',
    'Business'
  ];

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const durations = ['Short (< 30 min)', 'Medium (30-60 min)', 'Long (> 60 min)'];
  const progressOptions = ['Not Started', 'In Progress', 'Completed'];

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.selectedCategories.length > 0 ||
    filters.selectedDifficulties.length > 0 ||
    filters.selectedDurations.length > 0 ||
    filters.selectedProgress.length > 0;

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

  return (
    <motion.div 
      className={`w-80 flex-shrink-0 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-primary/20 sticky top-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-primary">Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-red-600 p-1 h-auto"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] p-4">
          <div className="space-y-6">
            {/* Search Bar */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tutorials..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                />
                {filters.searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
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
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
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
                {difficulties.map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
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
                {durations.map((duration) => (
                  <div key={duration} className="flex items-center space-x-2">
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
                {progressOptions.map((progress) => (
                  <div key={progress} className="flex items-center space-x-2">
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

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <div className="p-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default FilterPanel;
