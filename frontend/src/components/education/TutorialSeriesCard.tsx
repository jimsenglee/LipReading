import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Clock, 
  BookOpen,
  CheckCircle,
  Star,
  Users,
  AlertTriangle,
  Bookmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cardStyles, getDifficultyColor, ratingStyles, animationVariants } from '@/lib/education-styles';
type TutorialSeries = {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  rating?: { average: number; totalReviews: number };
  videos?: { id: string }[];
  instructor?: string;
  prerequisites?: string[];
};
const getTotalSeriesDuration = (s: TutorialSeries) => {
  if (!s.videos || s.videos.length === 0) return '0 min';
  const totalMinutes = s.videos.length * 10; // estimate 10 min per video
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim();
};

interface TutorialSeriesCardProps {
  series: TutorialSeries;
  onViewDetails: (seriesId: string) => void;
  onEnroll?: (seriesId: string) => void;
  isGridView?: boolean;
  onClick?: (series: TutorialSeries) => void;
  onBookmark?: (series: TutorialSeries) => void;
  isBookmarked?: boolean;
}

const TutorialSeriesCard: React.FC<TutorialSeriesCardProps> = ({
  series,
  onViewDetails,
  onEnroll,
  isGridView = true,
  onClick,
  onBookmark,
  isBookmarked = false
}) => {
  // no user progress yet - will be implemented when backend supports it
  const progress = undefined;
  const progressPercentage = 0;
  const duration = getTotalSeriesDuration(series);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    if (!progress || progress.status === 'not-started') {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Not Started
        </Badge>
      );
    }
    
    if (progress.status === 'completed') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        In Progress
      </Badge>
    );
  };

  const hasPrerequisites = Array.isArray(series.prerequisites) && series.prerequisites.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="h-full flex"
    >
      <Card 
        className={`h-full w-full border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col ${
          isGridView ? '' : 'flex-row'
        }`}
        onClick={() => {
          if (onClick) {
            onClick(series);
          } else {
            onViewDetails(series.id);
          }
        }}
      >
        {/* Thumbnail Section */}
        <div className={`relative flex-shrink-0 ${isGridView ? 'w-full' : 'w-64'}`}>
          {(() => {
            const thumbnailUrl = (series as any).thumbnail || 'https://via.placeholder.com/600x300/e2e8f0/64748b?text=Tutorial';
            return (
              <img 
                src={thumbnailUrl}
                alt={series.title}
                className={`w-full object-cover ${
                  isGridView ? 'h-40 rounded-t-lg' : 'h-full rounded-l-lg'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x225/e2e8f0/64748b?text=Tutorial+Series';
                }}
              />
            );
          })()}
          
          {/* Duration Badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration}
          </div>

          {/* Prerequisites Warning */}
          {hasPrerequisites && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded z-10">
              <AlertTriangle className="h-3 w-3" />
            </div>
          )}

          {/* Bookmark Icon */}
          <div 
            className={`absolute top-2 ${hasPrerequisites ? 'right-10' : 'right-2'} ${isBookmarked ? 'bg-purple-600' : 'bg-white/90 hover:bg-white'} ${isBookmarked ? 'text-white' : 'text-purple-600'} p-1.5 rounded-full cursor-pointer transition-colors z-10`}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(series);
            }}
          >
            <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-current' : ''}`} />
          </div>

        </div>
        
        {/* Content Section */}
        <div className={`p-4 flex-1 flex flex-col ${isGridView ? '' : 'flex-1'}`}>
          {/* Header Info - flex-grow to take available space */}
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <Badge className={getDifficultyColor(series.difficulty || 'beginner')}>
                {(series.difficulty || 'beginner').charAt(0).toUpperCase() + (series.difficulty || 'beginner').slice(1)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                {series.rating?.average ?? 0}
              </div>
            </div>

            <CardHeader className="p-0 flex-shrink-0">
              <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3rem]">{series.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem] mt-1">{series.description}</CardDescription>
            </CardHeader>

            {/* Series Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {series.videos?.length ?? 0} videos
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {series.rating?.totalReviews ?? 0}
                </div>
              </div>
              {series.instructor && <span className="text-xs text-gray-500">By {series.instructor}</span>}
            </div>

            {/* Prerequisites */}
            {hasPrerequisites && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 flex-shrink-0">
                <span className="font-medium">Prerequisites:</span> {(series.prerequisites || []).join(', ')}
              </div>
            )}

            {/* Progress Bar */}
            {progress && progress.status !== 'not-started' && (
              <div className="space-y-1 flex-shrink-0">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-gray-500">
                  {(progress as any).completedVideos?.length || 0} of {series.videos?.length || 0} videos completed
                </div>
              </div>
            )}
          </div>

          {/* Status and Action - pushed to bottom */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            
            <div className="text-right">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {!progress || progress.status === 'not-started' 
                    ? 'Enroll Now' 
                    : progress.status === 'completed' 
                    ? 'Review Series' 
                    : 'Continue Learning'}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TutorialSeriesCard;
