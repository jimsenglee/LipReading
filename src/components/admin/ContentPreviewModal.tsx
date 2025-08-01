import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Clock, 
  Target, 
  BookOpen, 
  HelpCircle, 
  CheckCircle,
  XCircle,
  Timer,
  Trophy,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (content: PreviewModalProps['content']) => void;
  content?: {
    id: string;
    title: string;
    description: string;
    detailedDescription?: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    type: 'tutorial' | 'quiz';
    status: 'draft' | 'published';
    createdAt: string;
    updatedAt: string;
    // Tutorial specific
    videos?: Array<{
      id: string;
      title: string;
      description: string;
      duration?: string;
      order: number;
    }>;
    learningObjectives?: string[];
    prerequisites?: string[];
    tags?: string[];
    // Quiz specific
    questions?: Array<{
      id: string;
      type: 'multiple-choice' | 'true-false' | 'fill-blank';
      question: string;
      points: number;
      order: number;
    }>;
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
    // Analytics
    stats?: {
      totalViews?: number;
      completionRate?: number;
      averageScore?: number;
      enrolledUsers?: number;
    };
  };
}

const ContentPreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, onEdit, content }) => {
  // Early return if content is null
  if (!content) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{content.title}</DialogTitle>
              <DialogDescription className="mt-2">
                Preview how this content appears to users
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className={getDifficultyColor(content.difficulty)}>
                {content.difficulty}
              </Badge>
              <Badge variant="outline" className={getStatusColor(content.status)}>
                {content.status}
              </Badge>
              <Badge variant="outline">
                {content.category}
              </Badge>
              <Badge variant="outline">
                {content.type}
              </Badge>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-gray-700">{content.description}</p>
              {content.detailedDescription && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{content.detailedDescription}</p>
                </div>
              )}
            </div>

            {/* Tutorial Content */}
            {content.type === 'tutorial' && (
              <>
                {/* Learning Objectives */}
                {content.learningObjectives && content.learningObjectives.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Learning Objectives
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {content.learningObjectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Prerequisites */}
                {content.prerequisites && content.prerequisites.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-orange-600" />
                        Prerequisites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {content.prerequisites.map((prereq, index) => (
                          <Badge key={index} variant="secondary">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Video Content */}
                {content.videos && content.videos.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Play className="h-5 w-5 text-purple-600" />
                        Video Lessons ({content.videos.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {content.videos.map((video) => (
                        <div key={video.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">{video.order}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{video.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                            {video.duration && (
                              <div className="flex items-center gap-1 mt-2">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{video.duration}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {content.tags && content.tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Quiz Content */}
            {content.type === 'quiz' && (
              <>
                {/* Quiz Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      Quiz Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {content.timeLimit && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">Time Limit</p>
                            <p className="text-xs text-gray-600">{content.timeLimit} minutes</p>
                          </div>
                        </div>
                      )}
                      
                      {content.passingScore && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">Passing Score</p>
                            <p className="text-xs text-gray-600">{content.passingScore}%</p>
                          </div>
                        </div>
                      )}
                      
                      {content.questions && (
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">Questions</p>
                            <p className="text-xs text-gray-600">{content.questions.length} questions</p>
                          </div>
                        </div>
                      )}
                      
                      {content.maxAttempts && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">Attempts</p>
                            <p className="text-xs text-gray-600">
                              {content.maxAttempts === 999 ? 'Unlimited' : content.maxAttempts}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Preview */}
                {content.questions && content.questions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Questions Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {content.questions.slice(0, 5).map((question) => (
                        <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Q{question.order}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {question.type.replace('-', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.points} pts
                                </Badge>
                              </div>
                              <p className="text-gray-900 font-medium">{question.question}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {content.questions.length > 5 && (
                        <div className="text-center py-2">
                          <Badge variant="secondary">
                            +{content.questions.length - 5} more questions
                          </Badge>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Total Questions:</span>
                          <span className="font-medium">{content.questions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Points:</span>
                          <span className="font-medium">
                            {content.questions.reduce((sum, q) => sum + q.points, 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Analytics */}
            {content.stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {content.stats.totalViews !== undefined && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{content.stats.totalViews}</p>
                        <p className="text-sm text-gray-600">Total Views</p>
                      </div>
                    )}
                    
                    {content.stats.enrolledUsers !== undefined && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{content.stats.enrolledUsers}</p>
                        <p className="text-sm text-gray-600">Enrolled Users</p>
                      </div>
                    )}
                    
                    {content.stats.completionRate !== undefined && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{content.stats.completionRate}%</p>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                      </div>
                    )}
                    
                    {content.stats.averageScore !== undefined && (
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{content.stats.averageScore}%</p>
                        <p className="text-sm text-gray-600">Average Score</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Created</p>
                    <p className="text-gray-900">{new Date(content.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Last Updated</p>
                    <p className="text-gray-900">{new Date(content.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Content ID</p>
                    <p className="text-gray-900 font-mono text-xs">{content.id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Status</p>
                    <Badge className={`mt-1 ${getStatusColor(content.status)}`}>
                      {content.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
          <Button 
            className="bg-primary"
            onClick={() => onEdit && onEdit(content)}
          >
            Edit Content
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewModal;
