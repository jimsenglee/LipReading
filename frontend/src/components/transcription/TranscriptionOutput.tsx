import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Edit3,
  Save,
  X,
  Copy,
  Download,
  FileText,
  Clock,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TranscriptionSegment {
  timestamp: number;
  text: string;
  confidence?: number;
}

interface TranscriptionOutputProps {
  videoSrc?: string;
  transcriptionSegments: TranscriptionSegment[];
  onTranscriptionUpdate?: (segments: TranscriptionSegment[]) => void;
}

const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({
  videoSrc,
  transcriptionSegments,
  onTranscriptionUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  
  const videoRef = useRef<any>(null);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const feedbackToast = useFeedbackToast();
  const [isBuffering, setIsBuffering] = useState(false);

  // Get current active segment based on video time
  const getCurrentSegmentIndex = () => {
    for (let i = transcriptionSegments.length - 1; i >= 0; i--) {
      if (currentTime >= transcriptionSegments[i].timestamp) {
        return i;
      }
    }
    return -1;
  };

  const currentSegmentIndex = getCurrentSegmentIndex();
  
  // Convert segments to full text
  const fullTranscriptionText = transcriptionSegments
    .map(segment => segment.text)
    .join(' ');

  // Format timestamp for display
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle playback speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  // Seek to timestamp
  const seekToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.seekTo(timestamp);
      setCurrentTime(timestamp);
    }
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.seekTo(newTime);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current?.getInternalPlayer()?.requestFullscreen) {
        videoRef.current.getInternalPlayer().requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Start editing transcription
  const startEditing = () => {
    setIsEditing(true);
    setEditedText(fullTranscriptionText);
  };

  // Save edited transcription
  const saveTranscription = () => {
    // Update the segments with the edited text
    const updatedSegments = transcriptionSegments.map((segment, index) => ({
      ...segment,
      text: index === 0 ? editedText : '' // Simplified - put all text in first segment
    }));
    
    onTranscriptionUpdate?.(updatedSegments);
    setIsEditing(false);
    
    feedbackToast.success(
      "Transcription Updated",
      "Your changes have been saved successfully"
    );
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditedText('');
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullTranscriptionText);
      feedbackToast.success("Copied!", "Transcription copied to clipboard");
    } catch (error) {
      feedbackToast.error("Copy Failed", "Could not copy to clipboard");
    }
  };

  // Download transcription
  const downloadTranscription = (format: 'txt' | 'srt' | 'vtt') => {
    let content = '';
    const filename = `transcription.${format}`;
    let mimeType = 'text/plain';

    switch (format) {
      case 'txt':
        content = fullTranscriptionText;
        break;
      case 'srt':
        content = transcriptionSegments
          .map((segment, index) => {
            const start = formatTimestamp(segment.timestamp);
            const end = formatTimestamp(segment.timestamp + 5); // Assume 5-second segments
            return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
          })
          .join('\n');
        mimeType = 'application/x-subrip';
        break;
      case 'vtt':
        content = `WEBVTT\n\n${transcriptionSegments
          .map(segment => {
            const start = formatTimestamp(segment.timestamp);
            const end = formatTimestamp(segment.timestamp + 5);
            return `${start} --> ${end}\n${segment.text}\n`;
          })
          .join('\n')}`;
        mimeType = 'text/vtt';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    feedbackToast.success(
      "Download Started",
      `Transcription exported as ${format.toUpperCase()}`
    );
  };

  // Fullscreen event handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Video Player */}
      {videoSrc && (
        <div className="xl:col-span-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-primary">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Video Player
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Container */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {/* ReactPlayer integration */}
                <ReactPlayer
                  ref={videoRef}
                  url={videoSrc}
                  width="100%"
                  height="100%"
                  playing={isPlaying}
                  volume={isMuted ? 0 : volume}
                  playbackRate={playbackSpeed}
                  onProgress={(state: any) => setCurrentTime(state.playedSeconds)}
                  onDuration={(duration: any) => setDuration(duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onBuffer={() => setIsBuffering(true)}
                  onBufferEnd={() => setIsBuffering(false)}
                  controls={false}
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
                
                {/* Video Overlay Controls */}
                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={togglePlayPause}
                      className="bg-black/50 text-white hover:bg-black/70 rounded-full p-4"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video Controls */}
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {formatTimestamp(currentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        if (videoRef.current) {
                          videoRef.current.seekTo(time);
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary 
                                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #7E57C2 0%, #7E57C2 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12">
                    {formatTimestamp(duration)}
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => skipTime(-10)}
                      className="border-primary/20 text-primary"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={togglePlayPause}
                      className="border-primary/20 text-primary"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => skipTime(10)}
                      className="border-primary/20 text-primary"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleMute}
                        className="text-primary hover:bg-primary/10"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer
                                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                                  [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                  [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-primary 
                                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #7E57C2 0%, #7E57C2 ${(isMuted ? 0 : volume) * 100}%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Playback Speed */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="border-primary/20 text-primary">
                          {playbackSpeed}x
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <DropdownMenuItem
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                          >
                            {speed}x
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fullscreen */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFullscreen}
                      className="border-primary/20 text-primary"
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transcription Panel */}
      <div className={videoSrc ? "" : "xl:col-span-3"}>
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-primary">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcription
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startEditing}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => downloadTranscription('txt')}>
                      Download as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadTranscription('srt')}>
                      Download as SRT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadTranscription('vtt')}>
                      Download as VTT
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Edit the transcription text to correct any inaccuracies' : 'Click on timestamps to navigate to specific parts of the video'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-64 border-primary/20 focus:border-primary"
                  placeholder="Edit your transcription here..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={saveTranscription}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                ref={transcriptionRef}
                className="space-y-4 max-h-96 overflow-y-auto"
              >
                {transcriptionSegments.length > 0 ? (
                  transcriptionSegments.map((segment, index) => (
                    <div
                      key={index}
                      className={`group p-4 border rounded-lg transition-all duration-200 ${
                        index === currentSegmentIndex
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-primary/10 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seekToTimestamp(segment.timestamp)}
                          className={`shrink-0 transition-colors ${
                            index === currentSegmentIndex
                              ? 'text-primary bg-primary/20 hover:bg-primary/30'
                              : 'text-primary hover:bg-primary/10'
                          }`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(segment.timestamp)}
                        </Button>
                        <div className="flex-1">
                          <p className={`leading-relaxed transition-colors ${
                            index === currentSegmentIndex ? 'text-gray-900 font-medium' : 'text-gray-800'
                          }`}>
                            {segment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No transcription available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TranscriptionOutput;