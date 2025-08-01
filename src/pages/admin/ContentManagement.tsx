import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import ContentPreviewModal from '@/components/admin/ContentPreviewModal';
import EditCategoryModal from '@/components/admin/EditCategoryModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Upload, 
  Copy,
  BookOpen,
  Brain,
  Video,
  Target,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  ArrowUpDown,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';

// Mock data that matches the user-side structure
interface TutorialSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalVideos: number;
  totalDuration: string;
  estimatedTime: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  views: number;
  completions: number;
  rating: number;
  thumbnailUrl: string;
  author: string;
}

interface QuizSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  estimatedTime: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  attempts: number;
  averageScore: number;
  rating: number;
  author: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  contentCount: number;
  status: string;
}

type ContentItem = TutorialSeries | QuizSeries;

interface PreviewItemData {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'tutorial' | 'quiz';
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  videos?: Array<{
    id: string;
    title: string;
    description: string;
    duration?: string;
    order: number;
  }>;
  learningObjectives?: string[];
  prerequisites?: string[];
  tags?: string[];
  questions?: Array<{
    id: string;
    type: 'multiple-choice';
    question: string;
    points: number;
    order: number;
  }>;
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
  stats?: {
    totalViews?: number;
    enrolledUsers?: number;
    completionRate?: number;
    averageScore?: number;
  };
}

const mockTutorialSeries: TutorialSeries[] = [
  {
    id: 'tutorial-series-1',
    title: 'Basic Vowel Sounds',
    description: 'Learn to recognize basic vowel lip patterns',
    category: 'Vowel Sounds',
    difficulty: 'beginner',
    totalVideos: 8,
    totalDuration: '45:30',
    estimatedTime: '45 minutes',
    status: 'published',
    createdDate: '2025-01-15',
    updatedDate: '2025-01-20',
    views: 1234,
    completions: 456,
    rating: 4.5,
    thumbnailUrl: 'https://via.placeholder.com/300x200',
    author: 'Dr. Sarah Chen'
  },
  {
    id: 'tutorial-series-2',
    title: 'Advanced Consonant Blends',
    description: 'Master complex consonant combinations',
    category: 'Consonant Sounds',
    difficulty: 'advanced',
    totalVideos: 12,
    totalDuration: '68:45',
    estimatedTime: '68 minutes',
    status: 'draft',
    createdDate: '2025-01-18',
    updatedDate: '2025-01-22',
    views: 0,
    completions: 0,
    rating: 0,
    thumbnailUrl: 'https://via.placeholder.com/300x200',
    author: 'Prof. Michael Torres'
  }
];

const mockQuizSeries: QuizSeries[] = [
  {
    id: 'quiz-series-1',
    title: 'Vowel Recognition Quiz',
    description: 'Test your vowel sound recognition skills',
    category: 'Vowel Sounds',
    difficulty: 'beginner',
    totalQuestions: 15,
    estimatedTime: '12 minutes',
    status: 'published',
    createdDate: '2025-01-16',
    updatedDate: '2025-01-21',
    attempts: 789,
    averageScore: 78.5,
    rating: 4.2,
    author: 'Dr. Sarah Chen'
  },
  {
    id: 'quiz-series-2',
    title: 'Consonant Challenge',
    description: 'Advanced consonant identification test',
    category: 'Consonant Sounds',
    difficulty: 'intermediate',
    totalQuestions: 20,
    estimatedTime: '18 minutes',
    status: 'published',
    createdDate: '2025-01-17',
    updatedDate: '2025-01-22',
    attempts: 456,
    averageScore: 65.3,
    rating: 4.0,
    author: 'Prof. Michael Torres'
  }
];

const mockCategories: Category[] = [
  { id: 'vowel-sounds', name: 'Vowel Sounds', description: 'Basic and advanced vowel patterns', contentCount: 12, status: 'active' },
  { id: 'consonant-sounds', name: 'Consonant Sounds', description: 'Consonant blends and combinations', contentCount: 8, status: 'active' },
  { id: 'sentence-reading', name: 'Sentence Reading', description: 'Full sentence lip reading practice', contentCount: 6, status: 'active' }
];

