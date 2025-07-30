import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  Video, 
  VideoOff, 
  Play, 
  Pause, 
  Square,
  Settings,
  Eye,
  Target,
  Activity,
  Clock,
  Volume2,
  Download,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface RealTimeTranscriptionProps {
  onTranscriptionUpdate?: (text: string) => void;
}

type TranscriptionStatus = 'inactive' | 'connecting' | 'active' | 'paused' | 'finished' | 'error';

const RealTimeTranscription: React.FC<RealTimeTranscriptionProps> = ({ 
  onTranscriptionUpdate 
}) => {
  const [status, setStatus] = useState<TranscriptionStatus>('inactive');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const feedbackToast = useFeedbackToast();

  // Mock transcription data for demonstration
  const mockPhrases = [
    "Hello, welcome to the lip reading practice session.",
    "This is a demonstration of real-time transcription.",
    "Please speak clearly and face the camera directly.",
    "The system is analyzing your lip movements.",
    "Your confidence score is improving with practice.",
    "Try speaking at a moderate pace for best results."
  ];

  // Cleanup function
  const cleanup = () => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }
  };

  // Start session timer
  const startSessionTimer = () => {
    sessionIntervalRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
  };

  // Simulate transcription process
  const simulateTranscription = () => {
    let phraseIndex = 0;
    let wordIndex = 0;
    let currentText = '';
    
    transcriptionIntervalRef.current = setInterval(() => {
      if (phraseIndex < mockPhrases.length) {
        const currentPhrase = mockPhrases[phraseIndex];
        const words = currentPhrase.split(' ');
        
        if (wordIndex < words.length) {
          currentText += (currentText ? ' ' : '') + words[wordIndex];
          setTranscriptionText(currentText);
          setConfidenceScore(Math.floor(Math.random() * 20) + 80); // 80-100%
          onTranscriptionUpdate?.(currentText);
          wordIndex++;
        } else {
          phraseIndex++;
          wordIndex = 0;
          if (phraseIndex < mockPhrases.length) {
            currentText += ' ';
          }
        }
      }
    }, 1500); // Word every 1.5 seconds
  };

  // Start transcription
  const handleStartTranscription = async () => {
    setStatus('connecting');
    setStreamError(null);
    
    try {
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false 
      });
      
      // Check if webcam is detected
      if (!stream.getVideoTracks().length) {
        throw new Error('No webcam detected. Please connect a camera and try again.');
      }
      
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsVideoEnabled(true);
      setStatus('active');
      setTranscriptionText('');
      setSessionTime(0);
      
      // Start timers and simulation
      startSessionTimer();
      simulateTranscription();
      
      feedbackToast.success(
        "Transcription Started",
        "Lip reading session is now active"
      );
      
    } catch (error: any) {
      setStatus('error');
      setStreamError(error.message);
      
      if (error.name === 'NotAllowedError') {
        feedbackToast.error(
          "Camera Access Denied",
          "Webcam access is required for real-time transcription. Please allow access in your browser settings."
        );
      } else if (error.name === 'NotFoundError') {
        feedbackToast.error(
          "No Webcam Found",
          "No webcam detected. Please connect a camera and try again."
        );
      } else {
        feedbackToast.error(
          "Connection Failed",
          "Could not connect to the transcription service. Please check your internet connection and try again."
        );
      }
    }
  };

  // Pause transcription
  const handlePauseTranscription = () => {
    setStatus('paused');
    if (transcriptionIntervalRef.current) {
      clearInterval(transcriptionIntervalRef.current);
      transcriptionIntervalRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
    
    feedbackToast.info("Session Paused", "Transcription has been paused");
  };

  // Resume transcription
  const handleResumeTranscription = () => {
    setStatus('active');
    startSessionTimer();
    simulateTranscription();
    
    feedbackToast.info("Session Resumed", "Transcription has been resumed");
  };

  // Stop transcription
  const handleStopTranscription = () => {
    setStatus('finished');
    setIsVideoEnabled(false);
    cleanup();
    
    feedbackToast.success(
      "Session Complete",
      "Transcription saved to your history"
    );
  };

  // Copy transcription to clipboard
  const handleCopyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcriptionText);
      feedbackToast.success("Copied!", "Transcription copied to clipboard");
    } catch (error) {
      feedbackToast.error("Copy Failed", "Could not copy to clipboard");
    }
  };

  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-blue-600' };
      case 'active':
        return { text: 'Active', color: 'text-green-600' };
      case 'paused':
        return { text: 'Paused', color: 'text-yellow-600' };
      case 'finished':
        return { text: 'Finished', color: 'text-gray-600' };
      case 'error':
        return { text: 'Error', color: 'text-red-600' };
      default:
        return { text: 'Ready', color: 'text-gray-600' };
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const statusDisplay = getStatusDisplay();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Feed */}
      <div className="lg:col-span-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-primary">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Camera Feed
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                <span className={statusDisplay.color}>{statusDisplay.text}</span>
              </div>
            </CardTitle>
            <CardDescription>
              Position your face in the center of the frame for optimal results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Container */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
              {isVideoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  {streamError ? (
                    <div className="text-center space-y-4">
                      <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                      <div>
                        <p className="text-red-600 font-medium">Camera Error</p>
                        <p className="text-sm text-gray-600 mt-1">{streamError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Video className="h-16 w-16 text-primary mx-auto" />
                      <div>
                        <p className="text-primary font-medium">Ready to Start</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Click "Start Recording" to begin
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Recording Indicator */}
              {status === 'active' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
              
              {/* Session Timer */}
              {(status === 'active' || status === 'paused') && (
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatTime(sessionTime)}
                  </div>
                </div>
              )}
              
              {/* Confidence Score */}
              {status === 'active' && confidenceScore > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg">
                  <div className="text-xs">Confidence</div>
                  <div className="text-lg font-bold">{confidenceScore}%</div>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {status === 'inactive' || status === 'error' ? (
                <Button 
                  onClick={handleStartTranscription}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                  size="lg"
                >
                  <Play className="h-5 w-5" />
                  Start Recording
                </Button>
              ) : status === 'active' ? (
                <>
                  <Button 
                    onClick={handlePauseTranscription}
                    variant="outline"
                    className="flex items-center gap-2 border-primary/20 text-primary"
                    size="lg"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                  <Button 
                    onClick={handleStopTranscription}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                </>
              ) : status === 'paused' ? (
                <>
                  <Button 
                    onClick={handleResumeTranscription}
                    className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                    size="lg"
                  >
                    <Play className="h-5 w-5" />
                    Resume
                  </Button>
                  <Button 
                    onClick={handleStopTranscription}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <Square className="h-5 w-5" />
                    Finish
                  </Button>
                </>
              ) : null}
              
              <Button 
                variant="outline" 
                className="border-primary/20 text-primary hover:bg-primary/10"
                size="lg"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcription Panel */}
      <div className="space-y-6">
        {/* Live Transcription */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Target className="h-5 w-5" />
              Live Transcription
            </CardTitle>
            <CardDescription>Real-time lip reading results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-32 max-h-64 overflow-y-auto p-4 bg-primary/5 border border-primary/20 rounded-lg">
                {transcriptionText ? (
                  <p className="text-gray-800 leading-relaxed">{transcriptionText}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    {status === 'inactive' ? 'Start recording to see transcription...' :
                     status === 'connecting' ? 'Connecting to transcription service...' :
                     'Transcription will appear here...'}
                  </p>
                )}
              </div>
              
              {confidenceScore > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Confidence</span>
                    <span>{confidenceScore}%</span>
                  </div>
                  <Progress value={confidenceScore} className="h-2" />
                </div>
              )}
              
              {transcriptionText && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyTranscription}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary text-sm">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Duration</span>
                <span className="font-medium">{formatTime(sessionTime)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Words Detected</span>
                <span className="font-medium">{transcriptionText.split(' ').length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Avg. Confidence</span>
                <span className="font-medium">{confidenceScore}%</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge 
                  variant="outline" 
                  className={`${
                    status === 'active' 
                      ? 'border-green-200 text-green-700 bg-green-50' 
                      : status === 'error'
                        ? 'border-red-200 text-red-700 bg-red-50'
                        : 'border-gray-200 text-gray-700 bg-gray-50'
                  }`}
                >
                  {statusDisplay.text}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeTranscription;