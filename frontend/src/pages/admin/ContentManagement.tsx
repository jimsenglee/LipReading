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
import { useCategories, useTutorials, useQuizzes } from '@/services/queries';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Calendar, 
  Users, 
  BookOpen, 
  Brain, 
  Tag,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
interface TutorialSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  totalVideos: number;
  totalDuration: string;
  estimatedTime: string;
  status: 'published' | 'draft' | 'archived';
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
  status: 'published' | 'draft' | 'archived';
  createdDate: string;
  updatedDate: string;
  attempts: number;
  completions: number;
  averageScore?: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  contentCount: number;
  status: 'active' | 'inactive';
}

const ContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // API data
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: tutorials = [], isLoading: tutorialsLoading } = useTutorials();
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuizzes();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Convert API data to local types
  const tutorialSeries: TutorialSeries[] = tutorials.map(tutorial => ({
    id: tutorial.publicId,
    title: tutorial.title,
    description: tutorial.description || '',
    category: 'General', // You might want to get this from the category relationship
    difficulty: 'beginner',
    totalVideos: 1, // This would come from related videos
    totalDuration: '10:00',
    estimatedTime: '10 minutes',
    status: 'published' as const,
    createdDate: new Date().toISOString().split('T')[0],
    updatedDate: new Date().toISOString().split('T')[0],
    views: 0,
    completions: 0,
    rating: 0,
    thumbnailUrl: 'https://via.placeholder.com/300x200',
    author: 'System'
  }));

  const quizSeries: QuizSeries[] = quizzes.map(quiz => ({
    id: quiz.publicId,
    title: quiz.title,
    description: 'Quiz description',
    category: 'General',
    difficulty: 'beginner',
    totalQuestions: 10,
    estimatedTime: '15 minutes',
    status: 'published' as const,
    createdDate: new Date().toISOString().split('T')[0],
    updatedDate: new Date().toISOString().split('T')[0],
    attempts: 0,
    completions: 0,
    averageScore: 0
  }));

  const categoryList: Category[] = categories.map(category => ({
    id: category.publicId,
    name: category.name,
    description: 'Category description',
    contentCount: 0,
    status: 'active' as const
  }));

  // Filter functions
  const filteredTutorialSeries = useMemo(() => {
    return tutorialSeries.filter(series => {
      const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || series.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || series.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tutorialSeries, searchTerm, selectedCategory, statusFilter]);

  const filteredQuizSeries = useMemo(() => {
    return quizSeries.filter(series => {
      const matchesSearch = series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           series.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || series.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || series.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [quizSeries, searchTerm, selectedCategory, statusFilter]);

  const filteredCategories = useMemo(() => {
    return categoryList.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [categoryList, searchTerm, statusFilter]);

  // Event handlers
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (items: any[]) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handlePreview = (item: any) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const handleEdit = (item: any) => {
    // Navigate to edit page
    navigate(`/admin/edit/${item.id}`);
  };

  const handleDelete = (itemId: string) => {
    toast({
      title: "Delete Confirmation",
      description: "Are you sure you want to delete this item?",
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditCategoryOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'destructive',
      active: 'default',
      inactive: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {difficulty}
      </Badge>
    );
  };

  if (categoriesLoading || tutorialsLoading || quizzesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedBreadcrumb
        items={[
          { title: 'Content Management' }
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage your tutorial series, quizzes, and categories</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/admin/content/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Tutorial Series</p>
                <p className="text-2xl font-bold text-blue-700">{tutorialSeries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Quiz Series</p>
                <p className="text-2xl font-bold text-purple-700">{quizSeries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Categories</p>
                <p className="text-2xl font-bold text-green-700">{categoryList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryList.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="tutorials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tutorials">Tutorial Series ({filteredTutorialSeries.length})</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Series ({filteredQuizSeries.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({filteredCategories.length})</TabsTrigger>
        </TabsList>

        {/* Tutorial Series Tab */}
        <TabsContent value="tutorials">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tutorial Series</CardTitle>
                  <CardDescription>
                    Manage your tutorial series and video content
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedItems.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredTutorialSeries.length && filteredTutorialSeries.length > 0}
                        onCheckedChange={() => handleSelectAll(filteredTutorialSeries)}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
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
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={series.thumbnailUrl}
                            alt={series.title}
                            className="w-12 h-8 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium">{series.title}</div>
                            <div className="text-sm text-gray-500">{series.author}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{series.category}</TableCell>
                      <TableCell>{getDifficultyBadge(series.difficulty)}</TableCell>
                      <TableCell>{getStatusBadge(series.status)}</TableCell>
                      <TableCell>{series.views.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {series.rating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>{series.updatedDate}</TableCell>
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
                            <DropdownMenuItem 
                              onClick={() => handleDelete(series.id)}
                              className="text-red-600"
                            >
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Series Tab */}
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Quiz Series</CardTitle>
                  <CardDescription>
                    Manage your quiz series and assessments
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedItems.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredQuizSeries.length && filteredQuizSeries.length > 0}
                        onCheckedChange={() => handleSelectAll(filteredQuizSeries)}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizSeries.map((quiz) => (
                    <TableRow key={quiz.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(quiz.id)}
                          onCheckedChange={() => handleSelectItem(quiz.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quiz.title}</div>
                          <div className="text-sm text-gray-500">{quiz.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{quiz.category}</TableCell>
                      <TableCell>{getDifficultyBadge(quiz.difficulty)}</TableCell>
                      <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                      <TableCell>{quiz.totalQuestions}</TableCell>
                      <TableCell>{quiz.attempts.toLocaleString()}</TableCell>
                      <TableCell>{quiz.averageScore?.toFixed(1) || 'N/A'}%</TableCell>
                      <TableCell>{quiz.updatedDate}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(quiz)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(quiz)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(quiz.id)}
                              className="text-red-600"
                            >
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                    Organize your content with categories
                  </CardDescription>
                </div>
                <Button onClick={() => handleEditCategory({ id: '', name: '', description: '', contentCount: 0, status: 'active' })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Content Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>{category.contentCount}</TableCell>
                      <TableCell>{getStatusBadge(category.status)}</TableCell>
                      <TableCell>{new Date().toLocaleDateString()}</TableCell>
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
                            <DropdownMenuItem 
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600"
                            >
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isPreviewOpen && previewItem && (
        <ContentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          content={previewItem}
        />
      )}

      {isEditCategoryOpen && (
        <EditCategoryModal
          isOpen={isEditCategoryOpen}
          onClose={() => setIsEditCategoryOpen(false)}
          category={editingCategory}
          onSave={(category) => {
            // Handle save
            setIsEditCategoryOpen(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default ContentManagement;