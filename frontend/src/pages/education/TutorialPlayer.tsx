import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Bookmark, 
  BookmarkCheck,
  ArrowLeft,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import BackButton from '@/components/ui/back-button';
import VideoPlayer from '@/components/education/VideoPlayer';
import { useToast } from '@/hooks/use-toast';
import { useTutorialById } from '@/services/content/contentQueries';

interface Tutorial {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  categoryName: string;
  author: string;
  rating: number;
  views: number;
  thumbnailPath: string | null;
  videoPath: string;
  videoDuration: number | null;
  tags: string | null;
}

interface Chapter {
  id: number;
  title: string;
  startTime: number;
  duration: string;
}

const TutorialPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Get tutorial data from navigation state or use default fallback
  const passedTutorial = location.state?.tutorial as Tutorial;
  const passedBreadcrumbs = location.state?.breadcrumbs;

  // fetch tutorial data from API
  const { data: tutorialData, isLoading, error } = useTutorialById(parseInt(id || '1'));
  
  // use passed tutorial data or fetched data
  const tutorial = passedTutorial || tutorialData;

  // Set bookmark state from tutorial data - moved before early returns
  useEffect(() => {
    setIsBookmarked(false); // default to false since ApiTutorial doesn't have isBookmarked
  }, [tutorial]);

  // show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tutorial...</p>
        </div>
      </div>
    );
  }

  // show error state
  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tutorial Not Found</h2>
          <p className="text-gray-600 mb-6">The tutorial you're looking for doesn't exist or there was an error loading it.</p>
          <Button onClick={() => navigate('/education')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  // Use passed breadcrumbs or create default ones
  const defaultBreadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Tutorial Library', href: '/education' },
    { title: tutorial.title }
  ];
  
  const breadcrumbItems = passedBreadcrumbs || defaultBreadcrumbs;


  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark Removed" : "Tutorial Bookmarked",
      description: isBookmarked 
        ? `Removed "${tutorial.title}" from bookmarks` 
        : `Added "${tutorial.title}" to bookmarks`
    });
  };


  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      <BackButton />
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-0">
               <VideoPlayer
                 videoUrl={(tutorial as any).videoPath || '/api/placeholder/video/tutorial.mp4'}
                 videoId={tutorial?.id?.toString() || '1'}
                 title={tutorial?.title || 'Tutorial'}
                 courseId="1"
                 lessonId={tutorial?.id?.toString() || '1'}
                 chapters={[]}
                 onProgress={(currentTime: number, duration: number) => {
                   // video player handles its own progress internally
                 }}
                 onComplete={() => {
                   // handle completion if needed
                 }}
               />
            </CardContent>
          </Card>
          
          {/* Tutorial Info */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                   <Badge variant={(tutorial?.difficulty || 'Beginner') === 'Beginner' ? 'secondary' : 'default'}>
                     {tutorial?.difficulty || 'Beginner'}
                   </Badge>
                   <Badge variant="outline">{tutorial?.categoryName || 'General'}</Badge>
                 </div>
                 <CardTitle className="text-2xl">{tutorial?.title || 'Tutorial'}</CardTitle>
                 <CardDescription className="text-base">{tutorial?.description || 'No description available'}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  className="flex items-center gap-2"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{Math.floor((tutorial?.videoDuration || 0) / 60)} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{tutorial?.rating || 0} rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{(tutorial?.views || 0).toLocaleString()} students</span>
                </div>
                <div>
                  <span className="text-gray-500">Instructor: </span>
                  <span className="font-medium">{tutorial?.author || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chapter Navigation */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Tutorial Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* since ApiTutorial doesn't have chapters, show basic tutorial info */}
                <div className="p-3 rounded-lg border bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{tutorial?.title || 'Tutorial'}</h4>
                      <p className="text-xs text-gray-500">{Math.floor((tutorial?.videoDuration || 0) / 60)} min</p>
                    </div>
                    <Play className="h-3 w-3 text-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Related Tutorials */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Related Tutorials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: 'Advanced Vowel Combinations', duration: '25 min', difficulty: 'Intermediate' },
                  { title: 'Consonant Clusters', duration: '30 min', difficulty: 'Intermediate' },
                  { title: 'Silent Letters Recognition', duration: '20 min', difficulty: 'Advanced' }
                ].map((related, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => navigate(`/education/tutorial/${index + 10}`)}
                  >
                    <h4 className="font-medium text-sm mb-1">{related.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{related.duration}</span>
                      <Badge variant="outline" className="text-xs">
                        {related.difficulty}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialPlayer;