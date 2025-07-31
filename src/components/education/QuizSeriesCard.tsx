import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Target, 
  CheckCircle, 
  Play,
  Star,
  Trophy,
  Brain,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QuizSeries, UserQuizProgress, getDifficultyColor, getQuizProgressPercentage } from '@/data/quizSeries';

interface QuizSeriesCardProps {
  series: QuizSeries;
  progress?: UserQuizProgress;
  onClick: (series: QuizSeries) => void;
  index: number;
}

const QuizSeriesCard: React.FC<QuizSeriesCardProps> = ({
  series,
  progress,
  onClick,
  index
}) => {
  const progressPercentage = progress ? getQuizProgressPercentage(progress, series) : 0;
  const isCompleted = progress?.status === 'completed';
  const isStarted = progress?.status === 'in-progress';

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (isStarted) return <Play className="h-4 w-4 text-blue-500" />;
    return <Target className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isCompleted) return 'Completed';
    if (isStarted) return 'In Progress';
    return 'Not Started';
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600';
    if (isStarted) return 'text-blue-600';
    return 'text-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card 
        className="h-full border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:shadow-lg"
        onClick={() => onClick(series)}
      >
        <div className="relative">
          <img 
            src={series.thumbnailUrl} 
            alt={series.title}
            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/400x225/e2e8f0/64748b?text=Quiz+Series';
            }}
          />
          <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Quiz
          </div>
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {series.estimatedCompletionTime}
          </div>
          {isCompleted && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Trophy className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-1">
              <Badge className={getDifficultyColor(series.difficulty)}>
                {series.difficulty.charAt(0).toUpperCase() + series.difficulty.slice(1)}
              </Badge>
              <Badge variant="outline">{series.category}</Badge>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium text-sm">{series.rating.average}</span>
            </div>
          </div>
          
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {series.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {series.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quiz Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-gray-600">{series.totalQuestions} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-gray-600">{series.rating.totalReviews} reviews</span>
            </div>
          </div>

          {/* Prerequisites */}
          {series.prerequisites && series.prerequisites.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
              <p className="text-xs text-orange-700">
                <span className="font-medium">Prerequisites:</span> {series.prerequisites.length} quiz{series.prerequisites.length > 1 ? 'es' : ''}
              </p>
            </div>
          )}

          {/* Progress Section */}
          {progress && progress.status !== 'not-started' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className={`font-medium ${getStatusColor()}`}>
                  {progressPercentage}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {progress.bestScore > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Best Score: {progress.bestScore}%</span>
                  <span>Attempts: {progress.totalAttempts}</span>
                </div>
              )}
            </div>
          )}

          {/* Status and Action */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            <div className="text-right">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isCompleted ? 'View Quiz' : isStarted ? 'Continue' : 'Start Quiz'}
                </span>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuizSeriesCard;
