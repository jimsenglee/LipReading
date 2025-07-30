
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  FileText, 
  BookOpen, 
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Video,
  Upload,
  Folder,
  Tag,
  Clock,
  Users,
  Star,
  PlayCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import VideoModal from '@/components/admin/VideoModal';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ContentManagement = () => {
  // State management for modals and data
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [quizSearchTerm, setQuizSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  
  // Tutorial Videos State
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: 'Basic Vowels (A, E, I, O, U)',
      category: 'Vowels',
      difficulty: 'Beginner',
      duration: '12 min',
      status: 'published',
      uploadDate: '2024-01-15',
      views: 1247,
      description: 'Learn fundamental vowel sounds',
      videoFile: null,
      thumbnail: null
    },
    {
      id: 2,
      title: 'Common Consonants (B, P, M)',
      category: 'Consonants',
      difficulty: 'Beginner',
      duration: '15 min',
      status: 'published',
      uploadDate: '2024-01-10',
      views: 892,
      description: 'Master lip-readable consonant sounds',
      videoFile: null,
      thumbnail: null
    },
    {
      id: 3,
      title: 'Advanced Lip Patterns',
      category: 'Advanced',
      difficulty: 'Advanced',
      duration: '25 min',
      status: 'draft',
      uploadDate: '2024-01-18',
      views: 0,
      description: 'Complex lip movement patterns',
      videoFile: null,
      thumbnail: null
    }
  ]);

  // Quiz Questions State
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      question: 'What word is being said?',
      correctAnswer: 'Hello',
      incorrectOptions: ['Help', 'House', 'Happy'],
      category: 'Greetings',
      difficulty: 'Beginner',
      videoClip: null,
      createdDate: '2024-01-15',
      attempts: 453,
      successRate: 89
    },
    {
      id: 2,
      question: 'Which vowel sound is shown?',
      correctAnswer: 'A (ah)',
      incorrectOptions: ['E (eh)', 'I (ih)', 'O (oh)'],
      category: 'Vowels',
      difficulty: 'Beginner',
      videoClip: null,
      createdDate: '2024-01-12',
      attempts: 621,
      successRate: 94
    },
    {
      id: 3,
      question: 'Identify the consonant pattern',
      correctAnswer: 'B-P-M',
      incorrectOptions: ['D-T-N', 'F-V-TH', 'K-G-NG'],
      category: 'Consonants',
      difficulty: 'Intermediate',
      videoClip: null,
      createdDate: '2024-01-10',
      attempts: 287,
      successRate: 76
    }
  ]);

  // Categories State
  const [categories, setCategories] = useState([
    { id: 1, name: 'Vowels', description: 'Vowel sounds and patterns', contentCount: 8, createdDate: '2024-01-01' },
    { id: 2, name: 'Consonants', description: 'Consonant sounds and combinations', contentCount: 12, createdDate: '2024-01-01' },
    { id: 3, name: 'Greetings', description: 'Common greeting words and phrases', contentCount: 5, createdDate: '2024-01-05' },
    { id: 4, name: 'Advanced', description: 'Complex lip reading patterns', contentCount: 3, createdDate: '2024-01-10' },
    { id: 5, name: 'Numbers', description: 'Numerical expressions', contentCount: 10, createdDate: '2024-01-08' }
  ]);

  // Form states for new content
  const [newQuiz, setNewQuiz] = useState({
    question: '',
    correctAnswer: '',
    incorrectOptions: ['', '', ''],
    category: '',
    difficulty: 'Beginner',
    videoClip: null
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const { success, error } = useFeedbackToast();

  // Breadcrumb for admin content management
  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management' }
  ];

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || video.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'all' || video.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
  });

  // Filter quizzes based on search
  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.question.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
    quiz.category.toLowerCase().includes(quizSearchTerm.toLowerCase()) ||
    quiz.correctAnswer.toLowerCase().includes(quizSearchTerm.toLowerCase())
  );

  // Handle video operations
  const handleAddVideo = () => {
    setModalMode('add');
    setEditingVideo(null);
    setIsVideoModalOpen(true);
  };

  const handleEditVideo = (video: any) => {
    setModalMode('edit');
    setEditingVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleDeleteVideo = (videoId: number) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
    success('Video deleted', 'The tutorial video has been removed from your library.');
  };

  const handleSaveVideo = (videoData: any) => {
    if (modalMode === 'add') {
      const newVideo = {
        ...videoData,
        id: Date.now(),
        uploadDate: new Date().toISOString().split('T')[0],
        views: 0
      };
      setVideos(prev => [...prev, newVideo]);
      success('Video created', 'The tutorial video has been added successfully.');
    } else {
      setVideos(prev => prev.map(v => v.id === videoData.id ? videoData : v));
      success('Video updated', 'The tutorial video has been updated successfully.');
    }
    setIsVideoModalOpen(false);
  };

  // Handle quiz operations
  const handleAddQuiz = () => {
    setModalMode('add');
    setEditingQuiz(null);
    setNewQuiz({
      question: '',
      correctAnswer: '',
      incorrectOptions: ['', '', ''],
      category: '',
      difficulty: 'Beginner',
      videoClip: null
    });
    setIsQuizModalOpen(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setModalMode('edit');
    setEditingQuiz(quiz);
    setNewQuiz(quiz);
    setIsQuizModalOpen(true);
  };

  const handleDeleteQuiz = (quizId: number) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    success('Quiz deleted', 'The quiz question has been removed.');
  };

  const handleSaveQuiz = () => {
    // Validation
    if (!newQuiz.question.trim()) {
      error('Validation Error', 'Question field cannot be empty.');
      return;
    }
    if (!newQuiz.correctAnswer.trim()) {
      error('Validation Error', 'Correct answer field cannot be empty.');
      return;
    }
    if (newQuiz.incorrectOptions.some(option => !option.trim())) {
      error('Validation Error', 'All incorrect answer fields must be filled.');
      return;
    }
    if (!newQuiz.category) {
      error('Validation Error', 'Please select a category.');
      return;
    }

    if (modalMode === 'add') {
      const newQuizItem = {
        ...newQuiz,
        id: Date.now(),
        createdDate: new Date().toISOString().split('T')[0],
        attempts: 0,
        successRate: 0
      };
      setQuizzes(prev => [...prev, newQuizItem]);
      success('Quiz created', 'The quiz question has been created successfully.');
    } else {
      setQuizzes(prev => prev.map(q => 
        q.id === editingQuiz.id 
          ? { ...q, ...newQuiz, id: editingQuiz.id }
          : q
      ));
      success('Quiz updated', 'The quiz question has been updated successfully.');
    }
    setIsQuizModalOpen(false);
  };

  // Handle category operations
  const handleAddCategory = () => {
    setModalMode('add');
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setModalMode('edit');
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.contentCount > 0) {
      error('Cannot Delete', 'Cannot delete a category that contains content. Please reassign or delete the content first.');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    success('Category deleted', 'The category has been removed.');
  };

  const handleSaveCategory = () => {
    // Validation
    if (!newCategory.name.trim()) {
      error('Validation Error', 'Category name cannot be empty.');
      return;
    }
    
    // Check for duplicate names
    const existsAlready = categories.some(c => 
      c.name.toLowerCase() === newCategory.name.toLowerCase() && 
      (modalMode === 'add' || c.id !== editingCategory?.id)
    );
    
    if (existsAlready) {
      error('Duplicate Name', 'This category name already exists.');
      return;
    }

    if (modalMode === 'add') {
      const newCategoryItem = {
        ...newCategory,
        id: Date.now(),
        contentCount: 0,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setCategories(prev => [...prev, newCategoryItem]);
      success('Category created', 'The category has been created successfully.');
    } else {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: newCategory.name, description: newCategory.description }
          : c
      ));
      success('Category updated', 'The category has been updated successfully.');
    }
    setIsCategoryModalOpen(false);
  };

  // Utility functions
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Animated Breadcrumbs */}
      <AnimatedBreadcrumb items={breadcrumbItems} />

      {/* Header Section */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-primary">Content Management</h1>
          <p className="text-gray-600 mt-1">
            Manage tutorials, quizzes, and educational content for the platform
          </p>
        </div>
        <Button 
          onClick={handleAddVideo}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Upload New Video
        </Button>
      </motion.div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger 
            value="videos" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Video className="h-4 w-4" />
            Tutorial Videos
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            Interactive Quizzes
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          {/* Enhanced Search and Filter Bar */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos by title, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary bg-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setDifficultyFilter('all');
                  }}
                  className="w-full border-primary/20 text-primary hover:bg-primary/10"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Video Library */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Tutorial Video Library
              </CardTitle>
              <CardDescription>Manage your educational video content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/10">
                      <th className="text-left p-4 font-medium text-primary">Video Details</th>
                      <th className="text-left p-4 font-medium text-primary">Category</th>
                      <th className="text-left p-4 font-medium text-primary">Difficulty</th>
                      <th className="text-left p-4 font-medium text-primary">Status</th>
                      <th className="text-left p-4 font-medium text-primary">Views</th>
                      <th className="text-left p-4 font-medium text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVideos.map((video, index) => (
                      <motion.tr 
                        key={video.id} 
                        className="border-b hover:bg-primary/5 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                              <Video className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{video.title}</div>
                              <div className="text-sm text-gray-500">{video.duration} • {video.uploadDate}</div>
                              <div className="text-xs text-gray-400 mt-1">{video.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {video.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={getDifficultyColor(video.difficulty)}>
                            {video.difficulty}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(video.status)}>
                            {video.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm font-medium">{video.views.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVideo(video)}
                              className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Video</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{video.title}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteVideo(video.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-12">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No videos found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Start by uploading your first tutorial video'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleAddVideo} className="bg-primary hover:bg-primary/90">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Video
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-6">
          {/* Quiz Search Bar */}
          <motion.div 
            className="flex flex-col md:flex-row gap-4 items-center justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quiz questions..."
                value={quizSearchTerm}
                onChange={(e) => setQuizSearchTerm(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary bg-white"
              />
            </div>
            <Button 
              onClick={handleAddQuiz}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add New Question
            </Button>
          </motion.div>

          {/* Quiz Management */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Interactive Quiz Questions ({filteredQuizzes.length})
              </CardTitle>
              <CardDescription>Create and manage quiz questions for lip reading practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/10">
                      <th className="text-left p-4 font-medium text-primary">Question</th>
                      <th className="text-left p-4 font-medium text-primary">Category</th>
                      <th className="text-left p-4 font-medium text-primary">Difficulty</th>
                      <th className="text-left p-4 font-medium text-primary">Success Rate</th>
                      <th className="text-left p-4 font-medium text-primary">Attempts</th>
                      <th className="text-left p-4 font-medium text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuizzes.map((quiz, index) => (
                      <motion.tr 
                        key={quiz.id} 
                        className="border-b hover:bg-primary/5 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <PlayCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{quiz.question}</div>
                              <div className="text-sm text-gray-500">Correct: {quiz.correctAnswer}</div>
                              <div className="text-xs text-gray-400 mt-1">Created: {quiz.createdDate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {quiz.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={getDifficultyColor(quiz.difficulty)}>
                            {quiz.difficulty}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${quiz.successRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{quiz.successRate}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium">{quiz.attempts}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditQuiz(quiz)}
                              className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Quiz Question</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this quiz question? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredQuizzes.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No quiz questions found</h3>
                  <p className="text-gray-400 mb-4">
                    {quizSearchTerm ? 'Try adjusting your search criteria' : 'Start by creating your first quiz question'}
                  </p>
                  {!quizSearchTerm && (
                    <Button onClick={handleAddQuiz} className="bg-primary hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Question
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Category Management Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <h3 className="text-lg font-semibold text-primary">Content Categories</h3>
              <p className="text-gray-600">Organize your educational content with categories</p>
            </div>
            <Button 
              onClick={handleAddCategory}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </motion.div>

          {/* Categories List */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-primary" />
                Category Management ({categories.length})
              </CardTitle>
              <CardDescription>Create and organize content categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="p-4 border border-primary/10 rounded-lg hover:bg-primary/5 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{category.contentCount} items</span>
                            <span>Created: {category.createdDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                          className="border-primary/20 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              disabled={category.contentCount > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{category.name}" category? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No categories yet</h3>
                  <p className="text-gray-400 mb-4">Create your first category to organize content</p>
                  <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Content Analytics */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Content Analytics Overview
              </CardTitle>
              <CardDescription>Performance metrics for your educational content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{videos.length}</div>
                  <div className="text-sm text-gray-600">Tutorial Videos</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{quizzes.length}</div>
                  <div className="text-sm text-gray-600">Quiz Questions</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{categories.length}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {videos.reduce((sum, video) => sum + video.views, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
              </div>
              
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Detailed Analytics</h3>
                <p className="text-gray-400">Advanced analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Upload/Edit Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSave={handleSaveVideo}
        editingVideo={editingVideo}
        mode={modalMode}
      />

      {/* Quiz Creation/Edit Modal */}
      <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {modalMode === 'add' ? 'Create New Quiz Question' : 'Edit Quiz Question'}
            </DialogTitle>
            <DialogDescription>
              Create engaging quiz questions to test lip reading skills
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">Question</Label>
              <Textarea
                placeholder="What word or phrase is being said?"
                value={newQuiz.question}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, question: e.target.value }))}
                className="mt-1 border-primary/20 focus:border-primary"
                rows={3}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Correct Answer</Label>
              <Input
                placeholder="Enter the correct answer"
                value={newQuiz.correctAnswer}
                onChange={(e) => setNewQuiz(prev => ({ ...prev, correctAnswer: e.target.value }))}
                className="mt-1 border-primary/20 focus:border-primary"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Incorrect Options</Label>
              <div className="space-y-2 mt-1">
                {newQuiz.incorrectOptions.map((option, index) => (
                  <Input
                    key={index}
                    placeholder={`Incorrect option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuiz.incorrectOptions];
                      newOptions[index] = e.target.value;
                      setNewQuiz(prev => ({ ...prev, incorrectOptions: newOptions }));
                    }}
                    className="border-primary/20 focus:border-primary"
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Category</Label>
                <Select 
                  value={newQuiz.category} 
                  onValueChange={(value) => setNewQuiz(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1 border-primary/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Difficulty</Label>
                <Select 
                  value={newQuiz.difficulty} 
                  onValueChange={(value) => setNewQuiz(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger className="mt-1 border-primary/20">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Video Clip</Label>
              <div className="mt-1 p-4 border-2 border-dashed border-primary/20 rounded-lg text-center">
                <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Upload a video clip showing the word/phrase being spoken
                </p>
                <Button 
                  variant="outline" 
                  className="mt-2 border-primary/20 text-primary hover:bg-primary/10"
                >
                  Select Video File
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsQuizModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuiz}
              className="bg-primary hover:bg-primary/90"
            >
              {modalMode === 'add' ? 'Create Question' : 'Update Question'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Creation/Edit Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">
              {modalMode === 'add' ? 'Create New Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              Organize your content with descriptive categories
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Category Name</Label>
              <Input
                placeholder="Enter category name"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 border-primary/20 focus:border-primary"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                placeholder="Describe what this category contains"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 border-primary/20 focus:border-primary"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              className="bg-primary hover:bg-primary/90"
            >
              {modalMode === 'add' ? 'Create Category' : 'Update Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
