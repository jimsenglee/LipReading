import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Video, 
  VideoOff, 
  Play, 
  Pause, 
  Square,
  Eye,
  Target,
  Activity,
  Clock,
  Volume2,
  Download,
  Copy,
  AlertTriangle,
  RefreshCw,
  Save,
  Mic
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

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
  const [sessionTime, setSessionTime] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [collectedFrames, setCollectedFrames] = useState<Blob[]>([]);
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCollectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameProcessingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  
  const feedbackToast = useFeedbackToast();

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
    
    if (frameCollectionIntervalRef.current) {
      clearInterval(frameCollectionIntervalRef.current);
      frameCollectionIntervalRef.current = null;
    }
    
    if (frameProcessingIntervalRef.current) {
      clearInterval(frameProcessingIntervalRef.current);
      frameProcessingIntervalRef.current = null;
    }
  };

  // Start session timer
  const startSessionTimer = () => {
    sessionIntervalRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
  };

  // Detect facial/mouth movement using frame difference in facial region only
  const detectFacialMovement = (): boolean => {
    if (!videoRef.current || !canvasRef.current) {
      return false;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx || video.readyState < 2) {
        return false;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // focus on facial/mouth region only (center-upper portion of frame)
      // typical face position: center horizontally, upper 40% vertically
      const faceRegion = {
        x: Math.floor(canvas.width * 0.25),      // start at 25% from left
        y: Math.floor(canvas.height * 0.15),     // start at 15% from top
        width: Math.floor(canvas.width * 0.5),   // 50% width (center region)
        height: Math.floor(canvas.height * 0.4)  // 40% height (upper-mid region)
      };
      
      // extract only the facial region
      const currentFrame = ctx.getImageData(
        faceRegion.x, 
        faceRegion.y, 
        faceRegion.width, 
        faceRegion.height
      );
      
      if (previousFrameRef.current) {
        // calculate frame difference only in facial region
        let diff = 0;
        const prevData = previousFrameRef.current.data;
        const currData = currentFrame.data;
        const pixelCount = faceRegion.width * faceRegion.height;
        
        // sample pixels in facial region for performance
        for (let i = 0; i < prevData.length; i += 12) { // sample every 3rd pixel
          const pixelDiff = Math.abs(prevData[i] - currData[i]) +
                           Math.abs(prevData[i + 1] - currData[i + 1]) +
                           Math.abs(prevData[i + 2] - currData[i + 2]);
          diff += pixelDiff;
        }
        
        // normalize by pixel count and use higher threshold for facial movement
        const normalizedDiff = diff / (pixelCount / 12);
        const movementThreshold = 15; // threshold for facial/mouth movement
        const isMoving = normalizedDiff > movementThreshold;
        
        console.log('[RealTimeTranscription] Facial region difference:', normalizedDiff.toFixed(2), '| Threshold:', movementThreshold, '| MOUTH SPEAKING:', isMoving ? 'YES' : 'NO');
        
        previousFrameRef.current = currentFrame;
        return isMoving;
      } else {
        previousFrameRef.current = currentFrame;
        return false;
      }
    } catch (error) {
      console.error('[RealTimeTranscription] Facial movement detection error:', error);
      return false;
    }
  };

  // Collect frame for batch processing
  const collectFrame = async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current || status !== 'active') {
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState < 2) {
        return null;
      }
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('[RealTimeTranscription] Frame collection error:', error);
      return null;
    }
  };

  // Process collected frames as video (like colab cell)
  const processCollectedFrames = async () => {
    if (collectedFrames.length < 25) { // need at least 1 second at 25fps
      console.log('[RealTimeTranscription] Not enough frames collected yet:', collectedFrames.length);
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[RealTimeTranscription] Processing', collectedFrames.length, 'frames as video...');
      
      // create video from frames using FormData
      const formData = new FormData();
      
      // send frames as individual files (backend will combine them)
      collectedFrames.forEach((blob, index) => {
        formData.append('frames', blob, `frame_${index}.jpg`);
      });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/realtime`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[RealTimeTranscription] ===== BACKEND RESPONSE =====');
      console.log('[RealTimeTranscription] Full response:', JSON.stringify(result, null, 2));
      console.log('[RealTimeTranscription] Success:', result.success);
      console.log('[RealTimeTranscription] Data:', result.data);
      
      if (result.success && result.data?.transcription) {
        const transcribed = result.data.transcription.trim();
        console.log('[RealTimeTranscription] ===== TRANSCRIPTION RESULT =====');
        console.log('[RealTimeTranscription] Transcribed text:', transcribed);
        console.log('[RealTimeTranscription] ===== END TRANSCRIPTION =====');
        
        // append to existing transcription
        setTranscriptionText(prev => {
          const newText = prev ? `${prev} ${transcribed}` : transcribed;
          console.log('[RealTimeTranscription] Updated transcription text:', newText);
          if (onTranscriptionUpdate) {
            onTranscriptionUpdate(newText);
          }
          return newText;
        });
        
        // clear collected frames after processing
        setCollectedFrames([]);
        } else {
        console.warn('[RealTimeTranscription] No transcription in response or processing failed');
        console.warn('[RealTimeTranscription] Response structure:', result);
      }
    } catch (error) {
      console.error('[RealTimeTranscription] Frame processing error:', error);
      feedbackToast.error("Processing Error", "Failed to process frames. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time transcription processing - collect frames continuously
  const processTranscription = async () => {
    console.log('[RealTimeTranscription] Starting transcription processing...');
    console.log('[RealTimeTranscription] Camera stream active, collecting frames...');
    
    // detect speech/movement every 200ms
    const detectionInterval = setInterval(() => {
      const isMoving = detectFacialMovement();
      setIsDetectingSpeech(isMoving);
    }, 200);
    
    // collect frames continuously at 25fps (every 40ms)
    frameCollectionIntervalRef.current = setInterval(async () => {
      if (status === 'active' && isRecording) {
        const frame = await collectFrame();
        if (frame) {
          setCollectedFrames(prev => {
            const newFrames = [...prev, frame];
            // keep only last 75 frames (3 seconds at 25fps)
            return newFrames.slice(-75);
          });
        }
      }
    }, 40); // 25fps
    
    // process collected frames every 2 seconds
    frameProcessingIntervalRef.current = setInterval(() => {
      if (collectedFrames.length >= 25) {
        processCollectedFrames();
      }
    }, 2000);
    
    // cleanup detection interval on unmount
    return () => {
      clearInterval(detectionInterval);
    };
  };

  // Start transcription
  const handleStartTranscription = async () => {
    setStatus('connecting');
    setStreamError(null);
    setCollectedFrames([]);
    setIsRecording(false);
    
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
      
      console.log('[RealTimeTranscription] Camera stream obtained:', stream);
      console.log('[RealTimeTranscription] Video tracks:', stream.getVideoTracks().length);
      
      // attach stream to video element - use retry mechanism
      const attachStream = () => {
      if (videoRef.current) {
          console.log('[RealTimeTranscription] Setting video srcObject...');
        videoRef.current.srcObject = stream;
          
          // ensure video element is visible
          videoRef.current.style.display = 'block';
          videoRef.current.style.visibility = 'visible';
      
          // play video
          videoRef.current.play()
            .then(() => {
              console.log('[RealTimeTranscription] Video playing successfully');
      setIsVideoEnabled(true);
      setStatus('active');
              setIsRecording(true);
      setTranscriptionText('');
      setSessionTime(0);
      
              // Start timers and real-time transcription processing
      startSessionTimer();
              processTranscription();
      
      feedbackToast.success(
        "Transcription Started",
                "Lip reading session is now active. Speak clearly to the camera."
              );
            })
            .catch(err => {
              console.error('[RealTimeTranscription] Error playing video:', err);
            });
        } else {
          console.warn('[RealTimeTranscription] Video ref not ready, retrying...');
          setTimeout(attachStream, 100);
        }
      };
      
      // try immediately, then retry if needed
      attachStream();
      
    } catch (error: unknown) {
      console.error('[RealTimeTranscription] Error accessing webcam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStreamError(errorMessage);
      setStatus('error');
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        feedbackToast.error(
          "Camera Permission Denied",
          "Please allow camera access in your browser settings"
        );
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        feedbackToast.error(
          "No Camera Found",
          "No camera device detected. Please connect a camera and try again."
        );
      } else {
        feedbackToast.error(
          "Camera Access Error",
          `Failed to access camera: ${errorMessage}`
        );
      }
    }
  };

  // Pause transcription
  const handlePauseTranscription = () => {
    setStatus('paused');
    setIsRecording(false);
    if (frameCollectionIntervalRef.current) {
      clearInterval(frameCollectionIntervalRef.current);
      frameCollectionIntervalRef.current = null;
    }
    if (frameProcessingIntervalRef.current) {
      clearInterval(frameProcessingIntervalRef.current);
      frameProcessingIntervalRef.current = null;
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
    setIsRecording(true);
    startSessionTimer();
    processTranscription();
    
    feedbackToast.info("Session Resumed", "Transcription has been resumed");
  };

  // Stop transcription
  const handleStopTranscription = () => {
    setIsRecording(false);
    // process any remaining frames before stopping
    if (collectedFrames.length > 0) {
      processCollectedFrames().then(() => {
        setShowFinishDialog(true);
      });
    } else {
      setShowFinishDialog(true);
    }
  };

  const handleFinishConfirm = () => {
    setStatus('finished');
    setIsVideoEnabled(false);
    setIsRecording(false);
    cleanup();
    setShowFinishDialog(false);
    setCollectedFrames([]);
    
    feedbackToast.success(
      "Session Complete",
      "Transcription saved to your history"
    );
  };

  const handleRestart = () => {
    setShowFinishDialog(false);
    cleanup();
    setTranscriptionText('');
    setSessionTime(0);
    setStatus('inactive');
    setIsVideoEnabled(false);
    setIsRecording(false);
    setCollectedFrames([]);
    previousFrameRef.current = null;
    
    feedbackToast.info("Session Reset", "Ready to start a new transcription session");
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

  // Save transcription
  const handleSaveTranscription = async () => {
    if (!transcriptionText.trim()) {
      feedbackToast.error("No Text", "No transcription to save");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Real-time Transcription - ${new Date().toLocaleString()}`,
          content_text: transcriptionText
        })
      });

      const result = await response.json();
      if (result.success) {
        feedbackToast.success("Saved!", "Transcription saved successfully");
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error('[RealTimeTranscription] Save error:', error);
      feedbackToast.error("Save Failed", "Could not save transcription");
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
              {/* Always render video element, just hide when not enabled */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                className={`w-full h-full object-cover ${isVideoEnabled ? 'block' : 'hidden'}`}
                />
              {!isVideoEnabled && (
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
              {status === 'active' && isRecording && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-medium">Recording</span>
                </div>
              )}
              
              {/* Speech Detection Indicator */}
              {status === 'active' && (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full flex items-center gap-2 ${
                  isDetectingSpeech ? 'bg-green-500/90' : 'bg-gray-500/90'
                } text-white`}>
                  <Mic className={`h-3 w-3 ${isDetectingSpeech ? 'animate-pulse' : ''}`} />
                  <span className="text-xs">
                    {isDetectingSpeech ? 'Speaking Detected' : 'Listening...'}
                  </span>
                </div>
              )}
              
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="absolute bottom-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <Activity className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Processing...</span>
                </div>
              )}
              
              {/* Session Timer */}
              {status === 'active' || status === 'paused' ? (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">{formatTime(sessionTime)}</span>
                  </div>
              ) : null}
              
              {/* Frames Collected Indicator */}
              {status === 'active' && (
                <div className="absolute bottom-16 left-4 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs">
                  Frames: {collectedFrames.length}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex gap-2">
              {status === 'inactive' || status === 'error' ? (
                <Button 
                  onClick={handleStartTranscription}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              ) : status === 'active' ? (
                <>
                  <Button 
                    onClick={handlePauseTranscription}
                    variant="outline"
                    className="flex-1"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button 
                    onClick={handleStopTranscription}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              ) : status === 'paused' ? (
                <>
                  <Button 
                    onClick={handleResumeTranscription}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                  <Button 
                    onClick={handleStopTranscription}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              ) : status === 'finished' ? (
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={handleRestart}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start New Session
                  </Button>
                  {transcriptionText && (
                    <>
                      <Button 
                        onClick={handleSaveTranscription}
                        variant="outline"
                        className="flex-1"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button 
                        onClick={handleCopyTranscription}
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                  </Button>
                </>
                  )}
                </div>
              ) : null}
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
                     status === 'active' ? 'Collecting frames... Speak clearly to the camera.' :
                     'Transcription will appear here...'}
                  </p>
                )}
              </div>
              
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
                    onClick={handleSaveTranscription}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
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
                <span className="font-medium">{transcriptionText.split(' ').filter(w => w.trim()).length}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Frames Collected</span>
                <span className="font-medium">{collectedFrames.length}</span>
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

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Transcription Session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">Your transcription will be saved. Would you like to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Finish and save the current transcription</li>
                  <li>Restart with a new session</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowFinishDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleRestart}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart Session
            </Button>
            <AlertDialogAction
              onClick={handleFinishConfirm}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              Finish & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RealTimeTranscription;
