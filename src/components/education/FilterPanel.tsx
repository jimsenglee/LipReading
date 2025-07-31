import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Bookmark,
  Heart,
  Clock,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEducation } from '@/hooks/use-education';
import { categories, difficultyLevels, durationFilters } from '@/data/mockCourses';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  className = ""
}) => {
  const { 
    filters, 
    setFilters, 
    clearFilters,
    getBookmarkedCourses,
    getFavoriteCourses 
  } = useEducation();

  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Quick filter presets
  const quickFilters = [
    {
      label: 'My Bookmarks',
      icon: Bookmark,
      count: getBookmarkedCourses().length,
      action: () => setFilters({ progressStatus: 'all', category: [], searchQuery: 'bookmarked' })
    },
    {
      label: 'Favorites',
      icon: Heart,
      count: getFavoriteCourses().length,
      action: () => setFilters({ progressStatus: 'all', category: [], searchQuery: 'favorites' })
    },
    {
      label: 'In Progress',
      icon: BarChart3,
      count: 0, // This would need to be calculated
      action: () => setFilters({ progressStatus: 'in-progress', category: [] })
    },
    {
      label: 'Not Started',
      icon: Clock,
      count: 0,
      action: () => setFilters({ progressStatus: 'not-started', category: [] })
    }
  ];

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    setTimeout(() => {
      setFilters({ searchQuery: value });
    }, 300);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updatedCategories = checked
      ? [...filters.category, category]
      : filters.category.filter(c => c !== category);
    
    setFilters({ category: updatedCategories });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.category.length > 0) count += filters.category.length;
    if (filters.difficulty !== 'all') count++;
    if (filters.duration !== 'all') count++;
    if (filters.progressStatus !== 'all') count++;
    return count;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Filter Panel */}
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white/95 backdrop-blur-glass 
                       border-r border-primary/20 shadow-glass-lg z-50 overflow-y-auto ${className}`}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title, instructor, or tags..."
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="space-y-3">
                <Label>Quick Filters</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickFilters.map((filter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={filter.action}
                      className="flex items-center gap-2 h-auto p-3 justify-start"
                    >
                      <filter.icon className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs">{filter.label}</span>
                        <span className="text-xs text-muted-foreground">{filter.count}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Progress Status */}
              <div className="space-y-3">
                <Label>Progress Status</Label>
                <Select
                  value={filters.progressStatus}
                  onValueChange={(value: 'all' | 'not-started' | 'in-progress' | 'completed') => 
                    setFilters({ progressStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select progress status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <Select
                  value={filters.difficulty}
                  onValueChange={(value: 'all' | 'Beginner' | 'Intermediate' | 'Advanced') => 
                    setFilters({ difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((level) => (
                      <SelectItem key={level} value={level.toLowerCase()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label>Course Duration</Label>
                <Select
                  value={filters.duration}
                  onValueChange={(value: 'all' | 'short' | 'medium' | 'long') => 
                    setFilters({ duration: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationFilters.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Categories</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.filter(cat => cat !== 'All').map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={filters.category.includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={category}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Advanced Filters
                    {isAdvancedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  {/* Sort Options */}
                  <div className="space-y-3">
                    <Label>Sort By</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value: 'title' | 'date-added' | 'progress' | 'rating' | 'duration') => 
                          setFilters({ sortBy: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="date-added">Date Added</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="duration">Duration</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.sortOrder}
                        onValueChange={(value: 'asc' | 'desc') => 
                          setFilters({ sortOrder: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Clear Filters */}
              <div className="pt-4 border-t border-primary/10">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                  disabled={getActiveFilterCount() === 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
