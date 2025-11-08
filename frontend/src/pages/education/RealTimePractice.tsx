import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Camera, 
  Play, 
  Square, 
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle,
  VideoOff,
  Shield,
  Mic,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { usePracticeWords, PracticeWord as ApiPracticeWord } from '@/services';
import { API_BASE_URL } from '@/lib/constants';
import ReactPlayer from 'react-player';
import { faceDetectionService, FaceDetectionResult } from '@/lib/faceDetection';

// type assertion for ReactPlayer to fix TypeScript issues
const ReactPlayerComponent = ReactPlayer as any;

interface FeedbackIndicator {
  aspect: string;
  status: 'good' | 'needs-work' | 'excellent';
  description: string;
}

const RealTimePractice = () => {
  const { toast } = useToast();
  const videoRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null); // container for reference video (like VideoPlayerPage)
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const correctSoundRef = useRef<HTMLAudioElement>(null);
  const wrongSoundRef = useRef<HTMLAudioElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<ApiPracticeWord | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [lastTranscription, setLastTranscription] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackIndicator[]>([]);
  const [videoEnded, setVideoEnded] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    wordsAttempted: 0,
    accuracy: 0,
    timeSpent: 0
  });

  // frame collection for batch processing (need 25+ frames)
  const frameBufferRef = useRef<Blob[]>([]);
  const frameCollectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFaceDetectionRef = useRef<FaceDetectionResult | null>(null);
  const isPracticingRef = useRef<boolean>(false); // ref to track practice state for intervals

  // fetch practice words from api
  const { data: practiceWordsData, isLoading: isLoadingWords } = usePracticeWords({
    status: 'active',
    per_page: 100
  });
  
  // debug: log practice words data
  useEffect(() => {
    if (practiceWordsData) {
      console.log('[RealTimePractice] ===== PRACTICE WORDS DATA =====');
      console.log('[RealTimePractice] Success:', practiceWordsData.success);
      console.log('[RealTimePractice] Words count:', practiceWordsData.data?.length || 0);
      if (practiceWordsData.data && practiceWordsData.data.length > 0) {
        console.log('[RealTimePractice] First word sample:', {
          id: practiceWordsData.data[0].id,
          word: practiceWordsData.data[0].word,
          videoPath: practiceWordsData.data[0].videoPath,
          category: practiceWordsData.data[0].category
        });
      }
      console.log('[RealTimePractice] ===== END PRACTICE WORDS DATA =====');
    }
  }, [practiceWordsData]);
  
  const apiWords: ApiPracticeWord[] = practiceWordsData?.data || [];
  const categories = ['All', ...Array.from(new Set(apiWords.map(w => w.category)))];

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Real-Time Practice' }
  ];

  const filteredWords = apiWords.filter(word => {
    const matchesCategory = selectedCategory === 'All' || word.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.phonetics?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // load sound effects
  useEffect(() => {
    correctSoundRef.current = new Audio(`${API_BASE_URL}/uploads/sound/correct.wav`);
    wrongSoundRef.current = new Audio(`${API_BASE_URL}/uploads/sound/wrong.wav`);
    return () => {
      correctSoundRef.current?.pause();
      wrongSoundRef.current?.pause();
    };
  }, []);

  // initialize face detection service
  useEffect(() => {
    faceDetectionService.initialize().catch(err => {
      console.error('[RealTimePractice] Face detection initialization error:', err);
    });

    return () => {
      faceDetectionService.dispose();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (frameCollectionIntervalRef.current) {
        clearInterval(frameCollectionIntervalRef.current);
      }
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [stream]);

  const enableWebcam = async () => {
    try {
      console.log('[RealTimePractice] ===== ENABLING WEBCAM =====');
      console.log('[RealTimePractice] Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('[RealTimePractice] Camera access granted');
      console.log('[RealTimePractice] Stream tracks:', mediaStream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
      setStream(mediaStream);
      setWebcamEnabled(true); // set this first so video element renders
      
      // wait for video element to be rendered
      const attachStream = () => {
      if (userVideoRef.current) {
          console.log('[RealTimePractice] Video element found, attaching stream...');
        userVideoRef.current.srcObject = mediaStream;
          
          userVideoRef.current.play()
            .then(() => {
              console.log('[RealTimePractice] Video playing successfully');
              console.log('[RealTimePractice] Video dimensions:', {
                videoWidth: userVideoRef.current?.videoWidth,
                videoHeight: userVideoRef.current?.videoHeight
              });
      toast({
        title: "Webcam Enabled",
        description: "Camera access granted successfully"
      });
            })
            .catch(err => {
              console.error('[RealTimePractice] Error playing video:', err);
              toast({
                title: "Video Playback Error",
                description: "Camera is connected but video won't play. Please refresh the page.",
                variant: "destructive"
              });
            });
        } else {
          console.log('[RealTimePractice] Video element not found yet, retrying...');
          setTimeout(attachStream, 100);
        }
      };
      
      // wait a bit for React to render the video element
      setTimeout(attachStream, 50);
      
    } catch (error) {
      console.error('[RealTimePractice] ===== WEBCAM ERROR =====');
      console.error('[RealTimePractice] Error accessing webcam:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RealTimePractice] Error name:', error instanceof Error ? error.name : 'N/A');
      console.error('[RealTimePractice] ===== END WEBCAM ERROR =====');
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
      toast({
          title: "Camera Permission Denied",
          description: "Please allow camera access in your browser settings to use this feature.",
          variant: "destructive"
        });
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast({
          title: "No Camera Found",
          description: "No camera device detected. Please connect a camera and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Camera Access Error",
          description: `Failed to access camera: ${errorMessage}`,
        variant: "destructive"
      });
      }
    }
  };

  const disableWebcam = () => {
    stopPractice();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setWebcamEnabled(false);
    setTranscriptionText('');
    setLastTranscription('');
    setIsCorrect(null);
    frameBufferRef.current = [];
    currentFaceDetectionRef.current = null;
  };

  const selectWord = (word: ApiPracticeWord) => {
    if (isPracticing) {
      setShowStopDialog(true);
      return;
    }
    
    // construct video url (like VideoPlayerPage pattern)
    const constructedUrl = word.videoPath.startsWith('http') 
      ? word.videoPath 
      : `${API_BASE_URL}${word.videoPath}`;
    
    // test if video url is accessible
    fetch(constructedUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          toast({
            title: "Video Not Found",
            description: `Video file not accessible (${response.status}). Please contact support.`,
            variant: "destructive"
          });
          return;
        }
        setVideoUrl(constructedUrl);
      })
      .catch(() => {
        // still set URL even if HEAD fails (might be CORS issue)
        setVideoUrl(constructedUrl);
      });
    
    setSelectedWord(word);
    setVideoEnded(false);
    setVideoReady(false);
    setIsVideoPlaying(false); // don't auto-play - user clicks play button
    setTranscriptionText('');
    setLastTranscription('');
    setIsCorrect(null);
    frameBufferRef.current = [];
    // reset feedback - will be updated by face detection
    setFeedback([
      { aspect: 'Face Detection', status: 'needs-work', description: 'Position your face in front of the camera' },
      { aspect: 'Face Position', status: 'needs-work', description: 'Center your face in the frame' },
      { aspect: 'Mouth Visibility', status: 'needs-work', description: 'Ensure your mouth is visible' }
    ]);
  };
  
  // Fix: Manually set video src if ReactPlayer doesn't set it (like VideoPlayerPage)
  useEffect(() => {
    if (!videoUrl) return;
    
    const checkAndSetSrc = () => {
      const videoElement = videoContainerRef.current?.querySelector('video');
      if (videoElement) {
        if (!videoElement.src || videoElement.src === '' || !videoElement.src.includes(videoUrl)) {
          videoElement.src = videoUrl;
          videoElement.load();
        }
      }
    };
    
    checkAndSetSrc();
    const timeout1 = setTimeout(checkAndSetSrc, 100);
    const timeout2 = setTimeout(checkAndSetSrc, 500);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [videoUrl]);

  // proper face detection using MediaPipe
  const detectFace = useCallback(async () => {
    if (!userVideoRef.current) {
      return null;
    }

    // use ref to check current state (not stale closure)
    if (!isPracticingRef.current) {
      return null;
    }

    try {
      const video = userVideoRef.current;
      
      if (video.readyState < 2) {
        return null;
      }
      
      const result = await faceDetectionService.detectFace(video);
      const previousResult = currentFaceDetectionRef.current;
      currentFaceDetectionRef.current = result;
      
      // only log when face detection status changes
      if (!previousResult || previousResult.faceDetected !== result.faceDetected) {
        console.log('[RealTimePractice] Face detection:', result.faceDetected ? 'DETECTED' : 'NOT DETECTED', '-', result.message);
      }

      // update feedback based on actual face detection
      const feedbackItems: FeedbackIndicator[] = [];
      
      if (!result.faceDetected) {
        feedbackItems.push({
          aspect: 'Face Detection',
          status: 'needs-work',
          description: result.message || 'No face detected'
        });
        feedbackItems.push({
          aspect: 'Face Position',
          status: 'needs-work',
          description: 'Position your face in front of the camera'
        });
        feedbackItems.push({
          aspect: 'Mouth Visibility',
          status: 'needs-work',
          description: 'Ensure your mouth is visible'
        });
      } else {
        // face detected - provide specific feedback based on detection results
        feedbackItems.push({
          aspect: 'Face Detection',
          status: 'excellent',
          description: 'Face detected clearly'
        });
        
        if (result.faceAngle === 'side') {
          feedbackItems.push({
            aspect: 'Face Position',
            status: 'needs-work',
            description: 'Face angled - please face the camera directly'
          });
          feedbackItems.push({
            aspect: 'Mouth Visibility',
            status: 'needs-work',
            description: 'Turn your face to the front'
          });
        } else if (result.faceConfidence < 0.7) {
          feedbackItems.push({
            aspect: 'Face Position',
            status: 'needs-work',
            description: 'Move closer or improve lighting'
          });
          feedbackItems.push({
            aspect: 'Mouth Visibility',
            status: 'good',
            description: 'Mouth is visible'
          });
        } else {
          // good face detection
          feedbackItems.push({
            aspect: 'Face Position',
            status: 'excellent',
            description: 'Face positioned correctly'
          });
          feedbackItems.push({
            aspect: 'Mouth Visibility',
            status: result.mouthOpen ? 'excellent' : 'good',
            description: result.mouthOpen ? 'Mouth is open and ready' : 'Open your mouth to speak'
          });
        }
      }
      
      setFeedback(feedbackItems);
      return result;
    } catch (error) {
      console.error('[RealTimePractice] Face detection error:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }, []); // no dependencies - use ref for state

  // collect frames for batch processing (need 25+ frames = 1 second at 25fps)
  const collectFrame = useCallback(() => {
    // use ref to check current state
    if (!userVideoRef.current || !canvasRef.current || !selectedWord || !isPracticingRef.current) {
      return;
    }

    try {
      const video = userVideoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState < 2) {
        return;
      }
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            frameBufferRef.current.push(blob);
            const bufferSize = frameBufferRef.current.length;
            // only log every 10 frames to reduce noise
            if (bufferSize % 10 === 0) {
              console.log(`[RealTimePractice] Frames collected: ${bufferSize}/25`);
            }
          }
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('[RealTimePractice] Frame collection error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [selectedWord]); // use ref for isPracticing

  // process collected frames when we have enough (25+ frames)
  const processFrames = useCallback(async () => {
    // use ref to check current state
    if (!selectedWord || !isPracticingRef.current || frameBufferRef.current.length < 25) {
      return;
    }

    // check face detection - require face to be detected before processing
    const faceResult = currentFaceDetectionRef.current;
    if (!faceResult || !faceResult.faceDetected) {
      // clear buffer if too many frames accumulated without face detection
      if (frameBufferRef.current.length > 50) {
        frameBufferRef.current = [];
      }
      return;
    }
          
    try {
      setIsProcessing(true);
      console.log(`[RealTimePractice] Processing ${frameBufferRef.current.length} frames for word: ${selectedWord.word}`);
      
      const formData = new FormData();
      frameBufferRef.current.forEach((blob, index) => {
        formData.append('frames', blob, `frame_${index}.jpg`);
      });
      formData.append('word_id', selectedWord.id.toString());
      
      const token = localStorage.getItem('token');
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/transcriptions/practice/realtime`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const endTime = Date.now();
      console.log(`[RealTimePractice] Backend response: ${response.status} (${endTime - startTime}ms)`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.transcription) {
        const transcribed = result.data.transcription.trim().toLowerCase();
        const expectedWord = selectedWord.word.toLowerCase();
        
        const matches = transcribed === expectedWord || 
                       transcribed.includes(expectedWord) ||
                       expectedWord.includes(transcribed);
        
        console.log(`[RealTimePractice] Transcription: "${transcribed}" | Expected: "${expectedWord}" | Match: ${matches ? 'YES' : 'NO'}`);
        
        setTranscriptionText(transcribed);
        setLastTranscription(transcribed);
        setIsCorrect(matches);
        
        if (matches) {
          correctSoundRef.current?.play().catch(e => console.error('Sound error:', e));
          setFeedback([
            { aspect: 'Face Detection', status: 'excellent', description: 'Face detected clearly' },
            { aspect: 'Face Position', status: 'excellent', description: 'Perfect positioning!' },
            { aspect: 'Word Recognition', status: 'excellent', description: `Successfully recognized: "${selectedWord.word}"` }
          ]);
          setTimeout(() => completePractice(true), 1500);
        } else {
          wrongSoundRef.current?.play().catch(e => console.error('Sound error:', e));
        }
      }
      
      frameBufferRef.current = [];
    } catch (error) {
      console.error('[RealTimePractice] Processing error:', error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: "Processing Error",
        description: `Failed to process video frames: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      frameBufferRef.current = [];
    } finally {
      setIsProcessing(false);
    }
  }, [selectedWord, toast]); // use ref for isPracticing

  const startPractice = () => {
    if (!webcamEnabled) {
      toast({
        title: "Enable Webcam First",
        description: "Please enable your webcam before starting practice",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedWord) {
      toast({
        title: "Select a Word",
        description: "Please select a word to practice first",
        variant: "destructive"
      });
      return;
    }

    setIsPracticing(true);
    isPracticingRef.current = true; // update ref immediately
    setTranscriptionText('');
    setLastTranscription('');
    setIsCorrect(null);
    frameBufferRef.current = [];
    currentFaceDetectionRef.current = null;
    
    console.log(`[RealTimePractice] Practice started for: ${selectedWord.word}`);
    
    // detect face every 500ms for real-time feedback
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
    }
    // run immediately once to get initial feedback
    detectFace().catch(() => {});
    // then run every 500ms for continuous feedback
    faceDetectionIntervalRef.current = setInterval(() => {
      detectFace().catch(() => {});
    }, 500);
    
    // collect frames at 25fps (every 40ms) to build buffer
    frameCollectionIntervalRef.current = setInterval(() => {
      collectFrame();
    }, 40);
    
    // process frames when we have enough (every 2 seconds)
    processingIntervalRef.current = setInterval(() => {
      const bufferSize = frameBufferRef.current.length;
      if (bufferSize >= 25 && isPracticingRef.current) {
        processFrames();
      }
    }, 2000);
  };

  const stopPractice = () => {
    setIsPracticing(false);
    isPracticingRef.current = false; // update ref immediately
    setTranscriptionText('');
    setIsCorrect(null);
    frameBufferRef.current = [];
    currentFaceDetectionRef.current = null;
    
    if (frameCollectionIntervalRef.current) {
      clearInterval(frameCollectionIntervalRef.current);
      frameCollectionIntervalRef.current = null;
    }
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const completePractice = (success: boolean) => {
    stopPractice();
    setSessionStats(prev => ({
      ...prev,
      wordsAttempted: prev.wordsAttempted + 1,
      accuracy: success ? Math.min(100, prev.accuracy + 5) : Math.max(0, prev.accuracy - 2)
    }));
    
    toast({
      title: success ? "Excellent!" : "Keep Practicing",
      description: success 
        ? `Great job! You correctly pronounced "${selectedWord?.word}".`
        : `Try again to match "${selectedWord?.word}".`,
      variant: success ? "default" : "destructive"
    });
  };

  const getFeedbackIcon = (status: FeedbackIndicator['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getFeedbackColor = (status: FeedbackIndicator['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'good':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };


  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-primary">Real-Time Practice Mode</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Practice lip formation in real-time using your webcam with side-by-side video comparison
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Word Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Practice Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`w-full justify-start ${
                      selectedCategory === category ? 'bg-primary hover:bg-primary/90' : ''
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Words to Practice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search words..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {filteredWords.length > 0 ? (
                  filteredWords.map(word => (
                  <motion.div
                    key={word.id}
                    whileHover={{ x: 5 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWord?.id === word.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => selectWord(word)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{word.word}</h4>
                        <p className="text-xs text-gray-500">{word.phonetics}</p>
                      </div>
                      <Badge 
                          variant={word.difficulty === 'beginner' ? 'secondary' : 
                                  word.difficulty === 'intermediate' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                          {word.difficulty.charAt(0).toUpperCase() + word.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {searchTerm ? 'No words found matching your search' : 'No words available'}
              </div>
                )}
              </div>
              
              {filteredWords.length > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Showing {filteredWords.length} of {apiWords.length} words
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Practice Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video Comparison */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Practice Interface
              </CardTitle>
              <CardDescription>
                Watch the reference video and practice with your webcam for real-time comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reference Video */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reference Video</h3>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {selectedWord && videoUrl ? (
                      <div 
                        ref={videoContainerRef}
                        className="relative aspect-video bg-black rounded-lg overflow-hidden group"
                        style={{ width: '100%', paddingTop: '56.25%' }}
                      >
                        {/* ReactPlayer - use exact VideoPlayerPage pattern */}
                        <div 
                          className="absolute inset-0" 
                          style={{ 
                            zIndex: 1,
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100%',
                            height: '100%'
                          }}
                        >
                          {/* @ts-ignore - ReactPlayer type definitions are incomplete */}
                          <ReactPlayerComponent
                            key={videoUrl}
                        ref={videoRef}
                            url={videoUrl}
                            width="100%"
                            height="100%"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            playing={isVideoPlaying}
                            loop={false}
                            controls={false}
                            muted={false}
                            playsinline={true}
                            light={false}
                            pip={false}
                            onError={(error: any) => {
                              console.error('[RealTimePractice] Video player error:', error);
                              toast({
                                title: "Video Error",
                                description: "Failed to load reference video. Please try selecting another word.",
                                variant: "destructive"
                              });
                            }}
                            onReady={() => {
                              // manual video element manipulation (like VideoPlayerPage)
                              const videoElement = videoContainerRef.current?.querySelector('video');
                              if (videoElement) {
                                // force set src if empty
                                if (!videoElement.src || videoElement.src === '' || !videoElement.src.includes(videoUrl)) {
                                  videoElement.src = videoUrl;
                                  videoElement.load();
                                }
                                // don't auto-play - wait for user to click play button
                                setVideoReady(true);
                                setIsVideoPlaying(false);
                              } else {
                                setVideoReady(true);
                                setIsVideoPlaying(false);
                              }
                            }}
                            onStart={() => {
                              // video started loading
                            }}
                            onPlay={() => {
                              setIsVideoPlaying(true);
                            }}
                            onPause={() => {
                              setIsVideoPlaying(false);
                            }}
                            onEnded={() => {
                              setIsVideoPlaying(false);
                              setVideoReady(true);
                            }}
                            // @ts-ignore - ReactPlayer onProgress type
                            onProgress={() => {
                              // progress tracking
                            }}
                          />
                        </div>
                        {/* Play/Replay Button Overlay - show when paused or ended */}
                        {(!isVideoPlaying) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg">
                            <Button
                              size="lg"
                              variant="ghost"
                              onClick={async () => {
                                // direct video element manipulation
                                const videoElement = videoContainerRef.current?.querySelector('video');
                                if (videoElement) {
                                  try {
                                    // if video ended, reset to start
                                    if (videoElement.ended) {
                                      videoElement.currentTime = 0;
                                    }
                                    await videoElement.play();
                                    setIsVideoPlaying(true);
                                  } catch (playError: any) {
                                    console.error('[RealTimePractice] Play error:', playError);
                                    toast({
                                      title: "Playback Error",
                                      description: "Could not play video. Please try again.",
                                      variant: "destructive"
                                    });
                                  }
                                } else {
                                  // fallback: use ReactPlayer methods
                                  if (videoRef.current) {
                                    if (typeof videoRef.current.seekTo === 'function') {
                                      videoRef.current.seekTo(0);
                                    }
                                    const internalPlayer = videoRef.current?.getInternalPlayer?.();
                                    if (internalPlayer && typeof internalPlayer.play === 'function') {
                                      await internalPlayer.play();
                                    }
                                  }
                                  setIsVideoPlaying(true);
                                }
                              }}
                              className="bg-primary/90 hover:bg-primary text-white rounded-full p-6 shadow-lg"
                            >
                              {videoReady ? (
                                <RotateCcw className="h-8 w-8" />
                              ) : (
                                <Play className="h-8 w-8" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : selectedWord ? (
                      <div className="aspect-video flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Loading video...</p>
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Select a word to see reference video</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedWord && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h4 className="font-semibold text-2xl text-primary mb-2">
                        {selectedWord.word}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{selectedWord.phonetics}</p>
                      <p className="text-sm">{selectedWord.description}</p>
                    </div>
                  )}
                </div>

                {/* User Webcam */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Practice</h3>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {!webcamEnabled ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-dashed border-primary/30">
                        <div className="text-center space-y-4">
                          <Camera className="h-16 w-16 mx-auto text-primary/60" />
                          <div>
                            <p className="text-lg font-medium text-primary">Enable Camera</p>
                            <p className="text-sm text-gray-500">Grant camera access to start practicing</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={userVideoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        playsInline
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    )}
                    {/* Face detection indicator - show status */}
                    {isPracticing && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {currentFaceDetectionRef.current && (
                          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
                            currentFaceDetectionRef.current.faceDetected ? 'bg-green-500/90' : 'bg-red-500/90'
                          } text-white shadow-lg`}>
                            <Eye className={`h-3 w-3 ${currentFaceDetectionRef.current.faceDetected ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-medium">
                              {currentFaceDetectionRef.current.faceDetected ? 'Face Detected' : 'No Face'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Frame collection and processing indicators */}
                    {isPracticing && (
                      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                        {isProcessing ? (
                          <div className="bg-primary/90 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs font-medium">Processing...</span>
                          </div>
                        ) : (
                          <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                            Frames: {frameBufferRef.current.length}/25
                          </div>
                        )}
                      </div>
                    )}
                    {/* Status indicator */}
                    {isPracticing && lastTranscription && (
                      <div className={`absolute bottom-4 left-4 right-4 p-3 rounded-lg ${
                        isCorrect === true ? 'bg-green-500/90' : isCorrect === false ? 'bg-red-500/90' : 'bg-blue-500/90'
                      } text-white`}>
                        <div className="flex items-center gap-2">
                          {isCorrect === true && <CheckCircle className="h-4 w-4" />}
                          {isCorrect === false && <AlertCircle className="h-4 w-4" />}
                          {isCorrect === null && <Mic className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {isCorrect === true ? 'Correct!' : isCorrect === false ? 'Try Again' : 'Listening...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Real-time Transcription Display */}
                  {isPracticing && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">What You're Saying:</span>
                        </div>
                        <div className={`min-h-12 p-3 rounded-lg border-2 ${
                          isCorrect === true ? 'border-green-500 bg-green-50' :
                          isCorrect === false ? 'border-red-500 bg-red-50' :
                          'border-primary/30 bg-white'
                        }`}>
                          {transcriptionText ? (
                            <p className={`text-lg font-semibold ${
                              isCorrect === true ? 'text-green-700' :
                              isCorrect === false ? 'text-red-700' :
                              'text-gray-800'
                            }`}>
                              {transcriptionText}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">Speak the word clearly...</p>
                          )}
                        </div>
                        {selectedWord && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expected: <span className="font-medium">{selectedWord.word}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="flex gap-2">
                    {!webcamEnabled ? (
                      <Button 
                        onClick={() => setShowCameraDialog(true)}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Enable Camera
                      </Button>
                    ) : (
                      <>
                        {!isPracticing ? (
                          <Button 
                            onClick={startPractice}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={!selectedWord}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Practice
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setShowStopDialog(true)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <Square className="mr-2 h-4 w-4" />
                            Stop Practice
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={disableWebcam}
                          title="Disable Camera"
                        >
                          <VideoOff className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-time Feedback */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Real-time Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                    {feedback.map((item, index) => (
                      <motion.div
                        key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getFeedbackColor(item.status)}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          {getFeedbackIcon(item.status)}
                          <div>
                            <span className="font-medium">{item.aspect}</span>
                          <p className="text-xs opacity-80">{item.description}</p>
                          </div>
                        </div>
                      <span className="text-sm font-medium capitalize">
                          {item.status === 'needs-work' ? 'Adjust' : item.status}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Statistics */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {sessionStats.wordsAttempted}
                      </div>
                      <div className="text-sm text-gray-600">Words Practiced</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(sessionStats.accuracy)}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Overall Accuracy</span>
                      <span className="text-sm font-medium">{Math.round(sessionStats.accuracy)}%</span>
                    </div>
                    <Progress value={sessionStats.accuracy} className="h-2" />
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="font-medium mb-2">Quick Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Focus on lip shape and movement</li>
                      <li>• Practice slowly at first</li>
                      <li>• Mirror the reference video closely</li>
                      <li>• Take breaks when needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Permission Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>Camera Access Required</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="text-left pt-2">
                <p>To practice lip reading, we need access to your camera. This allows you to:</p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>See yourself practicing in real-time</li>
                <li>Compare your lip movements with reference videos</li>
                <li>Receive instant feedback on your pronunciation</li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                Your video feed is processed locally and never stored or shared.
              </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCameraDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowCameraDialog(false);
                await enableWebcam();
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Allow Camera Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Practice Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Practice Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop the current practice session? Your progress will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowStopDialog(false)}>Continue Practicing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowStopDialog(false);
                stopPractice();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Practice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RealTimePractice;
