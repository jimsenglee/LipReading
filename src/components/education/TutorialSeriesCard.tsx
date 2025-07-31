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
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TutorialSeries, UserProgress, getTotalSeriesDuration, getProgressPercentage, mockUserProgress } from '@/data/tutorialSeries';

interface TutorialSeriesCardProps {
  series: TutorialSeries;
  onViewDetails: (seriesId: string) => void;
  onEnroll?: (seriesId: string) => void;
  isGridView?: boolean;
}

const TutorialSeriesCard: React.FC<TutorialSeriesCardProps> = ({
  series,
  onViewDetails,
  onEnroll,
  isGridView = true
}) => {
  // Get user progress from mock data
  const progress = mockUserProgress[series.id];
  const progressPercentage = progress ? getProgressPercentage(progress, series) : 0;
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

  const getActionButton = () => {
    if (!progress || progress.status === 'not-started') {
      return (
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => onEnroll?.(series.id)}
        >
          <Play className="mr-2 h-4 w-4" />
          Enroll Now
        </Button>
      );
    }
    
    if (progress.status === 'completed') {
      return (
        <Button 
          variant="outline"
          className="w-full border-primary/20 text-primary hover:bg-primary/10"
          onClick={() => onViewDetails(series.id)}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Review Series
        </Button>
      );
    }
    
    return (
      <Button 
        className="w-full bg-primary hover:bg-primary/90"
        onClick={() => onViewDetails(series.id)}
      >
        <Play className="mr-2 h-4 w-4" />
        Continue Learning
      </Button>
    );
  };

  const hasPrerequisites = series.prerequisites && series.prerequisites.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`h-full border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300 ${
        isGridView ? 'flex flex-col' : 'flex flex-row'
      }`}>
        {/* Thumbnail Section */}
        <div className={`relative ${isGridView ? 'w-full' : 'w-64 flex-shrink-0'}`}>
          <img 
            src={series.thumbnailUrl} 
            alt={series.title}
            className={`w-full object-cover ${
              isGridView ? 'h-40 rounded-t-lg' : 'h-full rounded-l-lg'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/400x225/e2e8f0/64748b?text=Tutorial+Series';
            }}
          />
          
          {/* Duration Badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration}
          </div>

          {/* Prerequisites Warning */}
          {hasPrerequisites && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white p-1 rounded">
              <AlertTriangle className="h-3 w-3" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute bottom-2 left-2">
            {getStatusBadge()}
          </div>
        </div>
        
        {/* Content Section */}
        <div className={`p-4 ${isGridView ? 'flex-1' : 'flex-1'} flex flex-col justify-between`}>
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Badge className={getDifficultyColor(series.difficulty)}>
                {series.difficulty.charAt(0).toUpperCase() + series.difficulty.slice(1)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-yellow-500">
                <Star className="h-3 w-3 fill-current" />
                {series.rating.average}
              </div>
            </div>

            <CardHeader className="p-0">
              <CardTitle className="text-lg leading-tight line-clamp-2">{series.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">{series.description}</CardDescription>
            </CardHeader>

            {/* Series Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {series.videos.length} videos
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {series.rating.totalReviews}
                </div>
              </div>
              <span className="text-xs text-gray-500">By {series.instructor}</span>
            </div>

            {/* Prerequisites */}
            {hasPrerequisites && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                <span className="font-medium">Prerequisites:</span> {series.prerequisites!.join(', ')}
              </div>
            )}

            {/* Progress Bar */}
            {progress && progress.status !== 'not-started' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-gray-500">
                  {progress.completedVideos.length} of {series.videos.length} videos completed
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-4">
            {getActionButton()}
          </div>

          {/* Quick Actions */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-600 hover:text-primary justify-start"
              onClick={() => onViewDetails(series.id)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Details & Course Content
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TutorialSeriesCard;
