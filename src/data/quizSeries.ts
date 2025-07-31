export interface QuizQuestion {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  order: number;
  tags: string[];
}

export interface QuizSeries {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
  questions: QuizQuestion[];
  estimatedCompletionTime: string;
  totalQuestions: number;
  prerequisites?: string[];
  learningObjectives: string[];
  rating: {
    average: number;
    totalReviews: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserQuizProgress {
  seriesId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedQuestions: string[];
  currentQuestionId?: string;
  lastAccessedAt: string;
  bestScore: number;
  totalAttempts: number;
  timeSpent: number; // in minutes
  averageScore: number;
}

// Mock quiz series data
export const mockQuizSeries: QuizSeries[] = [
  {
    id: 'basic-vowels',
    title: 'Basic Vowel Recognition',
    description: 'Master the fundamentals of vowel sound recognition through lip reading',
    detailedDescription: 'This comprehensive quiz series focuses on the five primary vowel sounds (A, E, I, O, U) and their visual patterns on the lips. Through carefully crafted video exercises, you\'ll learn to distinguish between different vowel formations and build confidence in basic lip reading skills.',
    category: 'Fundamentals',
    difficulty: 'beginner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-vowels',
        videoUrl: '/api/placeholder/video/vowel-a.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
        question: 'Which vowel sound is being pronounced?',
        options: ['A (as in "cat")', 'E (as in "bet")', 'I (as in "sit")', 'O (as in "hot")'],
        correctAnswer: 0,
        explanation: 'The mouth opens wide with a flat tongue position for the "A" sound, creating a distinct oval shape.',
        difficulty: 'beginner',
        duration: 15,
        order: 1,
        tags: ['vowels', 'pronunciation', 'mouth-shape']
      },
      {
        id: 'q2-vowels',
        videoUrl: '/api/placeholder/video/vowel-e.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
        question: 'Identify the vowel sound shown in the video',
        options: ['A (as in "cat")', 'E (as in "bet")', 'I (as in "sit")', 'U (as in "cut")'],
        correctAnswer: 1,
        explanation: 'The "E" sound shows a mid-open mouth with the tongue slightly raised in the middle.',
        difficulty: 'beginner',
        duration: 18,
        order: 2,
        tags: ['vowels', 'pronunciation', 'tongue-position']
      }
    ],
    estimatedCompletionTime: '10-15 min',
    totalQuestions: 12,
    learningObjectives: [
      'Recognize all five primary vowel sounds visually',
      'Understand mouth and tongue positioning for each vowel',
      'Distinguish between similar vowel formations',
      'Build confidence in basic lip reading skills'
    ],
    rating: {
      average: 4.8,
      totalReviews: 245
    },
    tags: ['beginner', 'vowels', 'fundamentals', 'pronunciation'],
    createdAt: '2024-01-15',
    updatedAt: '2024-12-01'
  },
  {
    id: 'common-consonants',
    title: 'Common Consonants',
    description: 'Learn to identify essential consonant sounds through visual cues',
    detailedDescription: 'Dive into the world of consonant recognition with this comprehensive quiz series. Focus on the most frequently used consonants in English speech, understanding their lip, tongue, and teeth positions. Perfect for building a solid foundation in lip reading consonant sounds.',
    category: 'Fundamentals',
    difficulty: 'beginner',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-consonants',
        videoUrl: '/api/placeholder/video/consonant-b.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=225&fit=crop',
        question: 'Which consonant sound is being demonstrated?',
        options: ['B (as in "book")', 'P (as in "pen")', 'M (as in "man")', 'W (as in "water")'],
        correctAnswer: 0,
        explanation: 'The "B" sound is formed by pressing both lips together and then releasing with voice.',
        difficulty: 'beginner',
        duration: 12,
        order: 1,
        tags: ['consonants', 'lip-formation', 'voiced-sounds']
      }
    ],
    estimatedCompletionTime: '12-18 min',
    totalQuestions: 15,
    learningObjectives: [
      'Identify common consonant sounds through lip reading',
      'Understand voiced vs. unvoiced consonants',
      'Recognize lip, tongue, and teeth positioning',
      'Practice with frequently used consonants'
    ],
    rating: {
      average: 4.6,
      totalReviews: 189
    },
    tags: ['beginner', 'consonants', 'fundamentals', 'speech-sounds'],
    createdAt: '2024-01-20',
    updatedAt: '2024-11-28'
  },
  {
    id: 'everyday-phrases',
    title: 'Everyday Phrases',
    description: 'Practice with common phrases and expressions used in daily conversations',
    detailedDescription: 'Move beyond individual sounds to complete phrases and expressions. This quiz series features common greetings, polite expressions, and everyday conversation starters that you\'ll encounter regularly. Build practical lip reading skills for real-world communication.',
    category: 'Practical Application',
    difficulty: 'intermediate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-phrases',
        videoUrl: '/api/placeholder/video/hello.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=400&h=225&fit=crop',
        question: 'What greeting is being spoken?',
        options: ['Hello', 'Hi there', 'Good morning', 'How are you'],
        correctAnswer: 0,
        explanation: 'The lip pattern shows "Hello" - notice the aspirated "H" and the rounded "O" ending.',
        difficulty: 'intermediate',
        duration: 20,
        order: 1,
        tags: ['greetings', 'phrases', 'conversation']
      }
    ],
    estimatedCompletionTime: '15-20 min',
    totalQuestions: 12,
    prerequisites: ['basic-vowels', 'common-consonants'],
    learningObjectives: [
      'Recognize common greetings and expressions',
      'Understand phrase-level lip reading',
      'Practice with connected speech patterns',
      'Build confidence for real conversations'
    ],
    rating: {
      average: 4.7,
      totalReviews: 156
    },
    tags: ['intermediate', 'phrases', 'conversation', 'practical'],
    createdAt: '2024-02-01',
    updatedAt: '2024-12-05'
  },
  {
    id: 'numbers-time',
    title: 'Numbers and Time',
    description: 'Master reading numbers, dates, and time expressions',
    detailedDescription: 'Essential skills for practical communication. This quiz series covers numbers 1-100, ordinal numbers, dates, times, and related expressions. Perfect for situations involving appointments, shopping, schedules, and daily planning conversations.',
    category: 'Practical Application',
    difficulty: 'intermediate',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-numbers',
        videoUrl: '/api/placeholder/video/fifteen.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=400&h=225&fit=crop',
        question: 'What number is being spoken?',
        options: ['Fifteen', 'Fifty', 'Fourteen', 'Forty'],
        correctAnswer: 0,
        explanation: 'The "F" formation followed by "teen" ending indicates "Fifteen".',
        difficulty: 'intermediate',
        duration: 18,
        order: 1,
        tags: ['numbers', 'counting', 'teens']
      }
    ],
    estimatedCompletionTime: '12-16 min',
    totalQuestions: 10,
    prerequisites: ['basic-vowels', 'common-consonants'],
    learningObjectives: [
      'Read numbers 1-100 accurately',
      'Distinguish between teens and tens',
      'Understand time expressions',
      'Recognize date formats'
    ],
    rating: {
      average: 4.5,
      totalReviews: 134
    },
    tags: ['intermediate', 'numbers', 'time', 'practical'],
    createdAt: '2024-02-10',
    updatedAt: '2024-11-15'
  },
  {
    id: 'complex-sentences',
    title: 'Complex Sentences',
    description: 'Advanced sentence structures and rapid speech patterns',
    detailedDescription: 'Challenge yourself with complex sentence structures, compound phrases, and faster speech patterns. This advanced quiz series prepares you for natural conversation speeds and more sophisticated language patterns used in professional and academic settings.',
    category: 'Advanced Skills',
    difficulty: 'advanced',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-complex',
        videoUrl: '/api/placeholder/video/complex1.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
        question: 'What complete sentence is being spoken?',
        options: [
          'I would like to schedule an appointment',
          'I would love to schedule an appointment',
          'I will need to schedule an appointment',
          'I should like to schedule an appointment'
        ],
        correctAnswer: 0,
        explanation: 'The lip patterns show "would like" - notice the "would" lip rounding and "like" formation.',
        difficulty: 'advanced',
        duration: 25,
        order: 1,
        tags: ['complex-sentences', 'formal-speech', 'appointments']
      }
    ],
    estimatedCompletionTime: '20-25 min',
    totalQuestions: 18,
    prerequisites: ['everyday-phrases', 'numbers-time'],
    learningObjectives: [
      'Understand complex sentence structures',
      'Handle faster speech patterns',
      'Recognize formal and informal registers',
      'Practice with professional vocabulary'
    ],
    rating: {
      average: 4.4,
      totalReviews: 98
    },
    tags: ['advanced', 'complex-sentences', 'professional', 'formal-speech'],
    createdAt: '2024-02-20',
    updatedAt: '2024-12-08'
  },
  {
    id: 'conversation-flow',
    title: 'Conversation Flow',
    description: 'Master the rhythm and flow of natural conversations',
    detailedDescription: 'Learn to follow multi-person conversations, understand turn-taking cues, and recognize conversation connectors. This advanced series focuses on the natural flow of dialogue, including interruptions, agreements, disagreements, and conversational transitions.',
    category: 'Advanced Skills',
    difficulty: 'advanced',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=300&fit=crop',
    questions: [
      {
        id: 'q1-conversation',
        videoUrl: '/api/placeholder/video/conversation1.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=225&fit=crop',
        question: 'What conversational response is being given?',
        options: ['I agree with that', 'I disagree with that', 'I understand that', 'I appreciate that'],
        correctAnswer: 0,
        explanation: 'The speaker shows agreement through the "agree" lip pattern and supportive facial expression.',
        difficulty: 'advanced',
        duration: 22,
        order: 1,
        tags: ['conversation', 'agreement', 'responses']
      }
    ],
    estimatedCompletionTime: '18-22 min',
    totalQuestions: 14,
    prerequisites: ['complex-sentences'],
    learningObjectives: [
      'Follow multi-person conversations',
      'Recognize conversational cues',
      'Understand turn-taking patterns',
      'Identify agreement and disagreement'
    ],
    rating: {
      average: 4.6,
      totalReviews: 76
    },
    tags: ['advanced', 'conversation', 'dialogue', 'social-skills'],
    createdAt: '2024-03-01',
    updatedAt: '2024-12-10'
  }
];

