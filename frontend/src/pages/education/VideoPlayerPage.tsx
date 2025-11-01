import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Settings,
  MessageSquare,
  Star,
  FileText,
  Download,
  Subtitles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { useTutorialSeriesById } from '@/services/content/contentQueries';
import { API_BASE_URL } from '@/lib/constants';
import { Video, ApiTutorial } from '@/lib/api';
import ReactPlayer from 'react-player';

const formatDuration = (n?: number) => (n ? `${Math.round(n/60)} min` : '0 min');
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Parse WebVTT format
const parseVTT = (vttText: string): Array<{start: number, end: number, text: string}> => {
  const lines = vttText.split('\n');
  const subtitles: Array<{start: number, end: number, text: string}> = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip WEBVTT header and empty lines
    if (line === '' || line === 'WEBVTT' || line.match(/^\d+$/)) {
      i++;
      continue;
    }
    
    // Match timestamp line: "00:00:00.360 --> 00:00:03.240"
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (timestampMatch) {
      const [, startStr, endStr] = timestampMatch;
      const start = parseTimestamp(startStr);
      const end = parseTimestamp(endStr);
      
      // Collect text lines until next timestamp or empty line
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/\d{2}:\d{2}:\d{2}/)) {
        textLines.push(lines[i].trim());
        i++;
      }
      
      if (textLines.length > 0) {
        subtitles.push({
          start,
          end,
          text: textLines.join(' ')
        });
      }
    } else {
      i++;
    }
  }
  
  return subtitles;
};

// Convert VTT timestamp "00:00:00.360" to seconds
const parseTimestamp = (timestamp: string): number => {
  const [hms, ms] = timestamp.split('.');
  const [h, m, s] = hms.split(':').map(Number);
  const milliseconds = parseInt(ms);
  return h * 3600 + m * 60 + s + milliseconds / 1000;
};

