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
import { useTutorialSeriesById, useSeriesProgress } from '@/services/content/contentQueries';
import { useUpdateVideoProgress } from '@/services/content/contentMutations';
import { API_BASE_URL } from '@/lib/constants';
import { Video, ApiTutorial } from '@/lib/api';
import ReactPlayer from 'react-player';
import { useQueryClient } from '@tanstack/react-query';

const formatDuration = (n?: number) => (n ? `${Math.round(n/60)} min` : '0 min');
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
    return '0:00';
  }
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
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = percentage * duration;
    console.log('[VideoPlayerControls] Progress click - percentage:', percentage, 'seekTime:', seekTime);
    onSeek(seekTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = percentage * duration;
    onSeek(seekTime);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.stopPropagation();
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const seekTime = percentage * duration;
      onSeek(seekTime);
    }
  };

  const handleProgressMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const progressBar = document.querySelector('[data-progress-bar]') as HTMLElement;
        if (progressBar) {
          const rect = progressBar.getBoundingClientRect();
          const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const seekTime = percentage * duration;
          onSeek(seekTime);
        }
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, duration, onSeek]);

  // Volume dragging handler
  useEffect(() => {
    if (isDraggingVolume) {
      const handleMouseMove = (e: MouseEvent) => {
        const volumeSlider = document.querySelector('[data-volume-slider]') as HTMLElement;
        if (volumeSlider) {
          const rect = volumeSlider.getBoundingClientRect();
          const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onVolumeChange(percentage);
        }
      };
      
      const handleMouseUp = () => {
        setIsDraggingVolume(false);
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingVolume, onVolumeChange]);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div 
      data-controls
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={{ pointerEvents: 'auto', cursor: 'default' }}
    >
      {/* Redesigned Thin Progress Bar - Purple color, YouTube-style */}
      <div 
        data-progress-bar
        className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-4 group relative"
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
        onMouseUp={handleProgressMouseUp}
        style={{ pointerEvents: 'auto', userSelect: 'none', cursor: 'pointer' }}
      >
        {/* Progress indicator - purple, thinner, more refined */}
        <div 
          className="h-full bg-primary rounded-full relative transition-all"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* Single scrubber circle - visible on hover and when dragging */}
          <div 
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-lg transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>

      <div 
        className="flex items-center justify-between text-white"
        style={{ cursor: 'default' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {/* Left Controls - Play button and time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPause();
              }}
            className="text-white hover:bg-white/20 p-2"
              style={{ cursor: 'pointer' }}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

            {/* Refined Volume Control - Compact and smooth with drag support */}
            <div 
              className="relative flex items-center gap-1"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => {
                if (!isDraggingVolume) {
                  setShowVolumeSlider(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMuteToggle();
                }}
                className="text-white hover:text-white/80 p-1.5 flex items-center justify-center transition-opacity"
                title="Toggle Mute (M)"
                style={{ cursor: 'pointer' }}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              
              {/* Compact inline volume slider - appears on hover with smooth dragging */}
              {showVolumeSlider && (
                <div 
                  className="flex items-center transition-all duration-200 ease-in-out"
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: isDraggingVolume ? 'grabbing' : 'grab' }}
                >
                  <div 
                    data-volume-slider
                    className="relative w-16 h-1 bg-white/30 rounded-full cursor-pointer"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsDraggingVolume(true);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      onVolumeChange(percentage);
                    }}
                    onClick={(e) => {
                      if (!isDraggingVolume) {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        onVolumeChange(percentage);
                      }
                    }}
                  >
                    <div 
                      className="absolute h-full bg-white rounded-full transition-all"
                      style={{ 
                        width: `${volume * 100}%`,
                        transition: isDraggingVolume ? 'none' : 'width 0.1s ease-out'
                      }}
                    />
                    <div 
                      className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-all ${
                        isDraggingVolume ? 'opacity-100 scale-110' : 'opacity-0 hover:opacity-100'
                      }`}
                      style={{ 
                        left: `${volume * 100}%`, 
                        transform: 'translate(-50%, -50%)',
                        transition: isDraggingVolume ? 'none' : 'opacity 0.15s ease-out, transform 0.15s ease-out'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls - Only buttons are clickable */}
          <div 
          className="flex items-center gap-2 bg-primary/20 rounded-lg px-2 py-1"
          style={{ cursor: 'default' }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          >
          {/* Subtitle Control */}
          {hasSubtitles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubtitles();
              }}
              className={`text-white hover:bg-white/20 p-2 ${
                subtitlesEnabled ? 'bg-primary/50' : ''
              }`}
              title="Toggle Subtitles (C)"
              style={{ cursor: 'pointer' }}
            >
              <Subtitles className="h-4 w-4" />
            </Button>
          )}

          {/* Speed Control */}
          <div 
            className="relative"
            onMouseEnter={() => setShowSpeedMenu(true)}
            onMouseLeave={() => setShowSpeedMenu(false)}
            style={{ cursor: 'pointer' }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-white hover:bg-white/20 p-2 text-xs font-medium min-w-[40px]"
              title="Change Speed"
              style={{ cursor: 'pointer' }}
            >
              {playbackSpeed}x
            </Button>
            
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 rounded p-1 min-w-[60px] z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeedChange(speed);
                      }}
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
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
            className="text-white hover:bg-white/20 p-2"
            title="Fullscreen (F)"
            style={{ cursor: 'pointer' }}
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
  const queryClient = useQueryClient();
  
  // fetch user progress for this series
  const progressQuery = useSeriesProgress(Number(seriesId));
  const userProgress = progressQuery.data;
  
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
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitleLines, setSubtitleLines] = useState<Array<{start: number, end: number, text: string}>>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  // get series and video data from API response - only when loading is complete
  const series = seriesQuery.isLoading ? undefined : seriesQuery.data;
  const video = series?.videos?.find(v => v.id === Number(videoId));

  // Construct full video URL - only when data is loaded
  const videoUrl = video?.videoPath 
    ? (video.videoPath.startsWith('http') ? video.videoPath : `${API_BASE_URL}${video.videoPath}`)
    : null;

  // Debug: Log only when data is ready and test video URL accessibility
  useEffect(() => {
    if (seriesQuery.isLoading === false && videoUrl) {
      console.log('[VideoPlayerPage] Data loaded - series:', series ? 'found' : 'not found');
      console.log('[VideoPlayerPage] Video:', video ? `found (id=${video.id}, path=${video.videoPath})` : 'not found');
      console.log('[VideoPlayerPage] Video URL:', videoUrl);
      console.log('[VideoPlayerPage] Should render ReactPlayer:', !seriesQuery.isLoading && video && videoUrl);
      
      // Test if video URL is accessible
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          console.log('[VideoPlayerPage] Video URL HEAD request:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
            url: response.url
          });
        })
        .catch(error => {
          console.error('[VideoPlayerPage] Video URL HEAD request failed:', error);
        });
    }
  }, [seriesQuery.isLoading, series, video, videoUrl]);

  // Fix: Manually set video src if ReactPlayer doesn't set it
  useEffect(() => {
    if (!videoUrl) return;
    
    // Wait for ReactPlayer to render the video element
    const checkAndSetSrc = () => {
      const videoElement = containerRef.current?.querySelector('video');
      if (videoElement) {
        console.log('[VideoPlayerPage] Found video element, current src:', videoElement.src);
        if (!videoElement.src || videoElement.src === '' || !videoElement.src.includes(videoUrl)) {
          console.log('[VideoPlayerPage] Video element has no src, setting it manually to:', videoUrl);
          videoElement.src = videoUrl;
          videoElement.load(); // Force reload with new src
          console.log('[VideoPlayerPage] Video src set, new src:', videoElement.src);
        }
      }
    };
    
    // Try immediately
    checkAndSetSrc();
    
    // Also try after short delays to catch ReactPlayer rendering
    const timeout1 = setTimeout(checkAndSetSrc, 100);
    const timeout2 = setTimeout(checkAndSetSrc, 500);
    const timeout3 = setTimeout(checkAndSetSrc, 1000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [videoUrl]);

  // Check if video has subtitles
  const hasSubtitles = Boolean(video?.subtitlePath);

  // video progress mutation hook
  const updateVideoProgressMutation = useUpdateVideoProgress();
  
  // check if current video is completed
  const isVideoCompletedByUser = userProgress?.completedVideos?.includes(String(video?.id)) || false;

  const markVideoCompleted = useCallback(async () => {
    if (!video?.id || isVideoCompletedByUser) return; // don't mark again if already completed
    
    try {
      await updateVideoProgressMutation.mutateAsync({
        tutorialId: Number(video.id),
        progressData: {
          is_completed: true,
          progress_percentage: 100
        }
      });
      
      setIsVideoCompleted(true);
      // invalidate progress query to refresh data
      queryClient.invalidateQueries({ queryKey: ['series-progress', Number(seriesId)] });
      
      toast({
        title: "Progress Saved!",
        description: `"${video?.title}" marked as completed.`,
      });
    } catch (error: any) {
      console.error('[VideoPlayerPage] Failed to mark video as completed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.error || "Failed to save progress. Please try again.",
      });
    }
  }, [video?.id, video?.title, toast, updateVideoProgressMutation, isVideoCompletedByUser, queryClient, seriesId]);

  // Define all handlers FIRST before keyboard controls
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    console.log('[VideoPlayerPage] handleSeek called with time:', time);
    
    // Try to find video element directly in DOM
    const videoElement = containerRef.current?.querySelector('video');
    if (videoElement) {
      console.log('[VideoPlayerPage] Found video element, seeking to:', time);
      videoElement.currentTime = time;
      setCurrentTime(time);
      return;
    }
    
    // Fallback to ReactPlayer methods
    if (videoRef.current) {
      if (typeof videoRef.current.seekTo === 'function') {
        console.log('[VideoPlayerPage] Using ReactPlayer seekTo');
        videoRef.current.seekTo(time);
        setCurrentTime(time);
      } else if (typeof videoRef.current.getInternalPlayer === 'function') {
        const player = videoRef.current.getInternalPlayer();
        if (player && 'currentTime' in player) {
          console.log('[VideoPlayerPage] Using internal player currentTime');
          player.currentTime = time;
          setCurrentTime(time);
        }
      }
    }
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
    if (!duration) return;
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

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'escape':
          e.preventDefault();
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          skipToTime(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skipToTime(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'c':
          if (hasSubtitles) {
            e.preventDefault();
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
    if (video?.subtitlePath && subtitlesEnabled && seriesQuery.isLoading === false) {
      const loadSubtitles = async () => {
        try {
          const subtitleUrl = video.subtitlePath.startsWith('http') 
            ? video.subtitlePath 
            : `${API_BASE_URL}${video.subtitlePath}`;
          const response = await fetch(subtitleUrl);
          const text = await response.text();
          const lines = parseVTT(text);
          setSubtitleLines(lines);
        } catch (error) {
          console.error('[VideoPlayerPage] Failed to load subtitles:', error);
        }
      };
      loadSubtitles();
    }
  }, [video?.subtitlePath, subtitlesEnabled, seriesQuery.isLoading]);

  // Update current subtitle based on currentTime
  useEffect(() => {
    if (!subtitlesEnabled || subtitleLines.length === 0) {
      setCurrentSubtitle('');
      return;
    }

    const activeLine = subtitleLines.find(line => 
      currentTime >= line.start && currentTime < line.end
    );
    const subtitleText = activeLine?.text || '';
    console.log('[VideoPlayerPage] Current time:', currentTime, 'Subtitle:', subtitleText);
    setCurrentSubtitle(subtitleText);
  }, [currentTime, subtitleLines, subtitlesEnabled]);

  // initialize video completion status when video loads
  useEffect(() => {
    if (video && userProgress) {
      setIsVideoCompleted(isVideoCompletedByUser);
    }
  }, [video, userProgress, isVideoCompletedByUser]);

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

  // Show loading state while data is being fetched
  if (seriesQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600 mb-4">Please wait while we load the video data.</p>
        </div>
      </div>
    );
  }

  // Show error state if query failed
  if (seriesQuery.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Video</h1>
          <p className="text-gray-600 mb-4">{seriesQuery.error.message || 'Failed to load video data.'}</p>
          <Button onClick={() => navigate('/education')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Education
          </Button>
        </div>
      </div>
    );
  }

  // Show not found if series or video doesn't exist
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

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: series.title, href: `/education/series/${series.id}` },
    { title: video.title }
  ];

  const navigateToVideo = (targetVideo: Video) => {
    navigate(`/education/series/${series.id}/video/${targetVideo.id}`);
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
                  ref={containerRef}
                  className="relative bg-black group"
                  tabIndex={0}
                  onMouseMove={() => setShowControls(true)}
                  onMouseLeave={() => isPlaying && setShowControls(false)}
                  onDoubleClick={handleFullscreen}
                  onClick={(e) => {
                    // Only trigger play/pause if clicking on video area, not control panel
                    const target = e.target as HTMLElement;
                    const isControlPanel = target.closest('[data-controls]') ||
                                          target.closest('[data-progress-bar]') ||
                                          target.closest('button') ||
                                          target.closest('[role="button"]');
                    
                    // If clicking on control panel, don't toggle play/pause
                    if (isControlPanel) {
                      return;
                    }
                    
                    // Otherwise, toggle play/pause (YouTube behavior)
                    handlePlayPause();
                  }}
                  style={{ width: '100%', paddingTop: '56.25%', cursor: showControls ? 'pointer' : 'none' }}
                >
                  {/* ReactPlayer integration - only render when data is fully loaded */}
                  {!seriesQuery.isLoading && video && videoUrl ? (
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
                      <ReactPlayer
                        key={videoUrl}
                    ref={videoRef}
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        playing={isPlaying}
                        volume={isMuted ? 0 : volume}
                        playbackRate={playbackSpeed}
                        playsinline={true}
                        light={false}
                        pip={false}
                        // @ts-ignore - ReactPlayer onProgress type
                        onProgress={(state: { playedSeconds: number; loadedSeconds: number; loaded: number }) => {
                          setCurrentTime(state.playedSeconds);
                          if (state.loadedSeconds > 0 && duration === 0) {
                            if (videoRef.current?.getDuration) {
                              try {
                                const playerDuration = videoRef.current.getDuration();
                                if (playerDuration && playerDuration > 0 && !isNaN(playerDuration)) {
                                  setDuration(playerDuration);
                                }
                              } catch (e) {
                                console.error('[VideoPlayerPage] Error getting duration:', e);
                              }
                            }
                          }
                        }}
                        onReady={() => {
                          console.log('[VideoPlayerPage] ReactPlayer onReady - player is ready');
                          
                          // Find video element and ensure it has src
                          const videoElement = containerRef.current?.querySelector('video');
                          if (videoElement) {
                            console.log('[VideoPlayerPage] Video element in onReady, src:', videoElement.src);
                            
                            // Force set src if empty
                            if (!videoElement.src || videoElement.src === '') {
                              console.log('[VideoPlayerPage] Video src is empty in onReady, setting to:', videoUrl);
                              videoElement.src = videoUrl;
                              videoElement.load();
                            }
                            
                            // Set up event listeners directly on video element
                            const handleLoadedMetadata = () => {
                              console.log('[VideoPlayerPage] Video loadedmetadata - duration:', videoElement.duration);
                              if (videoElement.duration) {
                                setDuration(videoElement.duration);
                              }
                            };
                            
                            const handleTimeUpdate = () => {
                              setCurrentTime(videoElement.currentTime);
                            };
                            
                            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
                            videoElement.addEventListener('timeupdate', handleTimeUpdate);
                            
                            // Try to get duration immediately
                            if (videoElement.duration) {
                              setDuration(videoElement.duration);
                            }
                          }
                        }}
                        onStart={() => {
                          console.log('[VideoPlayerPage] ReactPlayer onStart - video started loading');
                        }}
                        onError={(error: any) => {
                          console.error('[VideoPlayerPage] ReactPlayer error:', error);
                          const internalPlayer = videoRef.current?.getInternalPlayer?.();
                          if (internalPlayer?.error) {
                            console.error('[VideoPlayerPage] Video element error code:', internalPlayer.error.code);
                            console.error('[VideoPlayerPage] Video element error message:', internalPlayer.error.message);
                          }
                          toast({
                            variant: "destructive",
                            title: "Video Load Error",
                            description: `Failed to load video: ${error?.message || 'Please check if the video file exists.'}`,
                          });
                        }}
                        onPlay={() => {
                          console.log('[VideoPlayerPage] ReactPlayer onPlay - video started playing');
                          setIsPlaying(true);
                        }}
                        onPause={() => {
                          console.log('[VideoPlayerPage] ReactPlayer onPause - video paused');
                          setIsPlaying(false);
                        }}
                        onEnded={() => {
                          setIsPlaying(false);
                          if (!isVideoCompletedByUser) {
                            markVideoCompleted();
                          }
                        }}
                        controls={false}
                      />
                    </div>
                  ) : !seriesQuery.isLoading && video && !videoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-white text-center">
                        <p className="text-lg font-semibold mb-2">Video URL Not Available</p>
                        <p className="text-sm">videoPath: {video.videoPath || 'undefined'}</p>
                        <p className="text-sm">Please check the video configuration.</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Play button overlay - only show when paused, visual only, clicking anywhere works */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
                      style={{ zIndex: 10, pointerEvents: 'none', cursor: 'pointer' }}
                    >
                      <Button
                        size="lg"
                        className="rounded-full w-20 h-20 bg-primary/90 hover:bg-primary text-white pointer-events-none"
                      >
                        <Play className="h-8 w-8 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Subtitle Overlay - Fixed positioning */}
                  {subtitlesEnabled && (
                    <div 
                      className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-black/80 rounded-lg max-w-[85%] pointer-events-none"
                      style={{ zIndex: 15 }}
                    >
                      {currentSubtitle ? (
                        <p className="text-white text-center text-xl font-semibold drop-shadow-lg">
                          {currentSubtitle}
                        </p>
                      ) : (
                        <p className="text-white/50 text-center text-sm">
                          Subtitles enabled
                        </p>
                      )}
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
                        style={{ zIndex: 20, position: 'relative' }}
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
