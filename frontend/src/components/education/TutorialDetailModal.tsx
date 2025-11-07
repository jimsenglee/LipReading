import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, PlayCircle, Clock, BookOpen, CheckCircle2, TrendingUp } from 'lucide-react';

interface TutorialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: {
    id: number;
    publicId: string;
    title: string;
    categoryName: string;
    progressPercentage: number;
    lastAccessedAt: string | null;
    isCompleted: boolean;
  } | null;
}

const TutorialDetailModal: React.FC<TutorialDetailModalProps> = ({ isOpen, onClose, tutorial }) => {
  if (!tutorial) return null;

  const isCompleted = tutorial.isCompleted;
  const progressColor = isCompleted ? 'bg-green-500' : tutorial.progressPercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{tutorial.title}</DialogTitle>
          <DialogDescription className="text-base">
            Detailed information about your tutorial progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Section */}
          <div className={`rounded-lg p-6 ${isCompleted ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Learning Progress</p>
                <div className="flex items-center gap-3">
                  <span className={`text-5xl font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                    {tutorial.progressPercentage}%
                  </span>
                  {isCompleted ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-3 py-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Progress value={tutorial.progressPercentage} className="h-4" />
            <p className="text-xs text-gray-600 mt-2">
              {isCompleted
                ? 'Congratulations! You have completed this tutorial.'
                : `${100 - tutorial.progressPercentage}% remaining to complete`}
            </p>
          </div>

          {/* Tutorial Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Category</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{tutorial.categoryName}</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Last Accessed</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {tutorial.lastAccessedAt
                  ? new Date(tutorial.lastAccessedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Status Information */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-gray-900">Learning Status</p>
                <p className="text-sm text-gray-600">
                  {isCompleted
                    ? 'You have successfully completed this tutorial. Great work!'
                    : tutorial.progressPercentage >= 50
                    ? "You're making great progress! Keep going to complete the tutorial."
                    : 'Continue watching to make progress on this tutorial.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDetailModal;

