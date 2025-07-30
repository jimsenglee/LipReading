import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  Bookmark, 
  BookmarkCheck,
  SkipBack,
  SkipForward,
  Settings,
  ArrowLeft,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import BackButton from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';

const TutorialPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock tutorial data - in real app, fetch by ID
  const tutorial = {
    id: parseInt(id || '1'),
    title: 'Mastering Basic Lip Reading Fundamentals',
    description: 'Learn the essential techniques for reading lips, starting with vowel sounds and basic consonants. This comprehensive tutorial covers the fundamental principles of lip reading.',
    duration: '45 min',
    difficulty: 'Beginner' as const,
    category: 'Fundamentals',
    instructor: 'Dr. Sarah Mitchell',
    rating: 4.8,
    students: 1240,
    videoUrl: '/api/placeholder/video/tutorial.mp4',
    chapters: [
      { id: 1, title: 'Introduction to Lip Reading', startTime: 0, duration: '5 min' },
      { id: 2, title: 'Vowel Sounds A, E, I', startTime: 300, duration: '12 min' },
      { id: 3, title: 'Vowel Sounds O, U', startTime: 1020, duration: '8 min' },
      { id: 4, title: 'Basic Consonants', startTime: 1500, duration: '15 min' },
      { id: 5, title: 'Practice Exercises', startTime: 2400, duration: '5 min' }
    ],
    tags: ['vowels', 'consonants', 'basics']
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Tutorial Library', href: '/education/tutorials' },
    { title: tutorial.title }
  ];

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

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

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark Removed" : "Tutorial Bookmarked",
      description: isBookmarked 
        ? `Removed "${tutorial.title}" from bookmarks` 
        : `Added "${tutorial.title}" to bookmarks`
    });
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const jumpToChapter = (startTime: number) => {
    handleSeek(startTime);
  };

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      <BackButton />
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-0">
              <div className="relative bg-black rounded-t-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full aspect-video"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  poster="/api/placeholder/800/450"
                >
                  <source src={tutorial.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-white text-sm mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSeek(Math.max(0, currentTime - 10))}
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
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4 text-white" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <select
                        value={playbackSpeed}
                        onChange={(e) => handleSpeedChange(Number(e.target.value))}
                        className="bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-sm"
                      >
                        {playbackSpeeds.map(speed => (
                          <option key={speed} value={speed} className="bg-black text-white">
                            {speed}x
                          </option>
                        ))}
                      </select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tutorial Info */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={tutorial.difficulty === 'Beginner' ? 'secondary' : 'default'}>
                      {tutorial.difficulty}
                    </Badge>
                    <Badge variant="outline">{tutorial.category}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{tutorial.title}</CardTitle>
                  <CardDescription className="text-base">{tutorial.description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  className="flex items-center gap-2"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{tutorial.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{tutorial.rating} rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{tutorial.students.toLocaleString()} students</span>
                </div>
                <div>
                  <span className="text-gray-500">Instructor: </span>
                  <span className="font-medium">{tutorial.instructor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Chapter Navigation */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Tutorial Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tutorial.chapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.id}
                    whileHover={{ x: 5 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      currentTime >= chapter.startTime && 
                      (index === tutorial.chapters.length - 1 || currentTime < tutorial.chapters[index + 1].startTime)
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => jumpToChapter(chapter.startTime)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{chapter.title}</h4>
                        <p className="text-xs text-gray-500">{chapter.duration}</p>
                      </div>
                      <Play className="h-3 w-3 text-primary" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Related Tutorials */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Related Tutorials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { title: 'Advanced Vowel Combinations', duration: '25 min', difficulty: 'Intermediate' },
                  { title: 'Consonant Clusters', duration: '30 min', difficulty: 'Intermediate' },
                  { title: 'Silent Letters Recognition', duration: '20 min', difficulty: 'Advanced' }
                ].map((related, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className="p-3 rounded-lg border border-gray-200 hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => navigate(`/education/tutorial/${index + 10}`)}
                  >
                    <h4 className="font-medium text-sm mb-1">{related.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{related.duration}</span>
                      <Badge variant="outline" className="text-xs">
                        {related.difficulty}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialPlayer;