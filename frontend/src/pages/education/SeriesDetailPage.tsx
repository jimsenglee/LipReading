import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { API_BASE_URL } from '@/lib/constants';
import { 
  Play, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Lock,
  Star,
  Users,
  AlertTriangle,
  ArrowLeft,
  Award,
  Target,
  MessageSquare,
  ThumbsUp,
  Heart,
  Edit3,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useTutorialReviews, useUserReview } from '@/services/reviews/reviewQueries';
import { useSubmitReview } from '@/services/reviews/reviewMutations';
import { useTutorialSeriesById, useSeriesProgress } from '@/services/content/contentQueries';
import { useBookmarkCheck } from '@/services/bookmarks/bookmarkQueries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video } from '@/lib/api';
type TutorialSeries = { 
  id: number; 
  title: string; 
  description?: string; 
  detailedDescription?: string;
  videos?: Video[];
  difficulty?: string;
  category?: string;
  thumbnailUrl?: string;
  rating?: { average: number; totalReviews: number };
  estimatedCompletionTime?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
};
type UserProgress = {
  progressPercentage?: number;
  status?: string;
  completedVideos?: string[];
};
const formatDuration = (n?: number) => (n ? `${Math.round(n/60)} min` : '0 min');
const getTotalSeriesDuration = (s: TutorialSeries) => {
  if (!s.videos || s.videos.length === 0) return 0;
  return s.videos.reduce((total, v) => total + (v.videoDuration || 0), 0);
};
const getProgressPercentage = (p: UserProgress | undefined, s: TutorialSeries) => {
  if (!p || !p.completedVideos || !s.videos) return 0;
  const completed = p.completedVideos.length;
  const total = s.videos.length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};
import { RatingDisplay, StarRating } from '@/components/education/FeedbackSystem';
import { Textarea } from '@/components/ui/textarea';

// Advanced Content Warning Modal
interface AdvancedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  videoTitle: string;
}

