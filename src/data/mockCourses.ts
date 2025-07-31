// Mock course data with YouTube videos for the Learning Management System

export interface VideoLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoId: string; // YouTube video ID
  duration: number; // in seconds
  transcript?: string;
  chapters?: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  totalDuration: number; // in minutes
  rating: number;
  studentsCount: number;
  instructor: string;
  thumbnail: string;
  lessons: VideoLesson[];
  tags: string[];
  prerequisites?: string[];
  learningOutcomes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  lessonId?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progressPercentage: number;
  videoPosition?: number;
  videoDuration?: number;
  watchedSections?: Array<{ start: number; end: number }>;
  startedAt?: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  isBookmarked: boolean;
  isFavorite: boolean;
  rating?: number;
  notes?: string;
}

export interface FilterOptions {
  contentType: 'all' | 'video' | 'quiz' | 'practice';
  progressStatus: 'all' | 'not-started' | 'in-progress' | 'completed';
  difficulty: 'all' | 'Beginner' | 'Intermediate' | 'Advanced';
  duration: 'all' | 'short' | 'medium' | 'long'; // <30min, 30-60min, >60min
  category: string[];
  searchQuery: string;
  sortBy: 'title' | 'date-added' | 'progress' | 'rating' | 'duration';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

// Sample YouTube videos for lip-reading education
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Master Basic Vowels',
    description: 'Comprehensive course on recognizing and pronouncing fundamental vowel sounds (A, E, I, O, U) with clear visual demonstrations and interactive practice sessions.',
    shortDescription: 'Learn to recognize and pronounce fundamental vowel sounds with clear visual demonstrations',
    category: 'Vowels',
    difficulty: 'Beginner',
    duration: '2h 15m',
    totalDuration: 135,
    rating: 4.8,
    studentsCount: 1542,
    instructor: 'Dr. Sarah Johnson',
    thumbnail: 'https://img.youtube.com/vi/Rj0vd6tanaU/maxresdefault.jpg',
    tags: ['vowels', 'pronunciation', 'basics', 'lip-reading'],
    learningOutcomes: [
      'Recognize all 5 vowel sounds visually',
      'Understand mouth positioning for vowels',
      'Practice with real-world examples',
      'Build foundation for advanced techniques'
    ],
    lessons: [
      {
        id: '1-1',
        title: 'Introduction to Vowel Sounds',
        description: 'Overview of vowel recognition and mouth positioning basics',
        videoUrl: 'https://www.youtube.com/watch?v=Rj0vd6tanaU',
        videoId: 'Rj0vd6tanaU',
        duration: 420, // 7 minutes
        chapters: [
          { title: 'Welcome & Overview', startTime: 0, endTime: 60 },
          { title: 'Mouth Positioning Basics', startTime: 60, endTime: 240 },
          { title: 'Visual Recognition Tips', startTime: 240, endTime: 420 }
        ]
      },
      {
        id: '1-2',
        title: 'The Letter A - Recognition & Practice',
        description: 'Deep dive into recognizing the letter A in various contexts',
        videoUrl: 'https://www.youtube.com/watch?v=Rj0vd6tanaU',
        videoId: 'Rj0vd6tanaU',
        duration: 360
      },
      {
        id: '1-3',
        title: 'The Letter E - Forms & Variations',
        description: 'Understanding different E sounds and their visual markers',
        videoUrl: 'https://www.youtube.com/watch?v=Rj0vd6tanaU',
        videoId: 'Rj0vd6tanaU',
        duration: 300
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01')
  },
  {
    id: '2',
    title: 'Common Consonant Patterns',
    description: 'Master lip-readable consonant sounds including B, P, M, and their combinations in everyday words. This course focuses on the most visible consonants and their practical applications.',
    shortDescription: 'Master lip-readable consonant sounds including B, P, M, and their combinations',
    category: 'Consonants',
    difficulty: 'Beginner',
    duration: '3h 20m',
    totalDuration: 200,
    rating: 4.7,
    studentsCount: 1205,
    instructor: 'Prof. Michael Chen',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    tags: ['consonants', 'patterns', 'lip-reading', 'pronunciation'],
    learningOutcomes: [
      'Identify common consonant patterns',
      'Recognize B, P, M sound groups',
      'Apply patterns to everyday words',
      'Improve overall lip-reading accuracy'
    ],
    lessons: [
      {
        id: '2-1',
        title: 'Visible Consonants Overview',
        description: 'Introduction to the most lip-readable consonant sounds',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        duration: 480
      },
      {
        id: '2-2',
        title: 'B, P, M Sound Group',
        description: 'Detailed analysis of bilabial consonants',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        duration: 420
      }
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-12-05')
  },
  {
    id: '3',
    title: 'Everyday Greetings & Phrases',
    description: 'Practice common social interactions: hello, goodbye, thank you, and polite conversation starters. Essential phrases for daily communication.',
    shortDescription: 'Practice common social interactions and polite conversation starters',
    category: 'Phrases',
    difficulty: 'Beginner',
    duration: '1h 45m',
    totalDuration: 105,
    rating: 4.9,
    studentsCount: 2156,
    instructor: 'Emma Rodriguez',
    thumbnail: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg',
    tags: ['greetings', 'phrases', 'social', 'communication'],
    learningOutcomes: [
      'Master common greeting phrases',
      'Recognize polite expressions',
      'Build confidence in social situations',
      'Practice real-world scenarios'
    ],
    lessons: [
      {
        id: '3-1',
        title: 'Basic Greetings',
        description: 'Hello, goodbye, and common salutations',
        videoUrl: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
        videoId: 'L_jWHffIx5E',
        duration: 360
      },
      {
        id: '3-2',
        title: 'Polite Expressions',
        description: 'Thank you, please, excuse me, and courtesy phrases',
        videoUrl: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
        videoId: 'L_jWHffIx5E',
        duration: 420
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-12-10')
  },
  {
    id: '4',
    title: 'Numbers & Time Recognition',
    description: 'Learn to read numbers 1-100, time expressions, and common counting patterns through lip-reading. Essential for practical daily communication.',
    shortDescription: 'Learn to read numbers, time expressions, and counting patterns',
    category: 'Numbers',
    difficulty: 'Intermediate',
    duration: '2h 30m',
    totalDuration: 150,
    rating: 4.6,
    studentsCount: 856,
    instructor: 'Dr. James Wilson',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    tags: ['numbers', 'time', 'counting', 'practical'],
    prerequisites: ['Basic vowel recognition'],
    learningOutcomes: [
      'Recognize numbers 1-100 visually',
      'Understand time expressions',
      'Master counting patterns',
      'Apply to real-world scenarios'
    ],
    lessons: [
      {
        id: '4-1',
        title: 'Numbers 1-20',
        description: 'Foundation numbers with clear visual markers',
        videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        videoId: '9bZkp7q19f0',
        duration: 540
      },
      {
        id: '4-2',
        title: 'Time & Clock Reading',
        description: 'Hours, minutes, and time expressions',
        videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        videoId: '9bZkp7q19f0',
        duration: 480
      }
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-12-15')
  },
  {
    id: '5',
    title: 'Question Words Mastery',
    description: 'Master the 5 W\'s: What, Where, When, Why, Who - essential for understanding conversations and asking questions effectively.',
    shortDescription: 'Master essential question words: What, Where, When, Why, Who',
    category: 'Questions',
    difficulty: 'Intermediate',
    duration: '2h 10m',
    totalDuration: 130,
    rating: 4.8,
    studentsCount: 743,
    instructor: 'Lisa Thompson',
    thumbnail: 'https://img.youtube.com/vi/kffacxfA7G4/maxresdefault.jpg',
    tags: ['questions', 'conversation', 'understanding', 'communication'],
    prerequisites: ['Basic vowels and consonants'],
    learningOutcomes: [
      'Recognize all question words visually',
      'Understand question formation',
      'Improve conversation comprehension',
      'Practice interactive scenarios'
    ],
    lessons: [
      {
        id: '5-1',
        title: 'The 5 W\'s Introduction',
        description: 'Overview of question word recognition',
        videoUrl: 'https://www.youtube.com/watch?v=kffacxfA7G4',
        videoId: 'kffacxfA7G4',
        duration: 420
      },
      {
        id: '5-2',
        title: 'What & Where Practice',
        description: 'Detailed practice with What and Where questions',
        videoUrl: 'https://www.youtube.com/watch?v=kffacxfA7G4',
        videoId: 'kffacxfA7G4',
        duration: 360
      }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-12-20')
  },
  {
    id: '6',
    title: 'Advanced Sentence Structures',
    description: 'Complex sentence patterns, idioms, and fast-paced conversation lip-reading techniques for advanced learners.',
    shortDescription: 'Complex sentence patterns, idioms, and fast-paced conversation techniques',
    category: 'Advanced',
    difficulty: 'Advanced',
    duration: '4h 15m',
    totalDuration: 255,
    rating: 4.9,
    studentsCount: 324,
    instructor: 'Dr. Sarah Johnson',
    thumbnail: 'https://img.youtube.com/vi/ZZ5LpwO-An4/maxresdefault.jpg',
    tags: ['advanced', 'sentences', 'idioms', 'fast-paced'],
    prerequisites: ['Question words mastery', 'Common phrases'],
    learningOutcomes: [
      'Handle complex sentence structures',
      'Recognize idioms and expressions',
      'Keep up with fast conversations',
      'Master advanced techniques'
    ],
    lessons: [
      {
        id: '6-1',
        title: 'Complex Grammar Patterns',
        description: 'Advanced sentence structures and grammar recognition',
        videoUrl: 'https://www.youtube.com/watch?v=ZZ5LpwO-An4',
        videoId: 'ZZ5LpwO-An4',
        duration: 720
      },
      {
        id: '6-2',
        title: 'Common Idioms & Expressions',
        description: 'Recognizing figurative language through lip-reading',
        videoUrl: 'https://www.youtube.com/watch?v=ZZ5LpwO-An4',
        videoId: 'ZZ5LpwO-An4',
        duration: 600
      }
    ],
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-12-25')
  }
];

// Mock user progress data
export const mockUserProgress: UserProgress[] = [
  {
    userId: 'user-1',
    courseId: '1',
    lessonId: '1-1',
    status: 'completed',
    progressPercentage: 100,
    videoPosition: 420,
    videoDuration: 420,
    lastAccessedAt: new Date('2024-12-20'),
    completedAt: new Date('2024-12-20'),
    isBookmarked: true,
    isFavorite: false,
    rating: 5
  },
  {
    userId: 'user-1',
    courseId: '1',
    lessonId: '1-2',
    status: 'in-progress',
    progressPercentage: 65,
    videoPosition: 234,
    videoDuration: 360,
    lastAccessedAt: new Date('2024-12-25'),
    isBookmarked: false,
    isFavorite: false
  },
  {
    userId: 'user-1',
    courseId: '2',
    status: 'completed',
    progressPercentage: 100,
    lastAccessedAt: new Date('2024-12-15'),
    completedAt: new Date('2024-12-15'),
    isBookmarked: true,
    isFavorite: true,
    rating: 4
  },
  {
    userId: 'user-1',
    courseId: '3',
    status: 'in-progress',
    progressPercentage: 45,
    lastAccessedAt: new Date('2024-12-24'),
    isBookmarked: false,
    isFavorite: true
  },
  {
    userId: 'user-1',
    courseId: '4',
    status: 'not-started',
    progressPercentage: 0,
    lastAccessedAt: new Date('2024-12-25'),
    isBookmarked: false,
    isFavorite: false
  }
];

export const categories = [
  'All',
  'Vowels', 
  'Consonants', 
  'Phrases', 
  'Numbers', 
  'Questions', 
  'Advanced'
];

export const difficultyLevels = [
  'All',
  'Beginner',
  'Intermediate', 
  'Advanced'
];

export const durationFilters = [
  { value: 'all', label: 'All Durations' },
  { value: 'short', label: 'Short (< 30 min)' },
  { value: 'medium', label: 'Medium (30-60 min)' },
  { value: 'long', label: 'Long (> 60 min)' }
];