// Mock user progress data
export const mockUserQuizProgress: Record<string, UserQuizProgress> = {
  'basic-vowels': {
    seriesId: 'basic-vowels',
    status: 'completed',
    completedQuestions: ['q1-vowels', 'q2-vowels'],
    lastAccessedAt: '2024-12-10',
    bestScore: 95,
    totalAttempts: 3,
    timeSpent: 25,
    averageScore: 88
  },
  'common-consonants': {
    seriesId: 'common-consonants',
    status: 'in-progress',
    completedQuestions: ['q1-consonants'],
    currentQuestionId: 'q2-consonants',
    lastAccessedAt: '2024-12-12',
    bestScore: 80,
    totalAttempts: 2,
    timeSpent: 15,
    averageScore: 75
  },
  'everyday-phrases': {
    seriesId: 'everyday-phrases',
    status: 'not-started',
    completedQuestions: [],
    lastAccessedAt: '',
    bestScore: 0,
    totalAttempts: 0,
    timeSpent: 0,
    averageScore: 0
  }
};

export const formatQuizDuration = (totalQuestions: number): string => {
  const avgTimePerQuestion = 1.5; // minutes
  const totalTime = totalQuestions * avgTimePerQuestion;
  return `${Math.floor(totalTime)}-${Math.ceil(totalTime + 5)} min`;
};

export const getTotalQuizTime = (series: QuizSeries): string => {
  return series.estimatedCompletionTime;
};

export const getQuizProgressPercentage = (progress: UserQuizProgress, series: QuizSeries): number => {
  if (!progress || progress.status === 'not-started') return 0;
  return Math.round((progress.completedQuestions.length / series.totalQuestions) * 100);
};

export const getDifficultyColor = (level: string): string => {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};
