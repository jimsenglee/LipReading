import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Heart,
  Flag,
  CheckCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { TutorialSeries, Video } from '@/data/tutorialSeries';
import { progressAPI } from '@/services/progressAPI';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: TutorialSeries;
  video?: Video;
  type: 'series' | 'video';
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  size = 'md',
  readonly = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${sizeClasses[size]} transition-all ${
              star <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  series,
  video,
  type
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (type === 'series') {
        if (rating === 0) {
          toast({
            variant: "destructive",
            title: "Rating Required",
            description: "Please provide a star rating for this series.",
          });
          setIsSubmitting(false);
          return;
        }

        const result = await progressAPI.submitRating(series.id, rating, review);
        
        if (result.success) {
          toast({
            title: "Thank You!",
            description: result.message,
          });
          onClose();
        } else {
          throw new Error(result.message);
        }
      } else if (type === 'video' && video) {
        if (isHelpful === null) {
          toast({
            variant: "destructive",
            title: "Feedback Required",
            description: "Please let us know if this video was helpful.",
          });
          setIsSubmitting(false);
          return;
        }

        const result = await progressAPI.submitVideoFeedback(
          series.id, 
          video.id, 
          { helpful: isHelpful, comments }
        );
        
        if (result.success) {
          toast({
            title: "Thank You!",
            description: result.message,
          });
          onClose();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setReview('');
    setIsHelpful(null);
    setComments('');
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {type === 'series' ? 'Rate This Series' : 'Video Feedback'}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Series/Video Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900">
              {type === 'series' ? series.title : video?.title}
            </h4>
            {type === 'video' && (
              <p className="text-xs text-gray-600 mt-1">{series.title}</p>
            )}
          </div>

          {type === 'series' ? (
            /* Series Rating Form */
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      How would you rate this series?
                    </label>
                    <div className="flex items-center justify-center py-4">
                      <StarRating 
                        rating={rating} 
                        onRatingChange={setRating}
                        size="lg"
                      />
                    </div>
                    {rating > 0 && (
                      <p className="text-center text-sm text-gray-600">
                        {rating === 1 && "Poor - Needs significant improvement"}
                        {rating === 2 && "Fair - Could be better"}
                        {rating === 3 && "Good - Satisfactory experience"}
                        {rating === 4 && "Very Good - Enjoyed it"}
                        {rating === 5 && "Excellent - Highly recommend!"}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setStep(2)}
                      disabled={rating === 0}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Next
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Share your experience (optional)
                    </label>
                    <Textarea
                      placeholder="What did you like most? How can we improve?"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {review.length}/500 characters
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
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
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            /* Video Feedback Form */
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  Was this video helpful?
                </label>
                <div className="flex items-center gap-4 justify-center">
                  <Button
                    variant={isHelpful === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsHelpful(true)}
                    className={`${isHelpful === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Yes, helpful
                  </Button>
                  <Button
                    variant={isHelpful === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsHelpful(false)}
                    className={`${isHelpful === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not helpful
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Additional comments (optional)
                </label>
                <Textarea
                  placeholder="Any specific feedback about this video?"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isHelpful === null || isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Rating Display Component
interface RatingDisplayProps {
  rating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  totalReviews,
  size = 'md',
  showCount = true
}) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex items-center gap-1">
      <StarRating rating={Math.floor(rating)} onRatingChange={() => {}} readonly size={size} />
      <span className={`font-medium text-gray-900 ${textSizeClasses[size]}`}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`text-gray-500 ${textSizeClasses[size === 'lg' ? 'md' : 'sm']}`}>
          ({totalReviews.toLocaleString()})
        </span>
      )}
    </div>
  );
};

// Quick Feedback Component (for video pages)
interface QuickFeedbackProps {
  series: TutorialSeries;
  video: Video;
  onFeedbackSubmitted?: () => void;
}

export const QuickFeedback: React.FC<QuickFeedbackProps> = ({
  series,
  video,
  onFeedbackSubmitted
}) => {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleQuickFeedback = async (helpful: boolean) => {
    try {
      const result = await progressAPI.submitVideoFeedback(
        series.id,
        video.id,
        { helpful }
      );

      if (result.success) {
        toast({
          title: "Thank You!",
          description: "Your feedback helps us improve our content.",
        });
        onFeedbackSubmitted?.();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit feedback",
        description: "Please try again later.",
      });
    }
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            How was this video?
          </CardTitle>
          <CardDescription>
            Your feedback helps us create better content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFeedback(true)}
              className="flex-1 hover:bg-green-50 hover:border-green-200"
            >
              <ThumbsUp className="h-4 w-4 mr-2 text-green-600" />
              Helpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFeedback(false)}
              className="flex-1 hover:bg-red-50 hover:border-red-200"
            >
              <ThumbsDown className="h-4 w-4 mr-2 text-red-600" />
              Not Helpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Detailed
            </Button>
          </div>
        </CardContent>
      </Card>

      <FeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        series={series}
        video={video}
        type="video"
      />
    </>
  );
};

export { FeedbackModal, StarRating };
export default FeedbackModal;
