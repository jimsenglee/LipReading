/**
 * admin review management modal component
 * displays all reviews for a specific tutorial or quiz and allows admins to respond
 */
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/education/FeedbackSystem';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, Calendar, Send, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAdminContentReviews, useSubmitAdminReviewResponse } from '@/services/reviews/adminReviewQueries';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/ui/pagination';

interface AdminReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number;
  contentType: 'tutorial' | 'quiz';
  contentTitle: string;
}

interface ReviewItem {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  rating: number;
  reviewText?: string;
  reviewedAt?: string;
  adminResponse?: string;
  adminRespondedAt?: string;
}

const AdminReviewModal: React.FC<AdminReviewModalProps> = ({
  isOpen,
  onClose,
  contentId,
  contentType,
  contentTitle
}) => {
  const { toast } = useToast();
  
  // pagination and filtering state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'created_at' | 'rating'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  
  // admin response state
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [adminResponse, setAdminResponse] = useState<string>('');
  
  // build query params
  const params: any = {
    page,
    per_page: perPage,
    sort_by: sortBy,
    sort_order: sortOrder
  };
  if (ratingFilter !== 'all') {
    const rating = parseInt(ratingFilter);
    params.rating_min = rating;
    params.rating_max = rating;
  }
  
  // fetch reviews - only enable query if contentId is valid
  const reviewsQuery = useAdminContentReviews(contentId, contentType, params);
  const submitResponseMutation = useSubmitAdminReviewResponse();
  
  const reviews = reviewsQuery.data?.reviews || [];
  const pagination = reviewsQuery.data?.pagination;
  const averageRating = reviewsQuery.data?.averageRating || 0;
  const totalReviews = reviewsQuery.data?.totalReviews || 0;
  
  // handle admin response submission
  const handleSubmitResponse = async (reviewId: number) => {
    if (!adminResponse.trim()) {
      toast({
        variant: "destructive",
        title: "Response Required",
        description: "Please enter a response before submitting.",
      });
      return;
    }
    
    try {
      await submitResponseMutation.mutateAsync({
        reviewId,
        adminResponse: adminResponse.trim()
      });
      
      toast({
        title: "Response Submitted",
        description: "Your response has been successfully submitted.",
      });
      
      // reset form and refresh reviews
      setSelectedReviewId(null);
      setAdminResponse('');
      reviewsQuery.refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error?.response?.data?.error || error?.message || "Failed to submit response. Please try again.",
      });
    }
  };
  
  // format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // get initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Manage Reviews - {contentTitle}
          </DialogTitle>
          <DialogDescription>
            View and respond to user reviews for this {contentType === 'tutorial' ? 'tutorial series' : 'quiz'}.
            {totalReviews > 0 && (
              <span className="block mt-1">
                Average Rating: <strong>{averageRating.toFixed(1)}</strong> ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {reviewsQuery.error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load reviews. Please try again.</p>
            <Button onClick={() => reviewsQuery.refetch()} variant="outline">
              Retry
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No Reviews Yet</p>
            <p className="text-sm text-gray-500">This {contentType} doesn't have any reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter and Sort Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Select value={ratingFilter} onValueChange={(value) => {
                  setRatingFilter(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-[140px] h-9 text-sm">
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
                
                <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
                  const [by, order] = value.split('_');
                  setSortBy(by as 'created_at' | 'rating');
                  setSortOrder(order as 'asc' | 'desc');
                  setPage(1);
                }}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
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
            </div>
            
            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review: ReviewItem) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  {/* User Info and Rating */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{getInitials(review.userName)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900">{review.userName}</p>
                          <Badge variant="outline" className="text-xs">{review.userEmail}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} onRatingChange={() => {}} readonly size="sm" />
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(review.reviewedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Text */}
                  {review.reviewText && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3 pl-13">
                      {review.reviewText}
                    </p>
                  )}
                  
                  {/* Existing Admin Response */}
                  {review.adminResponse && (
                    <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          Admin Response
                        </Badge>
                        {review.adminRespondedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(review.adminRespondedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800">{review.adminResponse}</p>
                    </div>
                  )}
                  
                  {/* Admin Response Form */}
                  {selectedReviewId === review.id ? (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Your Response
                      </label>
                      <Textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Enter your response to this review..."
                        rows={3}
                        className="resize-none mb-3"
                        maxLength={5000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {adminResponse.length}/5000 characters
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReviewId(null);
                              setAdminResponse('');
                            }}
                            disabled={submitResponseMutation.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitResponse(review.id)}
                            disabled={submitResponseMutation.isPending || !adminResponse.trim()}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {submitResponseMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Response
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReviewId(review.id);
                          setAdminResponse(review.adminResponse || '');
                        }}
                      >
                        {review.adminResponse ? (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Edit Response
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Respond to Review
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Pagination - Always display if pagination data exists, matching DataTable pattern */}
            {pagination && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Show numbers of</Label>
                  <Select value={perPage.toString()} onValueChange={(value) => {
                    setPerPage(parseInt(value));
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-24 border-primary/20 focus:border-primary h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label className="text-sm font-medium text-gray-700">entries</Label>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {((pagination.current_page || page) - 1) * (pagination.per_page || perPage) + 1} to {Math.min((pagination.current_page || page) * (pagination.per_page || perPage), pagination.total_count || totalReviews)} of {pagination.total_count || totalReviews} entries
                  </span>
                  <Pagination
                    currentPage={pagination.current_page || page}
                    totalPages={pagination.total_pages || 1}
                    totalCount={pagination.total_count || totalReviews}
                    perPage={pagination.per_page || perPage}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminReviewModal;
