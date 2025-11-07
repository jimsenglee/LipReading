import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Award, Target, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';

interface QuizDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: {
    id: number;
    publicId: string;
    quizTitle: string;
    categoryName: string;
    score: number;
    completionDate: string | null;
  } | null;
}

const QuizDetailModal: React.FC<QuizDetailModalProps> = ({ isOpen, onClose, quiz }) => {
  if (!quiz) return null;

  const passed = quiz.score >= 70;
  const scoreColor = quiz.score >= 90 ? 'text-green-600' : quiz.score >= 70 ? 'text-yellow-600' : 'text-red-600';
  const scoreBgColor = quiz.score >= 90 ? 'bg-green-50' : quiz.score >= 70 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{quiz.quizTitle}</DialogTitle>
          <DialogDescription className="text-base">
            Detailed information about your quiz attempt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Score Section */}
          <div className={`rounded-lg p-6 ${scoreBgColor} border-2 ${passed ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Your Score</p>
                <div className="flex items-center gap-3">
                  <span className={`text-5xl font-bold ${scoreColor}`}>
                    {quiz.score}%
                  </span>
                  {passed ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Passed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-300 px-3 py-1">
                      <XCircle className="h-4 w-4 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Passing Score: 70%</span>
                </div>
                <Progress value={quiz.score} className="w-32 h-3" />
              </div>
            </div>
          </div>

          {/* Quiz Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Category</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{quiz.categoryName}</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Completed</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {quiz.completionDate
                  ? new Date(quiz.completionDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-gray-900">Performance Level</p>
                <p className="text-sm text-gray-600">
                  {quiz.score >= 90
                    ? 'Excellent! You mastered this quiz.'
                    : quiz.score >= 70
                    ? 'Good job! You passed this quiz.'
                    : 'Keep practicing to improve your score.'}
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

export default QuizDetailModal;

