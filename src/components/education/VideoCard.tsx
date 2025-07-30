
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  completed: boolean;
  locked?: boolean;
  thumbnail?: string;
  onStartLesson: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  description,
  duration,
  category,
  difficulty,
  progress,
  completed,
  locked = false,
  thumbnail,
  onStartLesson
}) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`h-full hover:shadow-lg transition-all duration-300 border-primary/20 ${locked ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          {/* Video Thumbnail Placeholder */}
          <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 overflow-hidden">
            {thumbnail ? (
              <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Play className="h-12 w-12 text-primary/60" />
              </div>
            )}
            {locked && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Lock className="h-8 w-8 text-white" />
              </div>
            )}
            {completed && !locked && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duration}
            </span>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
              {category}
            </span>
          </div>

          {/* Progress Bar */}
          {!locked && progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Button 
            onClick={onStartLesson}
            disabled={locked}
            className="w-full bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {locked ? 'Locked' : completed ? 'Review Lesson' : progress > 0 ? 'Continue' : 'Start Lesson'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VideoCard;
