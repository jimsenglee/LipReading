// Tutorial Series Data Structure for Enhanced Educational Flow

export interface Video {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  videoUrl?: string;
  thumbnailUrl: string;
  order: number;
  isAdvanced?: boolean; // For warning modals
  transcriptUrl?: string;
}

export interface UserProgress {
  status: 'not-started' | 'in-progress' | 'completed';
  enrolledAt?: string; // ISO date string
  completedVideos: string[]; // Array of video IDs
  completedAt?: string; // ISO date string
  lastWatchedVideo?: string; // Video ID
  totalWatchTime: number; // in seconds
}

export interface SeriesRating {
  average: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export interface TutorialSeries {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  thumbnailUrl: string;
  videos: Video[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  prerequisites?: string[];
  learningObjectives: string[];
  tags: string[];
  instructor: string;
  totalDuration: number; // Total duration in seconds
  estimatedCompletionTime: string; // Human readable (e.g., "2-3 hours")
  rating: SeriesRating;
  userProgress?: UserProgress;
  createdAt: string;
  updatedAt: string;
}

// Mock Tutorial Series Data
export const mockTutorialSeries: TutorialSeries[] = [
  {
    id: 'series-001',
    title: 'Fundamental Lip Reading Basics',
    description: 'Master the essential foundations of lip reading with clear visual demonstrations and practice exercises.',
    detailedDescription: 'This comprehensive series introduces you to the fundamental concepts of lip reading. You\'ll learn about mouth shapes, facial expressions, and the basic visual cues that form the foundation of effective lip reading. Perfect for absolute beginners.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'beginner',
    category: 'Fundamentals',
    prerequisites: [],
    learningObjectives: [
      'Understand basic mouth shapes and positions',
      'Recognize common vowel formations',
      'Identify simple consonant patterns',
      'Practice with slow-paced speech examples'
    ],
    tags: ['basics', 'fundamentals', 'beginner', 'mouth-shapes'],
    instructor: 'Dr. Sarah Mitchell',
    totalDuration: 2847, // ~47 minutes
    estimatedCompletionTime: '1-2 hours',
    rating: {
      average: 4.8,
      totalReviews: 234,
      distribution: { 5: 180, 4: 35, 3: 12, 2: 4, 1: 3 }
    },
    videos: [
      {
        id: 'video-001-01',
        title: 'Introduction to Lip Reading',
        description: 'Welcome to lip reading! Learn what lip reading is and why it\'s a valuable skill.',
        duration: 420, // 7 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-001-02',
        title: 'Understanding Mouth Shapes',
        description: 'Explore the basic mouth shapes and how they correspond to different sounds.',
        duration: 615, // 10.25 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-001-03',
        title: 'Vowel Recognition Basics',
        description: 'Learn to identify the five basic vowel sounds through visual cues.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-001-04',
        title: 'Common Consonant Patterns',
        description: 'Discover how to recognize the most frequently used consonant combinations.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4
      },
      {
        id: 'video-001-05',
        title: 'Practice Session: Basic Words',
        description: 'Apply what you\'ve learned with guided practice using simple, everyday words.',
        duration: 552, // 9.2 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      }
    ],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T14:30:00Z'
  },
  {
    id: 'series-002',
    title: 'Advanced Phoneme Recognition',
    description: 'Dive deep into complex phoneme patterns and advanced visual speech recognition techniques.',
    detailedDescription: 'Building on fundamental skills, this advanced series focuses on distinguishing between similar-looking phonemes and mastering complex speech patterns. Includes challenging exercises and real-world applications.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'advanced',
    category: 'Phonemes',
    prerequisites: ['Fundamental Lip Reading Basics'],
    learningObjectives: [
      'Distinguish between similar phonemes',
      'Master complex consonant clusters',
      'Recognize rapid speech patterns',
      'Handle unclear or partial visual information'
    ],
    tags: ['phonemes', 'advanced', 'speech-patterns', 'recognition'],
    instructor: 'Prof. Michael Chen',
    totalDuration: 3960, // ~66 minutes
    estimatedCompletionTime: '2-3 hours',
    rating: {
      average: 4.6,
      totalReviews: 156,
      distribution: { 5: 95, 4: 42, 3: 13, 2: 4, 1: 2 }
    },
    videos: [
      {
        id: 'video-002-01',
        title: 'Complex Phoneme Differentiation',
        description: 'Learn to distinguish between phonemes that look similar but sound different.',
        duration: 780, // 13 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1,
        isAdvanced: true
      },
      {
        id: 'video-002-02',
        title: 'Consonant Cluster Mastery',
        description: 'Master the recognition of complex consonant combinations in speech.',
        duration: 900, // 15 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2,
        isAdvanced: true
      },
      {
        id: 'video-002-03',
        title: 'Rapid Speech Recognition',
        description: 'Techniques for following fast-paced conversations and quick speakers.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3,
        isAdvanced: true
      },
      {
        id: 'video-002-04',
        title: 'Handling Unclear Speech',
        description: 'Strategies for understanding speech when visual cues are partial or unclear.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4,
        isAdvanced: true
      },
      {
        id: 'video-002-05',
        title: 'Advanced Practice Scenarios',
        description: 'Challenge yourself with complex, real-world lip reading scenarios.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5,
        isAdvanced: true
      },
      {
        id: 'video-002-06',
        title: 'Assessment and Review',
        description: 'Test your advanced skills and review key concepts from this series.',
        duration: 360, // 6 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 6,
        isAdvanced: true
      }
    ],
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2024-12-10T16:45:00Z'
  },
  {
    id: 'series-003',
    title: 'Everyday Conversation Mastery',
    description: 'Practice lip reading with real-world conversation scenarios and common social interactions.',
    detailedDescription: 'This practical series focuses on everyday conversation scenarios you encounter in daily life. Learn to follow multi-person conversations, understand context clues, and handle real-world speaking patterns.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'intermediate',
    category: 'Conversations',
    prerequisites: ['Fundamental Lip Reading Basics'],
    learningObjectives: [
      'Follow multi-person conversations',
      'Understand contextual speech patterns',
      'Master common phrases and expressions',
      'Handle different speaking styles and accents'
    ],
    tags: ['conversations', 'practical', 'social', 'everyday'],
    instructor: 'Emma Rodriguez',
    totalDuration: 3240, // 54 minutes
    estimatedCompletionTime: '2-3 hours',
    rating: {
      average: 4.7,
      totalReviews: 198,
      distribution: { 5: 142, 4: 38, 3: 12, 2: 4, 1: 2 }
    },
    videos: [
      {
        id: 'video-003-01',
        title: 'Restaurant Conversations',
        description: 'Practice lip reading in restaurant settings with waiters, orders, and dining conversations.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-003-02',
        title: 'Shopping and Retail Interactions',
        description: 'Navigate shopping scenarios, price discussions, and customer service interactions.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-003-03',
        title: 'Family and Friends Conversations',
        description: 'Understand casual, relaxed speech patterns in family and social settings.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-003-04',
        title: 'Workplace Communication',
        description: 'Master professional conversations, meetings, and workplace interactions.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4
      },
      {
        id: 'video-003-05',
        title: 'Phone and Video Calls',
        description: 'Special techniques for lip reading during phone calls and video conferences.',
        duration: 420, // 7 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      },
      {
        id: 'video-003-06',
        title: 'Group Conversations',
        description: 'Navigate complex multi-person discussions and group dynamics.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 6
      }
    ],
    createdAt: '2024-11-20T11:30:00Z',
    updatedAt: '2024-12-08T13:15:00Z'
  },
  {
    id: 'series-004',
    title: 'Numbers and Time Recognition',
    description: 'Master the visual recognition of numbers, dates, times, and mathematical expressions.',
    detailedDescription: 'A specialized series focusing on the unique challenges of reading numbers, times, dates, and mathematical expressions through lip reading. Essential for practical daily communication.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'beginner',
    category: 'Numbers',
    prerequisites: [],
    learningObjectives: [
      'Recognize all digits 0-9 visually',
      'Understand time expressions and formats',
      'Master date and calendar terminology',
      'Handle mathematical and measurement terms'
    ],
    tags: ['numbers', 'time', 'dates', 'mathematics', 'practical'],
    instructor: 'David Kim',
    totalDuration: 2160, // 36 minutes
    estimatedCompletionTime: '1-2 hours',
    rating: {
      average: 4.5,
      totalReviews: 89,
      distribution: { 5: 52, 4: 25, 3: 8, 2: 3, 1: 1 }
    },
    videos: [
      {
        id: 'video-004-01',
        title: 'Single Digit Recognition',
        description: 'Learn to identify numbers 0-9 through visual speech patterns.',
        duration: 360, // 6 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-004-02',
        title: 'Multi-Digit Numbers',
        description: 'Practice with larger numbers, phone numbers, and addresses.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-004-03',
        title: 'Time Expressions',
        description: 'Master clock times, schedules, and time-related vocabulary.',
        duration: 420, // 7 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-004-04',
        title: 'Dates and Calendar Terms',
        description: 'Understand dates, months, years, and calendar-related expressions.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4
      },
      {
        id: 'video-004-05',
        title: 'Mathematical Expressions',
        description: 'Learn to recognize basic math terms, measurements, and calculations.',
        duration: 360, // 6 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      }
    ],
    createdAt: '2024-11-25T08:00:00Z',
    updatedAt: '2024-12-05T10:20:00Z'
  },
  {
    id: 'series-005',
    title: 'Medical Communication Essentials',
    description: 'Essential lip reading skills for medical appointments, health discussions, and emergency situations.',
    detailedDescription: 'This specialized series prepares you for medical and health-related communications. Learn crucial medical vocabulary, emergency phrases, and how to follow complex medical explanations through lip reading.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'intermediate',
    category: 'Medical',
    prerequisites: ['Fundamental Lip Reading Basics'],
    learningObjectives: [
      'Understand medical terminology and procedures',
      'Follow doctor-patient conversations',
      'Recognize emergency and urgent communications',
      'Master health-related vocabulary and symptoms'
    ],
    tags: ['medical', 'health', 'emergency', 'healthcare', 'specialized'],
    instructor: 'Dr. Lisa Thompson',
    totalDuration: 2880, // 48 minutes
    estimatedCompletionTime: '2-3 hours',
    rating: {
      average: 4.9,
      totalReviews: 67,
      distribution: { 5: 58, 4: 7, 3: 1, 2: 1, 1: 0 }
    },
    videos: [
      {
        id: 'video-005-01',
        title: 'Doctor Appointment Basics',
        description: 'Navigate typical doctor-patient conversations and medical consultations.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-005-02',
        title: 'Medical Terminology Fundamentals',
        description: 'Learn essential medical vocabulary and anatomical terms.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-005-03',
        title: 'Pharmacy and Prescription Instructions',
        description: 'Understand medication instructions, dosages, and pharmacy interactions.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-005-04',
        title: 'Emergency Situations',
        description: 'Critical communication skills for emergency and urgent medical situations.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4,
        isAdvanced: true
      },
      {
        id: 'video-005-05',
        title: 'Symptoms and Health Descriptions',
        description: 'Express and understand descriptions of symptoms, pain, and health conditions.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      }
    ],
    createdAt: '2024-12-01T14:00:00Z',
    updatedAt: '2024-12-12T11:45:00Z'
  },
  {
    id: 'series-006',
    title: 'Business Communication Mastery',
    description: 'Professional lip reading skills for meetings, presentations, and workplace interactions.',
    detailedDescription: 'Elevate your professional communication with advanced business lip reading skills. Perfect for meetings, presentations, networking events, and career advancement in professional environments.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'advanced',
    category: 'Business',
    prerequisites: ['Fundamental Lip Reading Basics', 'Everyday Conversation Mastery'],
    learningObjectives: [
      'Excel in business meetings and presentations',
      'Master professional vocabulary and jargon',
      'Handle conference calls and video meetings',
      'Navigate networking and professional events'
    ],
    tags: ['business', 'professional', 'meetings', 'presentations', 'career'],
    instructor: 'Robert Johnson',
    totalDuration: 3600, // 60 minutes
    estimatedCompletionTime: '3-4 hours',
    rating: {
      average: 4.4,
      totalReviews: 45,
      distribution: { 5: 25, 4: 15, 3: 3, 2: 1, 1: 1 }
    },
    videos: [
      {
        id: 'video-006-01',
        title: 'Business Meeting Dynamics',
        description: 'Navigate complex business meetings with multiple speakers and topics.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1,
        isAdvanced: true
      },
      {
        id: 'video-006-02',
        title: 'Presentation and Public Speaking',
        description: 'Follow presentations, speeches, and formal business communications.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2,
        isAdvanced: true
      },
      {
        id: 'video-006-03',
        title: 'Technical and Industry Jargon',
        description: 'Master specialized vocabulary and technical terms in business contexts.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3,
        isAdvanced: true
      },
      {
        id: 'video-006-04',
        title: 'Negotiation and Sales Conversations',
        description: 'Navigate complex negotiations, sales discussions, and deal-making conversations.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4,
        isAdvanced: true
      },
      {
        id: 'video-006-05',
        title: 'International Business Communication',
        description: 'Handle accents, cultural differences, and international business etiquette.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5,
        isAdvanced: true
      },
      {
        id: 'video-006-06',
        title: 'Virtual Meeting Mastery',
        description: 'Excel at video conferences, remote meetings, and digital communication.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 6,
        isAdvanced: true
      }
    ],
    createdAt: '2024-11-10T16:00:00Z',
    updatedAt: '2024-12-03T09:30:00Z'
  },
  {
    id: 'series-007',
    title: 'Children\'s Speech Patterns',
    description: 'Specialized techniques for understanding children\'s speech through lip reading.',
    detailedDescription: 'Children speak differently than adults, with unique patterns, vocabulary, and speech development stages. This series teaches you to understand and communicate effectively with children of all ages.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'intermediate',
    category: 'Specialized',
    prerequisites: ['Fundamental Lip Reading Basics'],
    learningObjectives: [
      'Understand developmental speech patterns',
      'Recognize age-appropriate vocabulary',
      'Handle unclear or developing pronunciation',
      'Communicate effectively with children'
    ],
    tags: ['children', 'family', 'development', 'specialized', 'education'],
    instructor: 'Maria Gonzalez',
    totalDuration: 2520, // 42 minutes
    estimatedCompletionTime: '2-3 hours',
    rating: {
      average: 4.6,
      totalReviews: 78,
      distribution: { 5: 48, 4: 22, 3: 6, 2: 1, 1: 1 }
    },
    videos: [
      {
        id: 'video-007-01',
        title: 'Toddler Communication Basics',
        description: 'Understanding early speech development and toddler communication patterns.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-007-02',
        title: 'School Age Conversations',
        description: 'Navigate conversations with school-aged children and their unique vocabulary.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-007-03',
        title: 'Teen Communication Styles',
        description: 'Understand teenage speech patterns, slang, and communication preferences.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-007-04',
        title: 'Educational Settings',
        description: 'Lip reading in classrooms, parent-teacher conferences, and educational environments.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4
      },
      {
        id: 'video-007-05',
        title: 'Play and Recreation Communication',
        description: 'Understanding children during play, sports, and recreational activities.',
        duration: 420, // 7 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      }
    ],
    createdAt: '2024-11-18T12:00:00Z',
    updatedAt: '2024-12-01T15:20:00Z'
  },
  {
    id: 'series-008',
    title: 'Accent and Dialect Recognition',
    description: 'Master lip reading across different accents, dialects, and speaking styles.',
    detailedDescription: 'Expand your lip reading abilities to understand speakers with various accents and regional dialects. This advanced series covers common accent patterns and adaptation strategies.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'advanced',
    category: 'Advanced Techniques',
    prerequisites: ['Fundamental Lip Reading Basics', 'Advanced Phoneme Recognition'],
    learningObjectives: [
      'Recognize common accent patterns',
      'Adapt to regional speech variations',
      'Handle non-native speaker patterns',
      'Master accent-specific visual cues'
    ],
    tags: ['accents', 'dialects', 'advanced', 'international', 'diversity'],
    instructor: 'Dr. James Wilson',
    totalDuration: 3300, // 55 minutes
    estimatedCompletionTime: '3-4 hours',
    rating: {
      average: 4.3,
      totalReviews: 92,
      distribution: { 5: 48, 4: 32, 3: 8, 2: 3, 1: 1 }
    },
    videos: [
      {
        id: 'video-008-01',
        title: 'Regional American Accents',
        description: 'Navigate Southern, Midwestern, and regional American speech patterns.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1,
        isAdvanced: true
      },
      {
        id: 'video-008-02',
        title: 'British and International English',
        description: 'Understand British, Australian, and other English-speaking accent variations.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2,
        isAdvanced: true
      },
      {
        id: 'video-008-03',
        title: 'Non-Native Speaker Patterns',
        description: 'Adapt to speakers for whom English is a second language.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3,
        isAdvanced: true
      },
      {
        id: 'video-008-04',
        title: 'Speed and Rhythm Variations',
        description: 'Handle different speaking speeds, rhythms, and pacing styles.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4,
        isAdvanced: true
      },
      {
        id: 'video-008-05',
        title: 'Adaptation Strategies',
        description: 'Develop personal strategies for quickly adapting to new accents and speakers.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5,
        isAdvanced: true
      },
      {
        id: 'video-008-06',
        title: 'Practice with Mixed Accents',
        description: 'Challenge yourself with conversations featuring multiple accent types.',
        duration: 300, // 5 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 6,
        isAdvanced: true
      }
    ],
    createdAt: '2024-10-25T10:30:00Z',
    updatedAt: '2024-11-28T14:15:00Z'
  },
  {
    id: 'series-009',
    title: 'Emotional Expression Recognition',
    description: 'Learn to read emotions, tone, and intent through facial expressions and lip movements.',
    detailedDescription: 'Beyond words, communication includes emotional context and intent. This series teaches you to recognize emotional undertones, sarcasm, emphasis, and non-verbal communication cues that accompany speech.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'intermediate',
    category: 'Advanced Techniques',
    prerequisites: ['Fundamental Lip Reading Basics', 'Everyday Conversation Mastery'],
    learningObjectives: [
      'Recognize emotional undertones in speech',
      'Understand sarcasm and humor through visual cues',
      'Identify emphasis and stress patterns',
      'Master non-verbal communication integration'
    ],
    tags: ['emotions', 'expressions', 'non-verbal', 'advanced', 'communication'],
    instructor: 'Dr. Amanda Foster',
    totalDuration: 2700, // 45 minutes
    estimatedCompletionTime: '2-3 hours',
    rating: {
      average: 4.7,
      totalReviews: 134,
      distribution: { 5: 89, 4: 32, 3: 9, 2: 3, 1: 1 }
    },
    videos: [
      {
        id: 'video-009-01',
        title: 'Basic Emotional Recognition',
        description: 'Identify happiness, sadness, anger, and surprise through facial expressions.',
        duration: 540, // 9 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1
      },
      {
        id: 'video-009-02',
        title: 'Subtle Emotional Cues',
        description: 'Recognize more complex emotions like frustration, confusion, and concern.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2
      },
      {
        id: 'video-009-03',
        title: 'Sarcasm and Humor Detection',
        description: 'Learn to identify when someone is being sarcastic, joking, or using humor.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3
      },
      {
        id: 'video-009-04',
        title: 'Stress and Emphasis Patterns',
        description: 'Understand how speakers emphasize important words and concepts.',
        duration: 420, // 7 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4
      },
      {
        id: 'video-009-05',
        title: 'Context and Intent Integration',
        description: 'Combine lip reading with situational context to understand full meaning.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5
      }
    ],
    createdAt: '2024-11-22T13:45:00Z',
    updatedAt: '2024-12-07T10:30:00Z'
  },
  {
    id: 'series-010',
    title: 'Advanced Practice Scenarios',
    description: 'Challenge yourself with complex, real-world lip reading scenarios and assessments.',
    detailedDescription: 'The ultimate challenge for advanced lip readers. This series presents complex, real-world scenarios that combine all your skills. Perfect for those ready to test their mastery and take on expert-level challenges.',
    thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
    difficulty: 'advanced',
    category: 'Assessment',
    prerequisites: ['Advanced Phoneme Recognition', 'Everyday Conversation Mastery', 'Emotional Expression Recognition'],
    learningObjectives: [
      'Handle complex multi-speaker scenarios',
      'Navigate challenging environmental conditions',
      'Master expert-level vocabulary and concepts',
      'Demonstrate comprehensive lip reading mastery'
    ],
    tags: ['advanced', 'challenge', 'assessment', 'mastery', 'expert'],
    instructor: 'Prof. Elizabeth Stone',
    totalDuration: 4200, // 70 minutes
    estimatedCompletionTime: '4-5 hours',
    rating: {
      average: 4.8,
      totalReviews: 56,
      distribution: { 5: 45, 4: 8, 3: 2, 2: 1, 1: 0 }
    },
    videos: [
      {
        id: 'video-010-01',
        title: 'Multi-Speaker Chaos',
        description: 'Navigate conversations with multiple speakers, interruptions, and overlapping speech.',
        duration: 900, // 15 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 1,
        isAdvanced: true
      },
      {
        id: 'video-010-02',
        title: 'Poor Lighting and Angles',
        description: 'Handle challenging visual conditions, poor lighting, and difficult viewing angles.',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 2,
        isAdvanced: true
      },
      {
        id: 'video-010-03',
        title: 'Technical and Academic Content',
        description: 'Master complex technical discussions, academic lectures, and specialized vocabulary.',
        duration: 840, // 14 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 3,
        isAdvanced: true
      },
      {
        id: 'video-010-04',
        title: 'Emergency and Crisis Communication',
        description: 'Handle high-stress, critical communication scenarios with accuracy and speed.',
        duration: 600, // 10 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 4,
        isAdvanced: true
      },
      {
        id: 'video-010-05',
        title: 'Cultural and Social Context',
        description: 'Navigate complex cultural references, idioms, and social nuances.',
        duration: 660, // 11 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 5,
        isAdvanced: true
      },
      {
        id: 'video-010-06',
        title: 'Final Mastery Assessment',
        description: 'Comprehensive assessment covering all lip reading skills and techniques.',
        duration: 480, // 8 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/LmvpCSvm1qY/maxresdefault.jpg',
        order: 6,
        isAdvanced: true
      }
    ],
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-11-30T16:00:00Z'
  }
];

// Mock User Progress Data (simulated for different users)
export const mockUserProgress: { [seriesId: string]: UserProgress } = {
  'series-001': {
    status: 'completed',
    enrolledAt: '2024-11-01T10:00:00Z',
    completedVideos: ['video-001-01', 'video-001-02', 'video-001-03', 'video-001-04', 'video-001-05'],
    completedAt: '2024-11-15T14:30:00Z',
    lastWatchedVideo: 'video-001-05',
    totalWatchTime: 2847
  },
  'series-003': {
    status: 'in-progress',
    enrolledAt: '2024-11-20T09:00:00Z',
    completedVideos: ['video-003-01', 'video-003-02', 'video-003-03'],
    lastWatchedVideo: 'video-003-03',
    totalWatchTime: 1620
  },
  'series-004': {
    status: 'in-progress',
    enrolledAt: '2024-12-01T08:30:00Z',
    completedVideos: ['video-004-01'],
    lastWatchedVideo: 'video-004-01',
    totalWatchTime: 360
  }
};

// Mock Feedback Data
export const mockFeedback: { [seriesId: string]: UserFeedback[] } = {
  'series-001': [
    {
      id: 'feedback-001-01',
      userId: 'user-123',
      userName: 'Sarah Johnson',
      rating: 5,
      comment: 'Excellent introduction to lip reading! Dr. Mitchell explains everything so clearly and the practice exercises are perfect for beginners.',
      createdAt: '2024-11-16T10:30:00Z'
    },
    {
      id: 'feedback-001-02',
      userId: 'user-456',
      userName: 'Mike Chen',
      rating: 4,
      comment: 'Great foundational course. The mouth shape explanations were particularly helpful. Would love to see more practice scenarios.',
      createdAt: '2024-11-18T14:15:00Z'
    },
    {
      id: 'feedback-001-03',
      userId: 'user-789',
      userName: 'Emily Rodriguez',
      rating: 5,
      comment: 'Perfect starting point for anyone new to lip reading. The progression from basic concepts to practice is well-structured.',
      createdAt: '2024-11-20T09:45:00Z'
    }
  ],
  'series-003': [
    {
      id: 'feedback-003-01',
      userId: 'user-321',
      userName: 'David Thompson',
      rating: 5,
      comment: 'The restaurant and shopping scenarios are so practical! This has already helped me in real-world situations.',
      createdAt: '2024-12-02T16:20:00Z'
    },
    {
      id: 'feedback-003-02',
      userId: 'user-654',
      userName: 'Lisa Park',
      rating: 4,
      comment: 'Emma Rodriguez is a fantastic instructor. The workplace communication module was especially valuable for my career.',
      createdAt: '2024-12-05T11:30:00Z'
    }
  ]
};

// Utility functions
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getTotalSeriesDuration = (series: TutorialSeries): string => {
  const totalMinutes = Math.floor(series.totalDuration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getProgressPercentage = (progress: UserProgress, series: TutorialSeries): number => {
  if (progress.status === 'not-started') return 0;
  if (progress.status === 'completed') return 100;
  
  return Math.round((progress.completedVideos.length / series.videos.length) * 100);
};

export const getNextVideo = (series: TutorialSeries, currentVideoId: string): Video | null => {
  const currentIndex = series.videos.findIndex(video => video.id === currentVideoId);
  if (currentIndex >= 0 && currentIndex < series.videos.length - 1) {
    return series.videos[currentIndex + 1];
  }
  return null;
};

export const getPreviousVideo = (series: TutorialSeries, currentVideoId: string): Video | null => {
  const currentIndex = series.videos.findIndex(video => video.id === currentVideoId);
  if (currentIndex > 0) {
    return series.videos[currentIndex - 1];
  }
  return null;
};
