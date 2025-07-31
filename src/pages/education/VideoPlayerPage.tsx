import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { TutorialSeries, Video, mockTutorialSeries, mockUserProgress, formatDuration, getProgressPercentage } from '@/data/tutorialSeries';

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
  onSpeedChange
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
            <span>{formatDuration(currentTime)}</span>
            <span>/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
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
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 p-2 rounded"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-primary"
                    style={{ writingMode: 'vertical-lr' as const }}
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
          >
            <Maximize className="h-4 w-4" />
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
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);

  // Find series and video data
  const series = mockTutorialSeries.find(s => s.id === seriesId);
  const video = series?.videos.find(v => v.id === videoId);
  const userProgress = mockUserProgress[seriesId || ''];

  const markVideoCompleted = React.useCallback(async () => {
    try {
      // Simulate API call to mark video as completed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Progress Saved!",
        description: `"${video.title}" marked as completed.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save progress. Please try again.",
      });
    }
  }, [video?.title, toast]);

  useEffect(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current;
      
      const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
      const handleDurationChange = () => setDuration(videoElement.duration);
      const handleEnded = () => {
        setIsPlaying(false);
        setIsVideoCompleted(true);
        markVideoCompleted();
      };

      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('durationchange', handleDurationChange);
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('durationchange', handleDurationChange);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [videoId, markVideoCompleted]);

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

  const currentVideoIndex = series.videos.findIndex(v => v.id === videoId);
  const previousVideo = currentVideoIndex > 0 ? series.videos[currentVideoIndex - 1] : null;
  const nextVideo = currentVideoIndex < series.videos.length - 1 ? series.videos[currentVideoIndex + 1] : null;
  const isVideoCompletedByUser = userProgress?.completedVideos.includes(videoId) || false;

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: series.title, href: `/education/series/${series.id}` },
    { title: video.title }
  ];

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const navigateToVideo = (targetVideo: Video) => {
    navigate(`/education/series/${series.id}/video/${targetVideo.id}`);
  };

  const skipToTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    handleSeek(newTime);
  };

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
                  className="relative aspect-video bg-black group cursor-pointer"
                  onMouseMove={() => setShowControls(true)}
                  onMouseLeave={() => setShowControls(false)}
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    poster={`https://via.placeholder.com/1280x720/1e293b/e2e8f0?text=${encodeURIComponent(video.title)}`}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                        videoRef.current.volume = volume;
                        videoRef.current.playbackRate = playbackSpeed;
                      }
                    }}
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

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
                      <Badge variant={video.isAdvanced ? "destructive" : "secondary"}>
                        Video {video.order}
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
                      {formatDuration(video.duration)}
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
                      const isCurrent = seriesVideo.id === videoId;
                      
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
                                  {formatDuration(seriesVideo.duration)}
                                </span>
                                {seriesVideo.isAdvanced && (
                                  <Badge variant="outline" className="text-xs">Advanced</Badge>
                                )}
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