const AdvancedContentModal: React.FC<AdvancedContentModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  videoTitle
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('skipAdvancedWarnings', 'true');
    }
    onContinue();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h3 className="text-lg font-semibold">Advanced Content Warning</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          <strong>"{videoTitle}"</strong> contains advanced content. We recommend completing previous videos first for the best learning experience.
        </p>
        
        <div className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
            Don't show this warning again
          </label>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
          <Button onClick={handleContinue} className="bg-orange-500 hover:bg-orange-600">
            Continue Anyway
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const SeriesDetailPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // feedback state
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // review pagination and filtering
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPerPage, setReviewPerPage] = useState(5);
  const [reviewSortBy, setReviewSortBy] = useState<'created_at' | 'rating'>('created_at');
  const [reviewSortOrder, setReviewSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<string>('all');

  // real review data integration
  const tutorialId = parseInt(seriesId || '1');
  const bookmarkCheckQuery = useBookmarkCheck(tutorialId);
  const isEnrolledInSeries = bookmarkCheckQuery.data?.data?.isBookmarked || false;
  
  // build review query params
  const reviewParams: any = {
    page: reviewPage,
    per_page: reviewPerPage,
    sort_by: reviewSortBy,
    sort_order: reviewSortOrder
  };
  if (reviewRatingFilter !== 'all') {
    const rating = parseInt(reviewRatingFilter);
    reviewParams.rating_min = rating;
    reviewParams.rating_max = rating;
  }
  
  const reviewsQuery = useTutorialReviews(tutorialId, reviewParams);
  const userReviewQuery = useUserReview(tutorialId);
  const submitReviewMutation = useSubmitReview();

  // fetch tutorial series data from API
  const seriesQuery = useTutorialSeriesById(tutorialId);
  
  // fetch user progress for this series (only if enrolled)
  const progressQuery = useSeriesProgress(isEnrolledInSeries ? tutorialId : 0);
  const userProgress: UserProgress | undefined = progressQuery.data ? {
    progressPercentage: progressQuery.data.progressPercentage || 0,
    status: progressQuery.data.status || 'in-progress',
    completedVideos: progressQuery.data.completedVideos || []
  } : undefined;
  
  // find the series data from API response
  const series: TutorialSeries | undefined = seriesQuery.data ? {
    id: seriesQuery.data.id,
    title: seriesQuery.data.title,
    description: seriesQuery.data.description,
    detailedDescription: seriesQuery.data.description,
    videos: seriesQuery.data.videos || [],
    difficulty: seriesQuery.data.difficulty,
    category: seriesQuery.data.categoryId?.toString(),
    thumbnailUrl: seriesQuery.data.thumbnailPath ? 
      `${API_BASE_URL}${seriesQuery.data.thumbnailPath}` : 
      undefined,
    rating: { 
      average: reviewsQuery.data?.averageRating || seriesQuery.data.rating || 0, 
      totalReviews: reviewsQuery.data?.totalReviews || 0 
    },
    estimatedCompletionTime: seriesQuery.data.estimatedDuration ? `${Math.floor(seriesQuery.data.estimatedDuration / 60)} min` : '0 min',
    prerequisites: seriesQuery.data.prerequisites ? JSON.parse(seriesQuery.data.prerequisites) : [],
    learningObjectives: seriesQuery.data.learningObjectives ? JSON.parse(seriesQuery.data.learningObjectives) : []
  } : undefined;

  if (!series) {
    if (seriesQuery.isLoading) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Series...</h1>
            <p className="text-gray-600">Please wait while we fetch the tutorial series.</p>
          </div>
        </div>
      );
    }
    
    if (seriesQuery.error) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Series Not Found</h1>
            <p className="text-gray-600 mb-4">The tutorial series you're looking for doesn't exist or there was an error loading it.</p>
            <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Education
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Series Not Found</h1>
          <p className="text-gray-600 mb-4">The tutorial series you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = userProgress ? getProgressPercentage(userProgress, series) : 0;
  const duration = getTotalSeriesDuration(series);
  const isEnrolled = isEnrolledInSeries; // use bookmark check for enrollment status

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: series.title }
  ];

  const handleEnroll = async () => {
    try {
      // simulate enrollment API call with minimal delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // navigate to the first video immediately without any success toast
      if (series.videos && series.videos.length > 0) {
        navigate(`/education/series/${series.id}/video/${series.videos[0].id}`);
      } else {
        toast({
          variant: "destructive",
          title: "No Videos Available",
          description: "This series doesn't have any videos yet.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "There was an error enrolling in this series. Please try again.",
      });
    }
  };

  const handleVideoClick = (video: Video) => {
    const skipWarnings = localStorage.getItem('skipAdvancedWarnings') === 'true';
    
    // remove advanced warning check for now
    navigateToVideo(video);
  };

  const navigateToVideo = (video: Video) => {
    if (video && video.id) {
      navigate(`/education/series/${series.id}/video/${video.id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Video Not Available",
        description: "This video is not available for playback.",
      });
    }
  };

  const handleModalContinue = () => {
    if (selectedVideo) {
      navigateToVideo(selectedVideo);
    }
    setShowAdvancedModal(false);
    setSelectedVideo(null);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isVideoCompleted = (videoId: string) => {
    return userProgress?.completedVideos.includes(videoId) || false;
  };

  // Feedback handling functions
  const handleSubmitReview = async () => {
    // check enrollment before allowing submission
    if (!isEnrolledInSeries) {
      toast({
        variant: "destructive",
        title: "Enrollment Required",
        description: "You must enroll in this series before you can submit a review. Please enroll first.",
      });
      return;
    }
    
    // check if series is completed (all videos must be completed)
    if (!userProgress || userProgress.status !== 'completed') {
      toast({
        variant: "destructive",
        title: "Series Not Completed",
        description: "You must complete all videos in this series before submitting a review.",
      });
      return;
    }
    
    if (userRating === 0) {
      toast({
        variant: "destructive",
        title: "Rating Required",
        description: "Please provide a star rating for this series.",
      });
      return;
    }

    setIsSubmittingReview(true);
    
    try {
      // use real review submission API
      await submitReviewMutation.mutateAsync({
        tutorialId,
        data: {
          rating: userRating,
          reviewText: userReview || undefined
        }
      });
      
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. It helps other learners.",
      });
      
      // Reset form and refresh reviews
      setUserRating(0);
      setUserReview('');
      setShowWriteReview(false);
      reviewsQuery.refetch();
      userReviewQuery.refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || "Please try again later.";
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Series Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20">
              <div className="relative">
                <img 
                  src={series.thumbnailUrl} 
                  alt={series.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/600x300/e2e8f0/64748b?text=Tutorial+Series';
                  }}
                />
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {duration}
                </div>
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(series.difficulty)}>
                        {series.difficulty.charAt(0).toUpperCase() + series.difficulty.slice(1)}
                      </Badge>
                      <Badge variant="outline">{series.category}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{series.title}</CardTitle>
                    <CardDescription className="text-base">{series.detailedDescription}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-medium">{series.rating.average}</span>
                    <span className="text-sm text-gray-500">({series.rating.totalReviews})</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.videos.length}</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{duration}</div>
                    <div className="text-sm text-gray-600">Total Duration</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.rating.totalReviews}</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.estimatedCompletionTime}</div>
                    <div className="text-sm text-gray-600">To Complete</div>
                  </div>
                </div>

                {/* Prerequisites */}
                {series.prerequisites && series.prerequisites.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">Prerequisites</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Complete these series first: {series.prerequisites.join(', ')}
                    </p>
                  </div>
                )}

                {/* Progress */}
                {isEnrolled && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Your Progress</span>
                      <span className="text-sm text-primary">{progressPercentage}% Complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2 mb-2" />
                    <div className="text-sm text-gray-600">
                      {userProgress?.completedVideos.length || 0} of {series.videos.length} videos completed
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {!isEnrolled ? (
                  <Button 
                    onClick={handleEnroll}
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Enroll Now & Start Learning
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigateToVideo(series.videos[0])}
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {userProgress?.status === 'completed' ? 'Review Series' : 'Continue Learning'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Learning Objectives */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {series.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar - Course Content */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Course Content
                </CardTitle>
                <CardDescription>
                  {series.videos.length} videos • {duration} total length
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {series.videos.map((video, index) => {
                    const isCompleted = isVideoCompleted(String(video.id));
                    const isLocked = false; // remove advanced check for now
                    
                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-primary/5 transition-colors ${
                          isLocked ? 'opacity-60' : ''
                        }`}
                        onClick={() => !isLocked && handleVideoClick(video)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Play className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`font-medium text-sm line-clamp-1 ${
                                isLocked ? 'text-gray-400' : 'text-gray-900'
                              }`}>
                                {video.title}
                              </h4>
                              {/* remove advanced warning icon for now */}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {video.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDuration(video.videoDuration)}
                              </span>
                              <span className="text-xs text-gray-400">
                                Video {video.videoOrder || 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Community Reviews & Feedback Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Community Reviews
                </CardTitle>
                <CardDescription>
                  Share your experience and help other learners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Rating Display */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <RatingDisplay 
                        rating={reviewsQuery.data?.averageRating || 0} 
                        totalReviews={reviewsQuery.data?.totalReviews || 0}
                        size="lg"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {reviewsQuery.data?.totalReviews || 0} community reviews
                    </p>
                    {userReviewQuery.data?.data?.hasReview ? (
                    <Button 
                      onClick={() => setShowWriteReview(!showWriteReview)}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                        disabled={!isEnrolledInSeries || userProgress?.status !== 'completed'}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Your Review
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          if (!isEnrolledInSeries) {
                            toast({
                              variant: "destructive",
                              title: "Enrollment Required",
                              description: "Please enroll in this series first to write a review.",
                            });
                            return;
                          }
                          if (!userProgress || userProgress.status !== 'completed') {
                            toast({
                              variant: "destructive",
                              title: "Series Not Completed",
                              description: "You must complete all videos in this series before writing a review.",
                            });
                            return;
                          }
                          setShowWriteReview(!showWriteReview);
                        }}
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                        disabled={!isEnrolledInSeries || !userProgress || userProgress.status !== 'completed'}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Write Your Review
                    </Button>
                    )}
                    {!isEnrolledInSeries && (
                      <p className="text-xs text-gray-500 mt-2">
                        Enroll in this series to write a review
                      </p>
                    )}
                    {isEnrolledInSeries && userProgress && userProgress.status !== 'completed' && (
                      <p className="text-xs text-orange-600 mt-2">
                        Complete all videos to write a review
                      </p>
                    )}
                  </div>
                </div>

                {/* Write Review Form */}
                <AnimatePresence>
                  {showWriteReview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-primary/20 rounded-lg p-4 bg-white"
                    >
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Your Rating
                          </label>
                          <div className="flex items-center gap-2">
                            <StarRating 
                              rating={userRating} 
                              onRatingChange={setUserRating}
                              size="md"
                            />
                            {userRating > 0 && (
                              <span className="text-sm text-gray-600 ml-2">
                                {userRating === 1 && "Poor"}
                                {userRating === 2 && "Fair"} 
                                {userRating === 3 && "Good"}
                                {userRating === 4 && "Very Good"}
                                {userRating === 5 && "Excellent"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            Your Review (Optional)
                          </label>
                          <Textarea
                            placeholder="Share your experience with this tutorial series..."
                            value={userReview}
                            onChange={(e) => setUserReview(e.target.value)}
                            rows={4}
                            className="resize-none"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {userReview.length}/500 characters
                          </p>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowWriteReview(false);
                              setUserRating(0);
                              setUserReview('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSubmitReview}
                            disabled={userRating === 0 || isSubmittingReview}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isSubmittingReview ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Review
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reviews List with Filtering and Pagination */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                      Reviews ({reviewsQuery.data?.totalReviews || 0})
                  </h4>
                  
                    {/* Filter and Sort Controls */}
                    {(reviewsQuery.data?.totalReviews ?? 0) > 0 && (
                        <div className="flex items-center gap-2">
                        <Select value={reviewRatingFilter} onValueChange={(value) => {
                          setReviewRatingFilter(value);
                          setReviewPage(1); // reset to first page on filter change
                        }}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="All Ratings" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={`${reviewSortBy}_${reviewSortOrder}`} onValueChange={(value) => {
                          const [sortBy, sortOrder] = value.split('_');
                          setReviewSortBy(sortBy as 'created_at' | 'rating');
                          setReviewSortOrder(sortOrder as 'asc' | 'desc');
                          setReviewPage(1);
                        }}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="created_at_desc">Newest First</SelectItem>
                            <SelectItem value="created_at_asc">Oldest First</SelectItem>
                            <SelectItem value="rating_desc">Highest Rated</SelectItem>
                            <SelectItem value="rating_asc">Lowest Rated</SelectItem>
                          </SelectContent>
                        </Select>
                          </div>
                    )}
                            </div>
                  
                  {/* Real Reviews from Database */}
                  <div className="space-y-4">
                    {reviewsQuery.isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Loading reviews...</p>
                          </div>
                    ) : reviewsQuery.data?.reviews && reviewsQuery.data.reviews.length > 0 ? (
                      reviewsQuery.data.reviews.map((review) => {
                        // extract initials from name
                        const initials = review.userName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                        
                        // format date
                        const reviewDate = review.reviewedAt 
                          ? new Date(review.reviewedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '';
                        
                        return (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">{initials}</span>
                          </div>
                          <div>
                                  <p className="font-medium text-sm text-gray-900">{review.userName}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <StarRating rating={review.rating} onRatingChange={() => {}} readonly size="sm" />
                                    <span className="text-xs text-gray-500 ml-1">{reviewDate}</span>
                            </div>
                          </div>
                        </div>
                        </div>
                            {review.reviewText && (
                              <p className="text-sm text-gray-700 leading-relaxed mt-2">{review.reviewText}</p>
                            )}
                      </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-primary/60" />
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-1">No Reviews Yet</h5>
                          <p className="text-sm text-gray-600 mb-4 max-w-sm">
                            Be the first to share your experience! Your feedback helps other learners discover great content.
                          </p>
                          {isEnrolledInSeries && userProgress && userProgress.status === 'completed' && (
                            <Button 
                              onClick={() => setShowWriteReview(true)}
                              className="bg-primary hover:bg-primary/90"
                              size="sm"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Write the First Review
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    </div>

                  {/* Pagination Controls */}
                  {reviewsQuery.data?.pagination && reviewsQuery.data.pagination.total_pages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show</span>
                        <Select value={reviewPerPage.toString()} onValueChange={(value) => {
                          setReviewPerPage(parseInt(value));
                          setReviewPage(1);
                        }}>
                          <SelectTrigger className="w-[70px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600">per page</span>
                  </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Page {reviewsQuery.data.pagination.current_page} of {reviewsQuery.data.pagination.total_pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                          disabled={reviewPage <= 1}
                          className="h-8"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewPage(p => Math.min(reviewsQuery.data.pagination.total_pages, p + 1))}
                          disabled={reviewPage >= reviewsQuery.data.pagination.total_pages}
                          className="h-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Advanced Content Modal */}
      <AnimatePresence>
        {showAdvancedModal && (
          <AdvancedContentModal
            isOpen={showAdvancedModal}
            onClose={() => {
              setShowAdvancedModal(false);
              setSelectedVideo(null);
            }}
            onContinue={handleModalContinue}
            videoTitle={selectedVideo?.title || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeriesDetailPage;
