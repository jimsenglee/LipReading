import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Settings,
  Eye,
  Mic,
  AlertCircle,
  CheckCircle,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface PracticeWord {
  id: number;
  word: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  videoUrl: string;
  phonetics: string;
  description: string;
}

interface FeedbackIndicator {
  aspect: string;
  status: 'good' | 'needs-work' | 'excellent';
  description: string;
}

const RealTimePractice = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('Basic Words');
  const [selectedWord, setSelectedWord] = useState<PracticeWord | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackIndicator[]>([]);
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    wordsAttempted: 0,
    accuracy: 0,
    timeSpent: 0
  });

  const categories = [
    'Basic Words',
    'Greetings',
    'Numbers',
    'Colors',
    'Family',
    'Food',
    'Actions',
    'Emotions'
  ];

  const practiceWords: PracticeWord[] = [
    {
      id: 1,
      word: 'Hello',
      category: 'Greetings',
      difficulty: 'Easy',
      videoUrl: '/api/placeholder/video/hello.mp4',
      phonetics: '/həˈloʊ/',
      description: 'A common greeting used when meeting someone'
    },
    {
      id: 2,
      word: 'Thank You',
      category: 'Greetings',
      difficulty: 'Easy',
      videoUrl: '/api/placeholder/video/thankyou.mp4',
      phonetics: '/θæŋk juː/',
      description: 'Expression of gratitude'
    },
    {
      id: 3,
      word: 'Beautiful',
      category: 'Basic Words',
      difficulty: 'Medium',
      videoUrl: '/api/placeholder/video/beautiful.mp4',
      phonetics: '/ˈbjuːtɪfəl/',
      description: 'Describing something aesthetically pleasing'
    },
    {
      id: 4,
      word: 'Computer',
      category: 'Basic Words',
      difficulty: 'Hard',
      videoUrl: '/api/placeholder/video/computer.mp4',
      phonetics: '/kəmˈpjuːtər/',
      description: 'Electronic device for processing data'
    },
    {
      id: 5,
      word: 'Excellent',
      category: 'Basic Words',
      difficulty: 'Hard',
      videoUrl: '/api/placeholder/video/excellent.mp4',
      phonetics: '/ˈɛksələnt/',
      description: 'Extremely good; outstanding'
    }
  ];

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Real-Time Practice' }
  ];

  const filteredWords = practiceWords.filter(word => 
    selectedCategory === 'All' || word.category === selectedCategory
  );

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const enableWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStream;
      }
      
      setWebcamEnabled(true);
      toast({
        title: "Webcam Enabled",
        description: "Camera access granted successfully"
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: "Camera Access Denied",
        description: "Webcam access is required for practice mode. Please allow access to continue.",
        variant: "destructive"
      });
    }
  };

  const disableWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setWebcamEnabled(false);
    setIsPracticing(false);
  };

  const selectWord = (word: PracticeWord) => {
    setSelectedWord(word);
    setIsPracticing(false);
    setPracticeProgress(0);
    // Reset feedback
    setFeedback([
      { aspect: 'Lip Position', status: 'needs-work', description: 'Position your lips correctly' },
      { aspect: 'Mouth Opening', status: 'needs-work', description: 'Adjust mouth opening' },
      { aspect: 'Clarity', status: 'needs-work', description: 'Speak more clearly' }
    ]);
  };

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
    
    // Simulate practice progress and feedback updates
    const interval = setInterval(() => {
      setPracticeProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          completePractice();
          return 100;
        }
        return newProgress;
      });
      
      // Update feedback randomly for demo
      setFeedback(prev => prev.map(item => ({
        ...item,
        status: Math.random() > 0.3 ? 'good' : Math.random() > 0.6 ? 'excellent' : 'needs-work'
      })));
    }, 500);
  };

  const stopPractice = () => {
    setIsPracticing(false);
    setPracticeProgress(0);
  };

  const completePractice = () => {
    setIsPracticing(false);
    setSessionStats(prev => ({
      ...prev,
      wordsAttempted: prev.wordsAttempted + 1,
      accuracy: Math.min(100, prev.accuracy + Math.random() * 10)
    }));
    
    toast({
      title: "Practice Complete!",
      description: `Great job practicing "${selectedWord?.word}". Try another word to continue improving.`
    });
  };

  const getFeedbackIcon = (status: FeedbackIndicator['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getFeedbackColor = (status: FeedbackIndicator['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
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
            <CardContent>
              <div className="space-y-2">
                {filteredWords.map(word => (
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
                        variant={word.difficulty === 'Easy' ? 'secondary' : 
                                word.difficulty === 'Medium' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {word.difficulty}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                    {selectedWord ? (
                      <video
                        ref={videoRef}
                        className="w-full aspect-video"
                        controls
                        loop
                        poster="/api/placeholder/400/240"
                      >
                        <source src={selectedWord.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
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
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {webcamEnabled ? (
                      <video
                        ref={userVideoRef}
                        className="w-full aspect-video"
                        autoPlay
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-dashed border-primary/30">
                        <div className="text-center space-y-4">
                          <Camera className="h-16 w-16 mx-auto text-primary/60" />
                          <div>
                            <p className="text-lg font-medium text-primary">Enable Camera</p>
                            <p className="text-sm text-gray-500">Grant camera access to start practicing</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!webcamEnabled ? (
                      <Button 
                        onClick={enableWebcam}
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
                            onClick={stopPractice}
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
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Feedback and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-time Feedback */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Real-time Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isPracticing && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Practice Progress</span>
                        <span>{Math.round(practiceProgress)}%</span>
                      </div>
                      <Progress value={practiceProgress} className="h-3" />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {feedback.map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center gap-3">
                          {getFeedbackIcon(item.status)}
                          <div>
                            <span className="font-medium">{item.aspect}</span>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium capitalize ${getFeedbackColor(item.status)}`}>
                          {item.status === 'needs-work' ? 'Adjust' : item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
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
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {sessionStats.wordsAttempted}
                      </div>
                      <div className="text-sm text-gray-600">Words Practiced</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
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
    </div>
  );
};

export default RealTimePractice;