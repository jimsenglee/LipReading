import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import BackButton from '@/components/ui/back-button';
import TranscriptionOutput from '@/components/transcription/TranscriptionOutput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  FileVideo,
  Calendar,
  Clock,
  Target,
  Trash2,
  Share2,
  BookOpen
} from 'lucide-react';

interface TranscriptionSegment {
  timestamp: number;
  text: string;
  confidence?: number;
}

interface TranscriptionRecord {
  id: string;
  fileName: string;
  videoSrc?: string;
  transcriptionSegments: TranscriptionSegment[];
  createdAt: Date;
  duration: number;
  overallConfidence: number;
  type: 'realtime' | 'upload';
}

const TranscriptionResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcription, setTranscription] = useState<TranscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const feedbackToast = useFeedbackToast();

  // Mock data - in real app, this would fetch from API
  const mockTranscriptions: TranscriptionRecord[] = [
    {
      id: '1',
      fileName: 'presentation_video.mp4',
      videoSrc: '/placeholder.mp4', // Mock video source
      transcriptionSegments: [
        {
          timestamp: 0,
          text: "Welcome everyone to today's presentation on artificial intelligence and machine learning.",
          confidence: 92
        },
        {
          timestamp: 8,
          text: "We'll be covering the latest developments in neural networks and deep learning algorithms.",
          confidence: 88
        },
        {
          timestamp: 16,
          text: "First, let's discuss the fundamentals of natural language processing.",
          confidence: 95
        },
        {
          timestamp: 24,
          text: "The accuracy of lip reading technology has improved significantly over the past few years.",
          confidence: 91
        },
        {
          timestamp: 32,
          text: "Our system can now achieve over 90% accuracy in controlled environments.",
          confidence: 89
        }
      ],
      createdAt: new Date('2024-01-15T10:30:00'),
      duration: 45,
      overallConfidence: 91,
      type: 'upload'
    },
    {
      id: '2',
      fileName: 'real_time_session_20240115',
      transcriptionSegments: [
        {
          timestamp: 0,
          text: "Hello, this is a real-time transcription test session.",
          confidence: 87
        },
        {
          timestamp: 5,
          text: "The system is working well and capturing my speech accurately.",
          confidence: 93
        },
        {
          timestamp: 12,
          text: "This technology has many applications in accessibility and communication.",
          confidence: 89
        }
      ],
      createdAt: new Date('2024-01-15T14:20:00'),
      duration: 20,
      overallConfidence: 89,
      type: 'realtime'
    }
  ];

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transcription', href: '/transcription' },
    { title: 'History', href: '/transcription-history' },
    { title: 'Result' }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchTranscription = async () => {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const found = mockTranscriptions.find(t => t.id === id);
      if (found) {
        setTranscription(found);
      } else {
        feedbackToast.error(
          "Transcription Not Found",
          "The requested transcription could not be found."
        );
        navigate('/transcription-history');
      }
      
      setLoading(false);
    };

    if (id) {
      fetchTranscription();
    }
  }, [id, navigate, feedbackToast]);

  const handleTranscriptionUpdate = (segments: TranscriptionSegment[]) => {
    if (transcription) {
      setTranscription({
        ...transcription,
        transcriptionSegments: segments
      });
    }
  };

  const handleDelete = () => {
    // Simulate deletion
    feedbackToast.success(
      "Transcription Deleted",
      "The transcription has been removed from your history."
    );
    navigate('/transcription-history');
  };

  const handleShare = () => {
    // Simulate sharing functionality
    feedbackToast.info(
      "Share Link Generated",
      "A shareable link has been copied to your clipboard."
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600">Loading transcription...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="space-y-6 animate-fade-in">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transcription Not Found</h3>
          <p className="text-gray-600 mb-6">
            The requested transcription could not be found or may have been deleted.
          </p>
          <Button 
            onClick={() => navigate('/transcription-history')}
            className="bg-primary hover:bg-primary/90"
          >
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <AnimatedBreadcrumb items={breadcrumbItems} />
          <BackButton />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Transcription Result
          </h1>
          <p className="text-gray-600">
            View and edit your lip reading transcription
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Transcription Metadata */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FileVideo className="h-5 w-5" />
            {transcription.fileName}
          </CardTitle>
          <CardDescription>
            Created on {transcription.createdAt.toLocaleDateString()} at {transcription.createdAt.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{formatDuration(transcription.duration)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-medium">{transcription.overallConfidence}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <Badge 
                  variant="outline"
                  className={`${
                    transcription.type === 'realtime' 
                      ? 'border-blue-200 text-blue-700 bg-blue-50' 
                      : 'border-green-200 text-green-700 bg-green-50'
                  }`}
                >
                  {transcription.type === 'realtime' ? 'Real-time' : 'File Upload'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileVideo className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Segments</p>
                <p className="font-medium">{transcription.transcriptionSegments.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcription Output Component */}
      <TranscriptionOutput
        videoSrc={transcription.videoSrc}
        transcriptionSegments={transcription.transcriptionSegments}
        onTranscriptionUpdate={handleTranscriptionUpdate}
      />
    </div>
  );
};

export default TranscriptionResult;