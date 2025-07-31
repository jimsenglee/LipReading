import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  Lock, 
  Star, 
  Users, 
  BookOpen,
  Heart,
  Bookmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Course } from '@/data/mockCourses';
import { useEducation } from '@/hooks/use-education';

interface VideoCardProps extends Course {
  onStartLesson: () => void;
  viewMode?: 'grid' | 'list';
}

const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  shortDescription,
  duration,
  category,
  difficulty,
  rating,
  studentsCount,
  instructor,
  thumbnail,
  lessons,
  onStartLesson,
  viewMode = 'grid'
}) => {
  const { getCourseProgress, toggleBookmark, toggleFavorite } = useEducation();
  
  const progress = getCourseProgress(id);
  const isCompleted = progress?.status === 'completed';
  const isLocked = progress?.status === undefined && difficulty === 'Advanced';
  const progressPercentage = progress?.progressPercentage || 0;
  const isBookmarked = progress?.isBookmarked || false;
  const isFavorite = progress?.isFavorite || false;

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(id);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`h-full hover:shadow-lg transition-all duration-300 border-primary/20 ${isLocked ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          {/* Video Thumbnail */}
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 overflow-hidden">
            <img 
              src={thumbnail} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden items-center justify-center h-full">
              <Play className="h-12 w-12 text-primary/60" />
            </div>
            
            {isLocked && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
            {isCompleted && !isLocked && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-2 left-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className={`h-8 w-8 p-0 bg-black/50 hover:bg-black/70 ${isFavorite ? 'text-red-500' : 'text-white'}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`h-8 w-8 p-0 bg-black/50 hover:bg-black/70 ${isBookmarked ? 'text-primary' : 'text-white'}`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{shortDescription}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {lessons.length} lessons
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {studentsCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {rating}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {category}
            </Badge>
          </div>

          <p className="text-xs text-gray-500 mb-3">By {instructor}</p>

          {/* Progress Bar */}
          {!isLocked && progressPercentage > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Button
            onClick={onStartLesson}
            disabled={isLocked}
            className="w-full"
            variant={isCompleted ? "outline" : "default"}
          >
            <Play className="h-4 w-4 mr-2" />
            {isCompleted ? 'Review' : progressPercentage > 0 ? 'Continue' : 'Start Course'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VideoCard;
