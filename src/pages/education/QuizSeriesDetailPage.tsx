import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Clock, 
  Target, 
  CheckCircle, 
  Lock,
  Star,
  Users,
  AlertTriangle,
  ArrowLeft,
  Award,
  Brain,
  MessageSquare,
  ThumbsUp,
  Heart,
  Edit3,
  Send,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { QuizSeries, UserQuizProgress, mockQuizSeries, mockUserQuizProgress, getDifficultyColor, getQuizProgressPercentage } from '@/data/quizSeries';
import { RatingDisplay, StarRating } from '@/components/education/FeedbackSystem';
import { Textarea } from '@/components/ui/textarea';

// Prerequisites Warning Modal
interface PrerequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  quizTitle: string;
  prerequisites: string[];
}

const PrerequisitesModal: React.FC<PrerequisitesModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  quizTitle,
  prerequisites
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('skipPrerequisiteWarnings', 'true');
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
          <h3 className="text-lg font-semibold">Prerequisites Recommended</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          <strong>"{quizTitle}"</strong> has recommended prerequisites. Completing these first will improve your success rate.
        </p>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-orange-800 mb-2">Recommended quizzes:</p>
          <ul className="text-sm text-orange-700 space-y-1">
            {prerequisites.map((prereq, index) => (
              <li key={index} className="flex items-center gap-2">
                <Target className="h-3 w-3" />
                {prereq}
              </li>
            ))}
          </ul>
        </div>
        
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

const QuizSeriesDetailPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPrerequisitesModal, setShowPrerequisitesModal] = useState(false);
  
  // Feedback state
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Find the series data
  const series = mockQuizSeries.find(s => s.id === seriesId);
  const userProgress = mockUserQuizProgress[seriesId || ''];

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Series Not Found</h1>
          <p className="text-gray-600 mb-4">The quiz series you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  const progressPercentage = userProgress ? getQuizProgressPercentage(userProgress, series) : 0;
  const isStarted = userProgress && userProgress.status !== 'not-started';
  const isCompleted = userProgress?.status === 'completed';

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Quizzes', href: '/education/quizzes' },
    { title: series.title }
  ];

  const handleStartQuiz = async () => {
    const skipWarnings = localStorage.getItem('skipPrerequisiteWarnings') === 'true';
    
    if (series.prerequisites && series.prerequisites.length > 0 && !skipWarnings && !isStarted) {
      setShowPrerequisitesModal(true);
    } else {
      navigateToQuiz();
    }
  };

  const navigateToQuiz = () => {
    // In a real app, this would navigate to the quiz taking interface
    navigate(`/education/quiz/${series.id}/take`);
  };

  const handleModalContinue = () => {
    navigateToQuiz();
    setShowPrerequisitesModal(false);
  };

  // Feedback handling functions
  const handleSubmitReview = async () => {
    if (userRating === 0) {
      toast({
        variant: "destructive",
        title: "Rating Required",
        description: "Please provide a star rating for this quiz series.",
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
                    target.src = 'https://via.placeholder.com/600x300/e2e8f0/64748b?text=Quiz+Series';
                  }}
                />
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {series.estimatedCompletionTime}
                </div>
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Quiz Series
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
                    <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.estimatedCompletionTime}</div>
                    <div className="text-sm text-gray-600">Estimated Time</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.rating.totalReviews}</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-lg font-semibold">{series.difficulty}</div>
                    <div className="text-sm text-gray-600">Level</div>
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
                      Complete these quiz series first: {series.prerequisites.join(', ')}
                    </p>
                  </div>
                )}

                {/* Progress */}
                {isStarted && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Your Progress</span>
                      <span className="text-sm text-primary">{progressPercentage}% Complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2 mb-2" />
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600">
                      <div>Questions: {userProgress?.completedQuestions.length || 0} of {series.totalQuestions}</div>
                      <div>Best Score: {userProgress?.bestScore || 0}%</div>
                      <div>Attempts: {userProgress?.totalAttempts || 0}</div>
                      <div>Time Spent: {userProgress?.timeSpent || 0}min</div>
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                {userProgress && userProgress.totalAttempts > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Performance Statistics</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{userProgress.bestScore}%</div>
                        <div className="text-sm text-blue-700">Best Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{userProgress.averageScore}%</div>
                        <div className="text-sm text-blue-700">Average Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  onClick={handleStartQuiz}
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isCompleted ? 'Retake Quiz Series' : isStarted ? 'Continue Quiz Series' : 'Start Quiz Series'}
                </Button>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/20 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Quiz Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Questions</span>
                    <span className="font-medium">{series.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Difficulty</span>
                    <Badge className={getDifficultyColor(series.difficulty)} variant="outline">
                      {series.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="font-medium">{series.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Est. Time</span>
                    <span className="font-medium">{series.estimatedCompletionTime}</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-1">
                    {series.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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
                            placeholder="Share your experience with this quiz series..."
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
                            <span className="text-sm font-medium text-primary">EA</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Emma Anderson</p>
                            <div className="flex items-center gap-1">
                              <StarRating rating={5} onRatingChange={() => {}} readonly size="sm" />
                              <span className="text-xs text-gray-500 ml-1">3 days ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">18</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Fantastic quiz series! Really helped me improve my lip reading skills. The difficulty progression is perfect.
                      </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">MR</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">Michael Rodriguez</p>
                            <div className="flex items-center gap-1">
                              <StarRating rating={4} onRatingChange={() => {}} readonly size="sm" />
                              <span className="text-xs text-gray-500 ml-1">1 week ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">12</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Good practice questions. Some could be more challenging, but overall very helpful for learning.
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

      {/* Prerequisites Modal */}
      <AnimatePresence>
        {showPrerequisitesModal && (
          <PrerequisitesModal
            isOpen={showPrerequisitesModal}
            onClose={() => setShowPrerequisitesModal(false)}
            onContinue={handleModalContinue}
            quizTitle={series.title}
            prerequisites={series.prerequisites || []}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizSeriesDetailPage;
