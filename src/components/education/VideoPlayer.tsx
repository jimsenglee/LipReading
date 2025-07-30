import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  PictureInPicture,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEducation } from '@/hooks/use-education';

interface VideoPlayerProps {
  videoUrl: string;
  videoId: string;
  title: string;
  courseId: string;
  lessonId: string;
  chapters?: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoId,
  title,
  courseId,
  lessonId,
  chapters = [],
  onProgress,
  onComplete
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateProgress, getCourseProgress } = useEducation();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Load saved progress
  useEffect(() => {
    const progress = getCourseProgress(courseId);
    if (progress?.videoPosition && videoRef.current) {
      videoRef.current.currentTime = progress.videoPosition;
    }
  }, [courseId, getCourseProgress]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        const progressPercentage = Math.round((currentTime / duration) * 100);
        
        updateProgress({
          userId: 'user-1',
          courseId,
          lessonId,
          status: progressPercentage >= 95 ? 'completed' : 'in-progress',
          progressPercentage,
          videoPosition: currentTime,
          videoDuration: duration,
          lastAccessedAt: new Date(),
          isBookmarked: false,
          isFavorite: false
        });

        onProgress?.(currentTime, duration);
        
        if (progressPercentage >= 95) {
          onComplete?.();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentTime, duration, courseId, lessonId, updateProgress, onProgress, onComplete]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const jumpToChapter = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      setShowChapters(false);
    }
  };

  const enterPictureInPicture = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        await videoRef.current.requestPictureInPicture();
      } catch (error) {
        console.error('Failed to enter Picture-in-Picture mode:', error);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onClick={togglePlay}
      />

      {/* Loading Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
          />
        </div>
      )}

      {/* Video Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
          >
            {/* Chapter Markers */}
            {chapters.length > 0 && (
              <div className="absolute top-4 left-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChapters(!showChapters)}
                  className="text-white hover:bg-white/20"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chapters
                </Button>
                
                {showChapters && (
                  <Card className="absolute top-full mt-2 w-64 max-h-48 overflow-y-auto">
                    <CardContent className="p-2">
                      {chapters.map((chapter, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => jumpToChapter(chapter.startTime)}
                          className="w-full justify-start text-left p-2"
                        >
                          <div>
                            <div className="font-medium">{chapter.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(chapter.startTime)}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={enterPictureInPicture}
                className="text-white hover:bg-white/20"
              >
                <PictureInPicture className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 text-white text-sm">
                <span>{formatTime(currentTime)}</span>
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  className="flex-1"
                  step={0.1}
                />
                <span>{formatTime(duration)}</span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(-10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => skipTime(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Volume Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                      step={1}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Settings */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    {showSettings && (
                      <Card className="absolute bottom-full mb-2 right-0 w-32">
                        <CardContent className="p-2">
                          <div className="text-sm font-medium mb-2">Speed</div>
                          {playbackRates.map((rate) => (
                            <Button
                              key={rate}
                              variant={playbackRate === rate ? "default" : "ghost"}
                              size="sm"
                              onClick={() => changePlaybackRate(rate)}
                              className="w-full justify-start"
                            >
                              {rate}x
                            </Button>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
