import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import BackButton from '@/components/ui/back-button';
import TranscriptionOutput from '@/components/transcription/TranscriptionOutput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useTranscriptionById, useDeleteTranscription } from '@/services/transcription';
import { API_BASE_URL } from '@/lib/constants';
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
  const feedbackToast = useFeedbackToast();
  
  // Use real API hook
  const { data: transcriptionData, isLoading: loading, error } = useTranscriptionById(Number(id));
  const deleteMutation = useDeleteTranscription();

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transcription', href: '/transcription' },
    { title: 'History', href: '/transcription-history' },
    { title: 'Result' }
  ];

  // Transform API data to component format
  useEffect(() => {
    if (transcriptionData) {
      // Parse transcription text into segments (simple split by sentences for now)
      const transcriptionText = transcriptionData.contentText || '';
      const segments: TranscriptionSegment[] = transcriptionText.split('. ').map((text, idx) => ({
        timestamp: idx * 8,
        text: text.trim(),
      })).filter(s => s.text.length > 0);
      
      setTranscription({
        id: transcriptionData.id.toString(),
        fileName: transcriptionData.title || 'Untitled Transcription',
        videoSrc: transcriptionData.videoSourcePath ? `${API_BASE_URL}${transcriptionData.videoSourcePath}` : undefined,
        transcriptionSegments: segments,
        createdAt: transcriptionData.creationDate ? new Date(transcriptionData.creationDate) : new Date(),
        duration: transcriptionData.durationSeconds || 0,
        overallConfidence: 0,
        type: 'upload'
      });
    }
  }, [transcriptionData]);

  const handleTranscriptionUpdate = (segments: TranscriptionSegment[]) => {
    if (transcription) {
      setTranscription({
        ...transcription,
        transcriptionSegments: segments
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteMutation.mutateAsync(Number(id));
      feedbackToast.success(
        "Transcription Deleted",
        "The transcription has been removed from your history."
      );
      navigate('/transcription-history');
    } catch (error: any) {
      feedbackToast.error(
        "Delete Failed",
        error?.message || "Failed to delete transcription"
      );
    }
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