const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tutorials');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<PreviewItemData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editCategoryItem, setEditCategoryItem] = useState<Category | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management' }
  ];

  // Filter tutorial series
  const filteredTutorialSeries = useMemo(() => {
    return mockTutorialSeries.filter(series => {
      const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || series.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || series.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'all' || series.difficulty === difficultyFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, statusFilter, categoryFilter, difficultyFilter]);

  // Filter quiz series
  const filteredQuizSeries = useMemo(() => {
    return mockQuizSeries.filter(series => {
      const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || series.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || series.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'all' || series.difficulty === difficultyFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, statusFilter, categoryFilter, difficultyFilter]);

  const handleSelectAll = (items: ContentItem[]) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateNew = (type: string) => {
    switch (type) {
      case 'tutorial':
        navigate('/admin/content/create-tutorial');
        break;
      case 'quiz':
        navigate('/admin/content/create-quiz');
        break;
      case 'category':
        navigate('/admin/content/create-category');
        break;
    }
  };

  const handlePreview = (item: ContentItem) => {
    // Convert the item to the preview modal format
    const previewData: PreviewItemData = {
      ...item,
      difficulty: item.difficulty as 'beginner' | 'intermediate' | 'advanced',
      status: item.status as 'published' | 'draft',
      type: 'totalVideos' in item ? 'tutorial' : 'quiz' as 'tutorial' | 'quiz',
      detailedDescription: item.description,
      createdAt: item.createdDate,
      updatedAt: item.updatedDate,
      // Add mock data for preview
      videos: 'totalVideos' in item ? Array.from({ length: item.totalVideos }, (_, i) => ({
        id: `video-${i + 1}`,
        title: `Video ${i + 1}`,
        description: `Description for video ${i + 1}`,
        duration: '5:00',
        order: i + 1
      })) : undefined,
      questions: 'totalQuestions' in item ? Array.from({ length: item.totalQuestions }, (_, i) => ({
        id: `question-${i + 1}`,
        type: 'multiple-choice' as const,
        question: `Sample question ${i + 1}`,
        points: 1,
        order: i + 1
      })) : undefined,
      timeLimit: 'totalQuestions' in item ? 30 : undefined,
      passingScore: 'totalQuestions' in item ? 70 : undefined,
      maxAttempts: 'totalQuestions' in item ? 3 : undefined,
      stats: {
        totalViews: 'views' in item ? item.views : undefined,
        enrolledUsers: 'completions' in item ? item.completions : undefined,
        completionRate: 'completions' in item && 'views' in item ? Math.round((item.completions / item.views) * 100) : undefined,
        averageScore: 'averageScore' in item ? item.averageScore : undefined
      }
    };
    
    setPreviewItem(previewData);
    setShowPreviewModal(true);
  };

  const handleEdit = (item: ContentItem) => {
    const type = 'totalVideos' in item ? 'tutorial' : 'quiz';
    navigate(`/admin/content/edit-${type}/${item.id}`);
  };

  const handleDuplicate = (item: ContentItem) => {
    toast({
      title: "Content Duplicated",
      description: `${item.title} has been duplicated successfully.`
    });
  };

  const handleDelete = (item: ContentItem) => {
    toast({
      variant: "destructive",
      title: "Content Deleted",
      description: `${item.title} has been deleted successfully.`
    });
  };

  // Category-specific handlers
  const handleEditCategory = (category: Category) => {
    setEditCategoryItem(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.contentCount > 0) {
      toast({
        variant: "destructive",
        title: "Cannot Delete Category",
        description: `${category.name} has ${category.contentCount} content items. Please move or delete them first.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Category Deleted",
        description: `${category.name} has been deleted successfully.`
      });
    }
  };

  const handleSaveCategory = (updatedCategory: Category) => {
    // In a real app, this would update the category in the backend
    toast({
      title: "Category Updated",
      description: `${updatedCategory.name} has been updated successfully.`
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage tutorials, quizzes, and educational content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Tutorial Series</p>
                <p className="text-2xl font-bold text-blue-700">{mockTutorialSeries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Quiz Series</p>
                <p className="text-2xl font-bold text-purple-700">{mockQuizSeries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Categories</p>
                <p className="text-2xl font-bold text-green-700">{mockCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Total Views</p>
                <p className="text-2xl font-bold text-orange-700">1.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Content Library</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Create Content</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleCreateNew('tutorial')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tutorial Series
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNew('quiz')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Quiz Series
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateNew('category')}>
                    <Target className="h-4 w-4 mr-2" />
                    Category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="tutorials" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Tutorial Series
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Quiz Series
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {mockCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">
                      {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tutorial Series Tab */}
            <TabsContent value="tutorials" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === filteredTutorialSeries.length && filteredTutorialSeries.length > 0}
                          onCheckedChange={() => handleSelectAll(filteredTutorialSeries)}
                        />
                      </TableHead>
                      <TableHead>Series Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Videos</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTutorialSeries.map((series) => (
                      <TableRow key={series.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(series.id)}
                            onCheckedChange={() => handleSelectItem(series.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <img 
                              src={series.thumbnailUrl} 
                              alt={series.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{series.title}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{series.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{series.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(series.difficulty)}>
                            {series.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{series.totalVideos}</TableCell>
                        <TableCell>{series.totalDuration}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(series.status)}>
                            {series.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{series.views.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{series.rating || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(series.updatedDate)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(series)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(series)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePreview(series)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Quiz Series Tab */}
            <TabsContent value="quizzes" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === filteredQuizSeries.length && filteredQuizSeries.length > 0}
                          onCheckedChange={() => handleSelectAll(filteredQuizSeries)}
                        />
                      </TableHead>
                      <TableHead>Quiz Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Est. Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Avg. Score</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuizSeries.map((series) => (
                      <TableRow key={series.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(series.id)}
                            onCheckedChange={() => handleSelectItem(series.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium text-gray-900">{series.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{series.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{series.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(series.difficulty)}>
                            {series.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{series.totalQuestions}</TableCell>
                        <TableCell>{series.estimatedTime}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(series.status)}>
                            {series.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{series.attempts.toLocaleString()}</TableCell>
                        <TableCell>{series.averageScore}%</TableCell>
                        <TableCell>{formatDate(series.updatedDate)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(series)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(series)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePreview(series)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Content Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCategories.map((category) => (
                      <TableRow key={category.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-gray-600">{category.description}</TableCell>
                        <TableCell>{category.contentCount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(category.status)}>
                            {category.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCategory(category)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Preview Modal */}
      {previewItem && (
        <ContentPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onEdit={(content) => {
            setShowPreviewModal(false);
            const contentType = activeTab === 'tutorials' ? 'tutorial' : 'quiz';
            navigate(`/admin/content/edit-${contentType}/${content.id}`);
          }}
          content={previewItem}
        />
      )}
      
      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={showEditCategoryModal}
        onClose={() => setShowEditCategoryModal(false)}
        category={editCategoryItem}
        onSave={handleSaveCategory}
      />
    </div>
  );
};

export default ContentManagement;