const getProgressPercentage = (p: any, s: ApiTutorial) => {
  if (!p || !s.videos) return 0;
  const completedCount = p.completedVideos?.length || 0;
  const total = s.videos.length || 1;
  return Math.round((completedCount / total) * 100);
};

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  onFullscreen: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  isFullscreen: boolean;
  hasSubtitles: boolean;
  subtitlesEnabled: boolean;
  onToggleSubtitles: () => void;
}

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onMuteToggle,
  onFullscreen,
  playbackSpeed,
  onSpeedChange,
  isFullscreen,
  hasSubtitles,
  subtitlesEnabled,
  onToggleSubtitles
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    onSeek(percentage * duration);
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* Progress Bar */}
      <div 
        className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-4 group"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-primary rounded-full relative group-hover:h-3 transition-all"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between text-white">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="text-white hover:bg-white/20 p-2"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Subtitle Control */}
          {hasSubtitles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSubtitles}
              className={`text-white hover:bg-white/20 p-2 ${
                subtitlesEnabled ? 'bg-primary/30' : ''
              }`}
              title="Toggle Subtitles (C)"
            >
              <Subtitles className="h-4 w-4" />
            </Button>
          )}

          {/* Volume Control */}
          <div 
            className="relative"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onMuteToggle}
              className="text-white hover:bg-white/20 p-2"
              title="Toggle Mute (M)"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 p-3 rounded flex items-center justify-center"
                >
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => onVolumeChange(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-24"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Speed Control */}
          <div 
            className="relative"
            onMouseEnter={() => setShowSpeedMenu(true)}
            onMouseLeave={() => setShowSpeedMenu(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2 text-xs font-medium min-w-[40px]"
              title="Change Speed"
            >
              {playbackSpeed}x
            </Button>
            
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 rounded p-1 min-w-[60px]"
                >
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      className={`block w-full text-center px-2 py-1 text-xs rounded hover:bg-white/20 ${
                        speed === playbackSpeed ? 'bg-primary text-white' : 'text-gray-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreen}
            className="text-white hover:bg-white/20 p-2"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

const VideoPlayerPage: React.FC = () => {
  const { seriesId, videoId } = useParams<{ seriesId: string; videoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // fetch series data from API
  const seriesQuery = useTutorialSeriesById(Number(seriesId));
  
  // Video player state
  const videoRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleLines, setSubtitleLines] = useState<Array<{start: number, end: number, text: string}>>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  // get series and video data from API response
  const series = seriesQuery.data;
  const video = series?.videos?.find(v => v.id === Number(videoId));
  const userProgress: any = undefined; // will implement later

  // Check if video has subtitles
  const hasSubtitles = Boolean(video?.subtitlePath);

  const markVideoCompleted = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Progress Saved!",
        description: `"${video?.title}" marked as completed.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress. Please try again.",
      });
    }
  }, [video?.title, toast]);

  // Define all handlers FIRST before keyboard controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    console.log('🔍 handleSeek called with:', time, 'videoRef.current:', !!videoRef.current);
    if (videoRef.current?.seekTo) {
      videoRef.current.seekTo(time, 'seconds');
    }
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleFullscreen = useCallback(() => {
    console.log('🔍 handleFullscreen called, isFullscreen:', isFullscreen);
    if (!isFullscreen) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(prev => !prev);
  }, [isFullscreen]);

  const handleToggleSubtitles = useCallback(() => {
    setSubtitlesEnabled(prev => !prev);
    toast({
      title: subtitlesEnabled ? 'Subtitles Off' : 'Subtitles On',
      description: 'Subtitles have been toggled.',
    });
  }, [subtitlesEnabled, toast]);

  const skipToTime = useCallback((seconds: number) => {
    console.log('🔍 skipToTime called with:', seconds, 'currentTime:', currentTime, 'duration:', duration);
    if (!duration) {
      console.log('⚠️ Duration is 0, skipping');
      return;
    }
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    handleSeek(newTime);
  }, [currentTime, duration, handleSeek]);

  // Keyboard controls - MUST be after all handler definitions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      console.log('🔍 Key pressed:', e.key);

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          console.log('🔍 Toggling play/pause');
          handlePlayPause();
          break;
        case 'm':
          e.preventDefault();
          console.log('🔍 Toggling mute');
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          console.log('🔍 Toggling fullscreen');
          handleFullscreen();
          break;
        case 'escape':
          e.preventDefault();
          console.log('🔍 Escape pressed, isFullscreen:', isFullscreen);
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          console.log('🔍 Skipping -10s');
          skipToTime(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          console.log('🔍 Skipping +10s');
          skipToTime(10);
          break;
        case 'arrowup':
          e.preventDefault();
          console.log('🔍 Increasing volume');
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          console.log('🔍 Decreasing volume');
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'c':
          if (hasSubtitles) {
            e.preventDefault();
            console.log('🔍 Toggling subtitles');
            handleToggleSubtitles();
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          e.preventDefault();
          const targetTime = (parseInt(e.key) / 5) * duration;
          console.log('🔍 Jumping to time:', targetTime, 'out of', duration);
          handleSeek(targetTime);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    isPlaying, 
    isMuted, 
    volume, 
    duration, 
    hasSubtitles, 
    subtitlesEnabled,
    handlePlayPause,
    handleMuteToggle,
    handleFullscreen,
    handleVolumeChange,
    handleToggleSubtitles,
    handleSeek,
    skipToTime,
    isFullscreen
  ]);

  // Load subtitles when video changes
  useEffect(() => {
    if (video?.subtitlePath && subtitlesEnabled) {
      const loadSubtitles = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}${video.subtitlePath}`);
          const text = await response.text();
          const lines = parseVTT(text);
          setSubtitleLines(lines);
        } catch (error) {
          console.error('Failed to load subtitles:', error);
        }
      };
      loadSubtitles();
    }
  }, [video?.subtitlePath, subtitlesEnabled]);

  // Update current subtitle based on currentTime
  useEffect(() => {
    if (!subtitlesEnabled || subtitleLines.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const activeLine = subtitleLines.find(line => 
      currentTime >= line.start && currentTime < line.end
    );
    setCurrentSubtitle(activeLine?.text || '');
  }, [currentTime, subtitleLines, subtitlesEnabled]);

  useEffect(() => {
    if (video) {
      markVideoCompleted();
    }
  }, [videoId, markVideoCompleted, video]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    resetTimeout();
    return () => clearTimeout(timeout);
  }, [currentTime]);

  if (!series || !video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h1>
          <p className="text-gray-600 mb-4">The video you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  const currentVideoIndex = series.videos.findIndex(v => v.id === Number(videoId));
  const previousVideo = currentVideoIndex > 0 ? series.videos[currentVideoIndex - 1] : null;
  const nextVideo = currentVideoIndex < series.videos.length - 1 ? series.videos[currentVideoIndex + 1] : null;
  const isVideoCompletedByUser = userProgress?.completedVideos.includes(videoId) || false;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: series.title, href: `/education/series/${series.id}` },
    { title: video.title }
  ];

  const navigateToVideo = (targetVideo: Video) => {
    navigate(`/education/series/${series.id}/video/${targetVideo.id}`);
  };

  // DEBUG: Log duration loading
  console.log('🔍 VideoPlayerPage State:', {
    currentTime,
    duration,
    isPlaying,
    videoSrc: video ? `${API_BASE_URL}${video.videoPath}` : 'no video',
    hasSubtitles
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <AnimatedBreadcrumb items={breadcrumbItems} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden bg-black">
                <div 
                  ref={containerRef}
                  className="relative aspect-video bg-black group cursor-pointer"
                  tabIndex={0}
                  onMouseMove={() => setShowControls(true)}
                  onMouseLeave={() => isPlaying && setShowControls(false)}
                >
                  {/* ReactPlayer integration */}
                  {video && (
                    <ReactPlayer
                      ref={videoRef}
                      src={`${API_BASE_URL}${video.videoPath}`}
                      width="100%"
                      height="100%"
                      playing={isPlaying}
                      volume={isMuted ? 0 : volume}
                      playbackRate={playbackSpeed}
                      {...({
                        onProgress: (state: any) => {
                          console.log('🔍 onProgress fired:', state);
                          setCurrentTime(state.playedSeconds);
                        },
                        onDuration: (duration: any) => {
                          console.log('🔍 onDuration fired:', duration);
                          setDuration(duration);
                        },
                        onPlay: () => {
                          console.log('🔍 onPlay fired');
                          setIsPlaying(true);
                        },
                        onPause: () => {
                          console.log('🔍 onPause fired');
                          setIsPlaying(false);
                        },
                        onEnded: () => {
                          console.log('🔍 onEnded fired');
                          setIsPlaying(false);
                          setIsVideoCompleted(true);
                          markVideoCompleted();
                        },
                        controls: false
                      } as any)}
                    />
                  )}

                  {/* Play button overlay */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/20"
                      onClick={handlePlayPause}
                    >
                      <Button
                        size="lg"
                        className="rounded-full w-20 h-20 bg-primary/90 hover:bg-primary text-white"
                      >
                        <Play className="h-8 w-8 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Subtitle Overlay */}
                  {currentSubtitle && subtitlesEnabled && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/75 rounded-lg max-w-[80%]">
                      <p className="text-white text-center text-lg font-medium">
                        {currentSubtitle}
                      </p>
                    </div>
                  )}

                  {/* Video Controls */}
                  <AnimatePresence>
                    {showControls && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <VideoPlayerControls
                          isPlaying={isPlaying}
                          onPlayPause={handlePlayPause}
                          currentTime={currentTime}
                          duration={duration}
                          onSeek={handleSeek}
                          volume={volume}
                          onVolumeChange={handleVolumeChange}
                          isMuted={isMuted}
                          onMuteToggle={handleMuteToggle}
                          onFullscreen={handleFullscreen}
                          playbackSpeed={playbackSpeed}
                          onSpeedChange={handleSpeedChange}
                          isFullscreen={isFullscreen}
                          hasSubtitles={hasSubtitles}
                          subtitlesEnabled={subtitlesEnabled}
                          onToggleSubtitles={handleToggleSubtitles}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Skip buttons */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipToTime(-10)}
                      className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Skip -10s (←)"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipToTime(10)}
                      className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Skip +10s (→)"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Video Info */}
              <Card className="mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        Video {video.videoOrder || 1}
                      </Badge>
                      {isVideoCompletedByUser && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {formatDuration(video.videoDuration)}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{video.title}</CardTitle>
                  <CardDescription className="text-base">{video.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {previousVideo && (
                        <Button
                          variant="outline"
                          onClick={() => navigateToVideo(previousVideo)}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      )}
                      {nextVideo && (
                        <Button
                          onClick={() => navigateToVideo(nextVideo)}
                          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {!isVideoCompletedByUser && isVideoCompleted && (
                      <Button
                        onClick={markVideoCompleted}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Series Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{series.title}</CardTitle>
                  <CardDescription>
                    Video {currentVideoIndex + 1} of {series.videos.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={userProgress ? getProgressPercentage(userProgress, series) : 0} 
                    className="mb-2" 
                  />
                  <div className="text-sm text-gray-500">
                    {userProgress?.completedVideos.length || 0} videos completed
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Download Transcript
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Practice Exercises
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Discussion
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Series Videos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Course Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-80 overflow-y-auto">
                    {series.videos.map((seriesVideo, index) => {
                      const isCompleted = userProgress?.completedVideos.includes(seriesVideo.id) || false;
                      const isCurrent = seriesVideo.id === Number(videoId);
                      
                      return (
                        <div
                          key={seriesVideo.id}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-primary/5 transition-colors ${
                            isCurrent ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                          }`}
                          onClick={() => navigateToVideo(seriesVideo)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {isCompleted ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : isCurrent ? (
                                <Play className="h-2 w-2 text-primary" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm line-clamp-1 ${
                                isCurrent ? 'text-primary' : 'text-gray-900'
                              }`}>
                                {seriesVideo.title}
                              </h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">
                                  {formatDuration(seriesVideo.videoDuration)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
