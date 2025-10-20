import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, BookOpen, Filter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface NoResultsStateProps {
  searchTerm?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onReset?: () => void;
  className?: string;
}

const NoResultsState: React.FC<NoResultsStateProps> = ({
  searchTerm,
  hasActiveFilters = false,
  onClearFilters,
  onReset,
  className = ""
}) => {
  const getTitle = () => {
    if (searchTerm) {
      return `No results found for "${searchTerm}"`;
    }
    if (hasActiveFilters) {
      return "No tutorials match your filters";
    }
    return "No tutorials available";
  };

  const getDescription = () => {
    if (searchTerm && hasActiveFilters) {
      return "Try adjusting your search term or clearing some filters to find more tutorials.";
    }
    if (searchTerm) {
      return "Try a different search term or browse our available categories.";
    }
    if (hasActiveFilters) {
      return "Try clearing some filters or selecting different criteria to see more results.";
    }
    return "Check back later for new tutorials, or explore other sections of the platform.";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex justify-center items-center min-h-[400px] ${className}`}
    >
      <Card className="max-w-md w-full mx-auto border-primary/20">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                {searchTerm ? (
                  <Search className="h-10 w-10 text-primary/60" />
                ) : hasActiveFilters ? (
                  <Filter className="h-10 w-10 text-primary/60" />
                ) : (
                  <BookOpen className="h-10 w-10 text-primary/60" />
                )}
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/20 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary/30 rounded-full"></div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-gray-900 mb-3"
          >
            {getTitle()}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6 leading-relaxed"
          >
            {getDescription()}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {hasActiveFilters && onClearFilters && (
              <Button
                onClick={onClearFilters}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
            
            {onReset && (
              <Button
                variant="outline"
                onClick={onReset}
                className="w-full border-primary/20 text-primary hover:bg-primary/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Search
              </Button>
            )}

            {!hasActiveFilters && !searchTerm && (
              <div className="text-sm text-gray-500 mt-4">
                <p>Suggestions:</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">Fundamentals</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">Beginner</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">Phonemes</span>
                </div>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NoResultsState;
