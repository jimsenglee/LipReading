import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  instructor: string;
  rating: number;
  students: number;
  thumbnail: string;
  isBookmarked: boolean;
  tags: string[];
}

interface TutorialCardProps {
  tutorial: Tutorial;
  isGridView: boolean;
  onBookmarkToggle: (tutorialId: number) => void;
  onPlay: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  isGridView,
  onBookmarkToggle,
  onPlay
}) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
        <div className={`relative ${isGridView ? 'w-full' : 'w-48 flex-shrink-0'}`}>
          <img 
            src={tutorial.thumbnail} 
            alt={tutorial.title}
            className={`w-full object-cover ${
              isGridView ? 'h-48 rounded-t-lg' : 'h-full rounded-l-lg'
            }`}
          />
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tutorial.duration}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white"
            onClick={() => onBookmarkToggle(tutorial.id)}
          >
            {tutorial.isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className={`p-4 ${isGridView ? 'flex-1' : 'flex-1'}`}>
          <div className="flex items-start justify-between mb-2">
            <Badge className={getDifficultyColor(tutorial.difficulty)}>
              {tutorial.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              {tutorial.rating}
            </div>
          </div>
          
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-lg leading-tight">{tutorial.title}</CardTitle>
            <CardDescription className="text-sm">{tutorial.description}</CardDescription>
          </CardHeader>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>By {tutorial.instructor}</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tutorial.students.toLocaleString()}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tutorial.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={onPlay}
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Tutorial
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TutorialCard;
