import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { TutorialSeries, Video, mockTutorialSeries, mockUserProgress, formatDuration, getTotalSeriesDuration, getProgressPercentage } from '@/data/tutorialSeries';
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
  
  // Feedback state
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Find the series data
  const series = mockTutorialSeries.find(s => s.id === seriesId);
  const userProgress = mockUserProgress[seriesId || ''];

  if (!series) {
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
  const isEnrolled = userProgress && userProgress.status !== 'not-started';

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: series.title }
  ];

  const handleEnroll = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Enrollment Successful!",
        description: `You've enrolled in "${series.title}". Happy learning!`,
      });

      // In real app, this would update the user progress via API
      // For now, we'll navigate to the first video
      setTimeout(() => {
        navigate(`/education/series/${series.id}/video/${series.videos[0].id}`);
      }, 1500);
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
    
    if (video.isAdvanced && !skipWarnings && !isEnrolled) {
      setSelectedVideo(video);
      setShowAdvancedModal(true);
    } else {
      navigateToVideo(video);
    }
  };

  const navigateToVideo = (video: Video) => {
    navigate(`/education/series/${series.id}/video/${video.id}`);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. It helps other learners.",
      });
      
      // Reset form
      setUserRating(0);
      setUserReview('');
      setShowWriteReview(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later.",
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
                    const isCompleted = isVideoCompleted(video.id);
                    const isLocked = video.isAdvanced && !isEnrolled;
                    
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
                              {video.isAdvanced && (
                                <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {video.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatDuration(video.duration)}
                              </span>
                              <span className="text-xs text-gray-400">
                                Video {video.order}
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
                        rating={series.rating.average} 
                        totalReviews={series.rating.totalReviews}
                        size="lg"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {series.rating.totalReviews} community reviews
                    </p>
                    <Button 
                      onClick={() => setShowWriteReview(!showWriteReview)}
                      className="bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Write Your Review
                    </Button>
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

                {/* Recent Reviews */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recent Reviews
                  </h4>
                  
                  {/* Sample Reviews */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">JS</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">John Smith</p>
                            <div className="flex items-center gap-1">
                              <StarRating rating={5} onRatingChange={() => {}} readonly size="sm" />
                              <span className="text-xs text-gray-500 ml-1">2 days ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">12</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Excellent tutorial series! The explanations are clear and the examples are practical. Really helped me understand the concepts better.
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">MW</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Maria Wilson</p>
                            <div className="flex items-center gap-1">
                              <StarRating rating={4} onRatingChange={() => {}} readonly size="sm" />
                              <span className="text-xs text-gray-500 ml-1">1 week ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">8</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Great content overall. Some videos could be a bit more detailed, but the progression is logical and easy to follow.
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">AD</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Alex Davis</p>
                            <div className="flex items-center gap-1">
                              <StarRating rating={5} onRatingChange={() => {}} readonly size="sm" />
                              <span className="text-xs text-gray-500 ml-1">2 weeks ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">15</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Perfect for beginners! The instructor explains everything step by step. Highly recommend this series.
                      </p>
                    </div>
                  </div>

                  {/* Load More Reviews Button */}
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      Load More Reviews
                    </Button>
                  </div>
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
