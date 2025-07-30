import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  Upload, 
  FileVideo, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';

interface VideoFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number;
  error?: string;
  transcription?: string;
  confidence?: number;
}

interface VideoUploadZoneProps {
  onTranscriptionComplete: (transcription: string, file: File) => void;
}

const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({ onTranscriptionComplete }) => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const feedbackToast = useFeedbackToast();

  // File validation constants
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];

  // File validation
  const validateFile = (file: File): string | null => {
    // File type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported file type. Please upload MP4, WebM, AVI, or MOV files.";
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds the maximum limit of 100MB.";
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: VideoFile[] = [];
    
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      
      const videoFile: VideoFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      };
      
      newFiles.push(videoFile);
    });

    setVideoFiles(prev => [...prev, ...newFiles]);

    // Process valid files
    newFiles.forEach(videoFile => {
      if (videoFile.status === 'pending') {
        processVideoFile(videoFile.id);
      }
    });
  }, []);

  // Process video file
  const processVideoFile = async (fileId: string) => {
    setVideoFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f)
    );

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setVideoFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, progress } : f)
        );
      }

      // Switch to analyzing
      setVideoFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: 'analyzing', progress: 0 } : f)
      );

      // Simulate analysis progress
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setVideoFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, progress } : f)
        );
      }

      // Complete analysis
      const mockTranscription = "This is a sample transcription from your uploaded video file. The lip reading AI has analyzed the visual speech patterns and generated this text with high accuracy.";
      const mockConfidence = Math.floor(Math.random() * 15) + 85; // 85-100%

      setVideoFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'complete', 
          progress: 100,
          transcription: mockTranscription,
          confidence: mockConfidence
        } : f)
      );

      const file = videoFiles.find(f => f.id === fileId)?.file;
      if (file) {
        onTranscriptionComplete(mockTranscription, file);
      }

      feedbackToast.success(
        "Analysis Complete",
        "Your video has been successfully processed."
      );

    } catch (error) {
      setVideoFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: "Processing failed. Please try again."
        } : f)
      );
      
      feedbackToast.error(
        "Processing Failed",
        "An error occurred while processing your video."
      );
    }
  };

  // Remove file from queue
  const removeFile = (fileId: string) => {
    setVideoFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Cancel upload
  const cancelUpload = (fileId: string) => {
    setVideoFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: 'error', error: "Cancelled" } : f)
    );
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const getStatusIcon = (status: VideoFile['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <FileVideo className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (file: VideoFile) => {
    switch (file.status) {
      case 'pending':
        return 'Pending';
      case 'uploading':
        return `Uploading ${file.progress}%`;
      case 'analyzing':
        return `Analyzing ${file.progress}%`;
      case 'complete':
        return `Complete (${file.confidence}% confidence)`;
      case 'error':
        return file.error || 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Upload className="h-5 w-5" />
          Video Upload & Analysis
        </CardTitle>
        <CardDescription>
          Upload video files for AI-powered lip reading transcription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Guidelines */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-medium text-primary mb-2">Optimal Video Quality Guidelines:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Face should be clearly visible and well-lit</li>
            <li>• Speaker should face the camera directly</li>
            <li>• Avoid background noise and distractions</li>
            <li>• Recommended resolution: 720p or higher</li>
            <li>• Supported formats: MP4, WebM, AVI, MOV (max 100MB)</li>
          </ul>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${dragOver 
              ? 'border-primary bg-primary/10 scale-105' 
              : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('video-upload-input')?.click()}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">
                Drop your video files here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse your files
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                Select Files
              </Button>
            </div>
          </div>

          <input
            id="video-upload-input"
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* File Queue */}
        {videoFiles.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-primary">Processing Queue</h4>
            <div className="space-y-3">
              {videoFiles.map((videoFile) => (
                <div 
                  key={videoFile.id} 
                  className="flex items-center gap-4 p-4 border border-primary/10 rounded-lg bg-white"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(videoFile.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{videoFile.file.name}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          videoFile.status === 'complete' 
                            ? 'border-green-200 text-green-700 bg-green-50'
                            : videoFile.status === 'error'
                              ? 'border-red-200 text-red-700 bg-red-50'
                              : 'border-blue-200 text-blue-700 bg-blue-50'
                        }`}
                      >
                        {getStatusText(videoFile)}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {(videoFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                    
                    {(videoFile.status === 'uploading' || videoFile.status === 'analyzing') && (
                      <Progress value={videoFile.progress} className="h-2" />
                    )}
                    
                    {videoFile.status === 'error' && videoFile.error && (
                      <p className="text-xs text-red-600 mt-1">{videoFile.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {videoFile.status === 'complete' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    {(videoFile.status === 'uploading' || videoFile.status === 'analyzing') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelUpload(videoFile.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(videoFile.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploadZone;