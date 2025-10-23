import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/use-confirmation';
import { useNavigate } from 'react-router-dom';
import { 
  useCategories, 
  useTutorials, 
  useQuizzes,
  useDeleteTutorial,
  useDeleteQuiz,
  useDeleteCategory,
  ContentParams 
} from '@/services';
import { 
  Plus, 
  BookOpen,
  Brain,
  Tag,
  Eye,
  Edit,
  Trash2,
  Star,
  Users,
  Activity,
  Shield,
  User,
  Search,
  Download
} from 'lucide-react';
import DataTable, { Column, Action } from '@/components/admin/DataTable';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import BulkActions from '@/components/admin/BulkActions';
import ActionDropdown, { ActionItem } from '@/components/admin/ActionDropdown';
import { StatusBadge, DifficultyBadge } from '@/components/admin/BadgeUtils';
import { exportToCSV, exportToExcel, exportToPDF, formatDateForExport } from '@/lib/export-utils';

// ============================================================================
// INTERFACES
// ============================================================================

interface TutorialSeries {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalVideos: number;
  totalDuration: string;
  estimatedTime: string;
  status: 'draft' | 'published' | 'archived';
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
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalQuestions: number;
  estimatedTime: string;
  status: 'draft' | 'published' | 'archived';
  createdDate: string;
  updatedDate: string;
  attempts: number;
  averageScore: number;
  passingScore: number;
  timeLimit: number;
  thumbnailUrl: string;
  author: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  contentCount: number;
  status: 'active' | 'inactive';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmation = useConfirmation();

  // ============================================================================
  // STATE MANAGEMENT (Following UserManagement Pattern)
  // ============================================================================
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'tutorials' | 'quizzes' | 'categories'>('tutorials');
  
  // Tutorial state
  const [tutorialSearchTerm, setTutorialSearchTerm] = useState('');
  const [tutorialCategory, setTutorialCategory] = useState('all');
  const [tutorialStatus, setTutorialStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [tutorialSortBy, setTutorialSortBy] = useState<'title' | 'category' | 'created_at' | 'updated_at'>('title');
  const [tutorialSortOrder, setTutorialSortOrder] = useState<'asc' | 'desc'>('asc');
  const [tutorialPage, setTutorialPage] = useState(1);
  const [tutorialItemsPerPage, setTutorialItemsPerPage] = useState(10);
  const [selectedTutorials, setSelectedTutorials] = useState<Set<string>>(new Set());
  
  // Quiz state
  const [quizSearchTerm, setQuizSearchTerm] = useState('');
  const [quizCategory, setQuizCategory] = useState('all');
  const [quizStatus, setQuizStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [quizSortBy, setQuizSortBy] = useState<'title' | 'category' | 'created_at' | 'updated_at'>('title');
  const [quizSortOrder, setQuizSortOrder] = useState<'asc' | 'desc'>('asc');
  const [quizPage, setQuizPage] = useState(1);
  const [quizItemsPerPage, setQuizItemsPerPage] = useState(10);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  
  // Category state
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryStatus, setCategoryStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [categorySortBy, setCategorySortBy] = useState<'title' | 'category' | 'created_at' | 'updated_at'>('title');
  const [categorySortOrder, setCategorySortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryItemsPerPage, setCategoryItemsPerPage] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'tutorial' | 'quiz' | 'category'>('tutorial');
  const [deleteId, setDeleteId] = useState<string>('');
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [multiDeleteType, setMultiDeleteType] = useState<'tutorial' | 'quiz' | 'category'>('tutorial');

  // ============================================================================
  // API QUERIES (Following UserManagement Pattern)
  // ============================================================================
  
  // Tutorial query parameters
  const tutorialParams: ContentParams = {
    page: tutorialPage,
    per_page: tutorialItemsPerPage,
    search: tutorialSearchTerm || undefined,
    category: tutorialCategory !== 'all' ? tutorialCategory : undefined,
    status: tutorialStatus !== 'all' ? tutorialStatus : undefined,
    sort_by: tutorialSortBy,
    sort_order: tutorialSortOrder
  };

  // Quiz query parameters
  const quizParams: ContentParams = {
    page: quizPage,
    per_page: quizItemsPerPage,
    search: quizSearchTerm || undefined,
    category: quizCategory !== 'all' ? quizCategory : undefined,
    status: quizStatus !== 'all' ? quizStatus : undefined,
    sort_by: quizSortBy,
    sort_order: quizSortOrder
  };

  // Category query parameters
  const categoryParams: ContentParams = {
    page: categoryPage,
    per_page: categoryItemsPerPage,
    search: categorySearchTerm || undefined,
    status: categoryStatus !== 'all' ? categoryStatus : undefined,
    sort_by: categorySortBy,
    sort_order: categorySortOrder
  };

  // API queries
  const { data: tutorialsResponse, error: tutorialsError, refetch: refetchTutorials } = useTutorials(tutorialParams);
  const { data: quizzesResponse, error: quizzesError, refetch: refetchQuizzes } = useQuizzes(quizParams);
  const { data: categoriesResponse, error: categoriesError, refetch: refetchCategories } = useCategories();
  
  // Mutations
  const deleteTutorialMutation = useDeleteTutorial();
  const deleteQuizMutation = useDeleteQuiz();
  const deleteCategoryMutation = useDeleteCategory();

  // ============================================================================
  // DATA MAPPING (Fix API Response Structure)
  // ============================================================================
  
  // Map API data to local interfaces
  const tutorialData = Array.isArray(tutorialsResponse?.data) ? tutorialsResponse.data : [];
  console.log('🔍 DEBUG ContentManagement: Tutorial API Response:', tutorialsResponse);
  console.log('🔍 DEBUG ContentManagement: Tutorial Data Array:', tutorialData);
  console.log('🔍 DEBUG ContentManagement: Tutorial Data Length:', tutorialData.length);
  
  const tutorialSeries: TutorialSeries[] = tutorialData.map((tutorial, index) => {
    console.log(`🔍 DEBUG ContentManagement: Tutorial ${index}:`, tutorial);
    const tutorialId = tutorial.id?.toString() || `tutorial-${index}`;
    console.log(`🔍 DEBUG ContentManagement: Tutorial ${index} ID:`, tutorialId);
    return {
      id: tutorialId,
      title: tutorial.title || 'Untitled Tutorial',
      description: tutorial.description || '',
      category: 'General', // TODO: Get from category relationship
      difficulty: 'beginner', // TODO: Get from API
      totalVideos: 1, // TODO: Get from API
      totalDuration: '10:00', // TODO: Get from API
      estimatedTime: '10 minutes', // TODO: Get from API
      status: 'published' as const, // TODO: Get from API
      createdDate: new Date().toISOString().split('T')[0], // TODO: Get from API
      updatedDate: new Date().toISOString().split('T')[0], // TODO: Get from API
      views: 0, // TODO: Get from API
      completions: 0, // TODO: Get from API
      rating: 0, // TODO: Get from API
      thumbnailUrl: 'https://via.placeholder.com/300x200', // TODO: Get from API
      author: 'System' // TODO: Get from API
    };
  });
  
  console.log('🔍 DEBUG ContentManagement: Final Tutorial Series:', tutorialSeries);

  const quizData = Array.isArray(quizzesResponse?.data) ? quizzesResponse.data : [];
  console.log('🔍 DEBUG ContentManagement: Quiz API Response:', quizzesResponse);
  console.log('🔍 DEBUG ContentManagement: Quiz Data Array:', quizData);
  console.log('🔍 DEBUG ContentManagement: Quiz Data Length:', quizData.length);
  
  const quizSeries: QuizSeries[] = quizData.map((quiz, index) => {
    console.log(`🔍 DEBUG ContentManagement: Quiz ${index}:`, quiz);
    const quizId = quiz.id?.toString() || `quiz-${index}`;
    console.log(`🔍 DEBUG ContentManagement: Quiz ${index} ID:`, quizId);
    return {
      id: quizId,
      title: quiz.title || 'Untitled Quiz',
      description: '', // TODO: Get from API
      category: 'General', // TODO: Get from category relationship
      difficulty: 'beginner', // TODO: Get from API
      totalQuestions: 5, // TODO: Get from API
      estimatedTime: '15 minutes', // TODO: Get from API
      status: 'published' as const, // TODO: Get from API
      createdDate: new Date().toISOString().split('T')[0], // TODO: Get from API
      updatedDate: new Date().toISOString().split('T')[0], // TODO: Get from API
      attempts: 0, // TODO: Get from API
      averageScore: 0, // TODO: Get from API
      passingScore: 70, // TODO: Get from API
      timeLimit: 15, // TODO: Get from API
      thumbnailUrl: 'https://via.placeholder.com/300x200', // TODO: Get from API
      author: 'System' // TODO: Get from API
    };
  });
  
  console.log('🔍 DEBUG ContentManagement: Final Quiz Series:', quizSeries);

  const categoryData = Array.isArray(categoriesResponse) ? categoriesResponse : [];
  console.log('🔍 DEBUG ContentManagement: Category API Response:', categoriesResponse);
  console.log('🔍 DEBUG ContentManagement: Category Data Array:', categoryData);
  console.log('🔍 DEBUG ContentManagement: Category Data Length:', categoryData.length);
  
  const categoryList: Category[] = categoryData.map((category, index) => {
    console.log(`🔍 DEBUG ContentManagement: Category ${index}:`, category);
    const categoryId = category.id?.toString() || `category-${index}`;
    console.log(`🔍 DEBUG ContentManagement: Category ${index} ID:`, categoryId);
    return {
      id: categoryId,
      name: category.name || 'Untitled Category',
      description: '', // TODO: Get from API
      contentCount: 0, // TODO: Get from API
      status: 'active' as const // TODO: Get from API
    };
  });
  
  console.log('🔍 DEBUG ContentManagement: Final Category List:', categoryList);

  // ============================================================================
  // EVENT HANDLERS (Following UserManagement Pattern)
  // ============================================================================
  
  // Tutorial handlers
  const handleTutorialSearch = (value: string) => {
    setTutorialSearchTerm(value);
  };

  const handleTutorialFilter = (category: string, status: string) => {
    setTutorialCategory(category);
    setTutorialStatus(status as any);
  };

  const handleTutorialSort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => {
    if (tutorialSortBy === field) {
      setTutorialSortOrder(tutorialSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTutorialSortBy(field);
      setTutorialSortOrder('asc');
    }
  };

  // Quiz handlers
  const handleQuizSearch = (value: string) => {
    setQuizSearchTerm(value);
  };

  const handleQuizFilter = (category: string, status: string) => {
    setQuizCategory(category);
    setQuizStatus(status as any);
  };

  const handleQuizSort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => {
    if (quizSortBy === field) {
      setQuizSortOrder(quizSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setQuizSortBy(field);
      setQuizSortOrder('asc');
    }
  };

  // Category handlers
  const handleCategorySearch = (value: string) => {
    setCategorySearchTerm(value);
  };

  const handleCategoryFilter = (status: string) => {
    setCategoryStatus(status as any);
  };

  const handleCategorySort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => {
    if (categorySortBy === field) {
      setCategorySortOrder(categorySortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setCategorySortBy(field);
      setCategorySortOrder('asc');
    }
  };

  // ============================================================================
  // SELECTION HANDLERS
  // ============================================================================
  
  const handleTutorialSelect = (tutorialId: string, checked: boolean) => {
    const newSelected = new Set(selectedTutorials);
    if (checked) {
      newSelected.add(tutorialId);
    } else {
      newSelected.delete(tutorialId);
    }
    setSelectedTutorials(newSelected);
  };

  const handleTutorialSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTutorials(new Set(tutorialSeries.map(tutorial => tutorial.id)));
    } else {
      setSelectedTutorials(new Set());
    }
  };

  const handleQuizSelect = (quizId: string, checked: boolean) => {
    const newSelected = new Set(selectedQuizzes);
    if (checked) {
      newSelected.add(quizId);
    } else {
      newSelected.delete(quizId);
    }
    setSelectedQuizzes(newSelected);
  };

  const handleQuizSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuizzes(new Set(quizSeries.map(quiz => quiz.id)));
    } else {
      setSelectedQuizzes(new Set());
    }
  };

  const handleCategorySelect = (categoryId: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(categoryId);
    } else {
      newSelected.delete(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleCategorySelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(categoryList.map(category => category.id)));
    } else {
      setSelectedCategories(new Set());
    }
  };

  // ============================================================================
  // EXPORT HANDLERS
  // ============================================================================
  
  const handleTutorialExport = () => {
    if (tutorialSeries.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no tutorials to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Title', 'Description', 'Category', 'Difficulty', 'Status', 'Created'];
    const data = tutorialSeries.map(tutorial => [
      tutorial.title,
      tutorial.description,
      tutorial.category,
      tutorial.difficulty,
      tutorial.status,
      tutorial.createdDate
    ]);

    const exportData = { headers, data, filename: 'tutorials' };
    exportToCSV(exportData);
    
    toast({
      title: "Export Successful",
      description: "Tutorials data has been exported to CSV.",
    });
  };

  const handleQuizExport = () => {
    if (quizSeries.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no quizzes to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Title', 'Description', 'Category', 'Difficulty', 'Status', 'Created'];
    const data = quizSeries.map(quiz => [
      quiz.title,
      quiz.description,
      quiz.category,
      quiz.difficulty,
      quiz.status,
      quiz.createdDate
    ]);

    const exportData = { headers, data, filename: 'quizzes' };
    exportToCSV(exportData);
    
    toast({
      title: "Export Successful",
      description: "Quizzes data has been exported to CSV.",
    });
  };

  const handleCategoryExport = () => {
    if (categoryList.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no categories to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Name', 'Description', 'Content Count', 'Status'];
    const data = categoryList.map(category => [
      category.name,
      category.description,
      category.contentCount,
      category.status
    ]);

    const exportData = { headers, data, filename: 'categories' };
    exportToCSV(exportData);
    
    toast({
      title: "Export Successful",
      description: "Categories data has been exported to CSV.",
    });
  };

  // ============================================================================
  // DELETE HANDLERS
  // ============================================================================
  
  const handleTutorialBulkDelete = async () => {
    if (selectedTutorials.size === 0) {
      toast({
        title: "No Tutorials Selected",
        description: "Please select tutorials to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = await confirmation.confirm({
      title: "Delete Multiple Tutorials",
      message: `Are you sure you want to delete ${selectedTutorials.size} tutorial(s)? This action cannot be undone.`,
      type: "warning",
      confirmText: "Delete All",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      confirmation.setLoading(true);
      
      for (const tutorialId of selectedTutorials) {
        await deleteTutorialMutation.mutateAsync(parseInt(tutorialId));
      }
      
      setSelectedTutorials(new Set());
      
      toast({
        title: "Tutorials Deleted",
        description: `${selectedTutorials.size} tutorial(s) have been deleted successfully.`,
      });
      
      refetchTutorials();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Some tutorials could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      confirmation.setLoading(false);
    }
  };

  const handleQuizBulkDelete = async () => {
    if (selectedQuizzes.size === 0) {
      toast({
        title: "No Quizzes Selected",
        description: "Please select quizzes to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = await confirmation.confirm({
      title: "Delete Multiple Quizzes",
      message: `Are you sure you want to delete ${selectedQuizzes.size} quiz(es)? This action cannot be undone.`,
      type: "warning",
      confirmText: "Delete All",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      confirmation.setLoading(true);
      
      for (const quizId of selectedQuizzes) {
        await deleteQuizMutation.mutateAsync(parseInt(quizId));
      }
      
      setSelectedQuizzes(new Set());
      
      toast({
        title: "Quizzes Deleted",
        description: `${selectedQuizzes.size} quiz(es) have been deleted successfully.`,
      });
      
      refetchQuizzes();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Some quizzes could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      confirmation.setLoading(false);
    }
  };

  const handleCategoryBulkDelete = async () => {
    if (selectedCategories.size === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select categories to delete.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = await confirmation.confirm({
      title: "Delete Multiple Categories",
      message: `Are you sure you want to delete ${selectedCategories.size} categor(ies)? This action cannot be undone.`,
      type: "warning",
      confirmText: "Delete All",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      confirmation.setLoading(true);
      
      for (const categoryId of selectedCategories) {
        await deleteCategoryMutation.mutateAsync(parseInt(categoryId));
      }
      
      setSelectedCategories(new Set());
      
      toast({
        title: "Categories Deleted",
        description: `${selectedCategories.size} categor(ies) have been deleted successfully.`,
      });
      
      refetchCategories();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Some categories could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      confirmation.setLoading(false);
    }
  };

  // ============================================================================
  // TABLE COLUMNS (Following UserManagement Pattern)
  // ============================================================================
  
  const tutorialColumns: Column<TutorialSeries>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (tutorial) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-primary/10 rounded flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{tutorial.title}</div>
            <div className="text-sm text-muted-foreground">{tutorial.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (tutorial) => <Badge variant="secondary">{tutorial.category}</Badge>
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (tutorial) => <DifficultyBadge difficulty={tutorial.difficulty} />
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (tutorial) => <StatusBadge status={tutorial.status} />
    },
    {
      key: 'createdDate',
      label: 'Created',
      sortable: true,
      render: (tutorial) => formatDateForExport(tutorial.createdDate)
    }
  ];

  const quizColumns: Column<QuizSeries>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (quiz) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-primary/10 rounded flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{quiz.title}</div>
            <div className="text-sm text-muted-foreground">{quiz.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (quiz) => <Badge variant="secondary">{quiz.category}</Badge>
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (quiz) => <DifficultyBadge difficulty={quiz.difficulty} />
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (quiz) => <StatusBadge status={quiz.status} />
    },
    {
      key: 'createdDate',
      label: 'Created',
      sortable: true,
      render: (quiz) => formatDateForExport(quiz.createdDate)
    }
  ];

  const categoryColumns: Column<Category>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (category) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-primary/10 rounded flex items-center justify-center">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-muted-foreground">{category.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contentCount',
      label: 'Content Count',
      render: (category) => <span className="text-gray-600">{category.contentCount}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (category) => <StatusBadge status={category.status} />
    }
  ];

  // ============================================================================
  // TABLE ACTIONS
  // ============================================================================
  
  const tutorialActions: Action<TutorialSeries>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (tutorial) => {
        // TODO: Implement view tutorial
        console.log('View tutorial:', tutorial.id);
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (tutorial) => {
        // TODO: Implement edit tutorial
        console.log('Edit tutorial:', tutorial.id);
      }
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (tutorial) => {
        setDeleteType('tutorial');
        setDeleteId(tutorial.id);
        setIsDeleteModalOpen(true);
      },
      variant: 'ghost',
      className: "text-red-600 hover:text-red-700 hover:bg-red-50"
    }
  ];

  const quizActions: Action<QuizSeries>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (quiz) => {
        // TODO: Implement view quiz
        console.log('View quiz:', quiz.id);
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (quiz) => {
        // TODO: Implement edit quiz
        console.log('Edit quiz:', quiz.id);
      }
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (quiz) => {
        setDeleteType('quiz');
        setDeleteId(quiz.id);
        setIsDeleteModalOpen(true);
      },
      variant: 'ghost',
      className: "text-red-600 hover:text-red-700 hover:bg-red-50"
    }
  ];

  const categoryActions: Action<Category>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (category) => {
        // TODO: Implement edit category
        console.log('Edit category:', category.id);
      }
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (category) => {
        setDeleteType('category');
        setDeleteId(category.id);
        setIsDeleteModalOpen(true);
      },
      variant: 'ghost',
      className: "text-red-600 hover:text-red-700 hover:bg-red-50"
    }
  ];

  // ============================================================================
  // BREADCRUMB
  // ============================================================================
  
  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' }
  ];

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="space-y-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header - Following UserManagement Pattern */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Content Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage tutorials, quizzes, and educational content
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Bulk Actions - Following UserManagement Pattern */}
          {activeTab === 'tutorials' && (
            <BulkActions
              selectedCount={selectedTutorials.size}
              onBulkDelete={() => {
                setMultiDeleteType('tutorial');
                setIsMultiDeleteModalOpen(true);
              }}
              onExport={handleTutorialExport}
              deleteLabel="Delete"
              exportLabel="Export"
            />
          )}
          
          {activeTab === 'quizzes' && (
            <BulkActions
              selectedCount={selectedQuizzes.size}
              onBulkDelete={() => {
                setMultiDeleteType('quiz');
                setIsMultiDeleteModalOpen(true);
              }}
              onExport={handleQuizExport}
              deleteLabel="Delete"
              exportLabel="Export"
            />
          )}
          
          {activeTab === 'categories' && (
            <BulkActions
              selectedCount={selectedCategories.size}
              onBulkDelete={() => {
                setMultiDeleteType('category');
                setIsMultiDeleteModalOpen(true);
              }}
              onExport={handleCategoryExport}
              deleteLabel="Delete"
              exportLabel="Export"
            />
          )}

          {/* Create Content Dropdown - Following Your Design */}
          <ActionDropdown
            primaryButton={{
              label: "Create Content",
              icon: <Plus className="h-4 w-4" />
            }}
            items={[
              {
                key: "tutorial",
                label: "Tutorial Series",
                icon: <BookOpen className="h-4 w-4" />,
                onClick: () => navigate('/admin/content/create-tutorial')
              },
              {
                key: "quiz",
                label: "Quiz Series",
                icon: <Brain className="h-4 w-4" />,
                onClick: () => navigate('/admin/content/create-quiz')
              },
              {
                key: "category",
                label: "Category",
                icon: <Tag className="h-4 w-4" />,
                onClick: () => navigate('/admin/content/create-category')
              }
            ]}
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white"
          />
        </div>
      </div>

      {/* Tabs - Following UserManagement Pattern */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-primary/5 border border-primary/20">
          <TabsTrigger 
            value="tutorials" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <BookOpen className="h-4 w-4" />
            Tutorial Series ({tutorialSeries.length})
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Brain className="h-4 w-4" />
            Quiz Series ({quizSeries.length})
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Tag className="h-4 w-4" />
            Categories ({categoryList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tutorial Series Tab */}
        <TabsContent value="tutorials" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={tutorialSearchTerm}
                onSearchChange={handleTutorialSearch}
                searchPlaceholder="Search tutorials..."
                filterValue={tutorialCategory}
                onFilterChange={(category) => handleTutorialFilter(category, tutorialStatus)}
                filterOptions={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'general', label: 'General' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                filterLabel="Category:"
              />
            </CardContent>
          </Card>

          {/* Tutorial Table */}
          <DataTable
            data={tutorialSeries}
            columns={tutorialColumns}
            actions={tutorialActions}
            pagination={{
              current_page: tutorialPage,
              total_pages: Math.ceil(tutorialSeries.length / tutorialItemsPerPage),
              total_count: tutorialSeries.length,
              per_page: tutorialItemsPerPage
            }}
            selectedItems={new Set(Array.from(selectedTutorials).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              setSelectedTutorials(prev => {
                const newSet = new Set(prev);
                if (checked) {
                  newSet.add(stringId);
                } else {
                  newSet.delete(stringId);
                }
                return newSet;
              });
            }}
            onSelectAll={handleTutorialSelectAll}
            onPageChange={setTutorialPage}
            onItemsPerPageChange={(value) => setTutorialItemsPerPage(parseInt(value))}
            sortBy={tutorialSortBy}
            sortOrder={tutorialSortOrder}
            onSort={handleTutorialSort}
            error={tutorialsError}
            onRetry={() => refetchTutorials()}
            emptyStateIcon={<BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={tutorialSearchTerm || tutorialCategory !== 'all' ? 'No Tutorials Found' : 'No Tutorials Yet'}
            emptyStateDescription={tutorialSearchTerm || tutorialCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first tutorial.'
            }
            emptyStateAction={!tutorialSearchTerm && tutorialCategory === 'all' ? (
              <Button onClick={() => navigate('/admin/content/create-tutorial')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Tutorial
              </Button>
            ) : undefined}
            title="Tutorial Series"
            description={`${tutorialSeries.length} total tutorials`}
            getItemId={(tutorial) => {
              console.log('🔍 DEBUG ContentManagement: Tutorial getItemId called with:', tutorial);
              console.log('🔍 DEBUG ContentManagement: Tutorial ID string:', tutorial.id);
              const parsedId = parseInt(tutorial.id);
              console.log('🔍 DEBUG ContentManagement: Tutorial parsed ID:', parsedId);
              return parsedId;
            }}
          />
        </TabsContent>

        {/* Quiz Series Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={quizSearchTerm}
                onSearchChange={handleQuizSearch}
                searchPlaceholder="Search quizzes..."
                filterValue={quizCategory}
                onFilterChange={(category) => handleQuizFilter(category, quizStatus)}
                filterOptions={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'general', label: 'General' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
                filterLabel="Category:"
              />
            </CardContent>
          </Card>

          {/* Quiz Table */}
          <DataTable
            data={quizSeries}
            columns={quizColumns}
            actions={quizActions}
            pagination={{
              current_page: quizPage,
              total_pages: Math.ceil(quizSeries.length / quizItemsPerPage),
              total_count: quizSeries.length,
              per_page: quizItemsPerPage
            }}
            selectedItems={new Set(Array.from(selectedQuizzes).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              setSelectedQuizzes(prev => {
                const newSet = new Set(prev);
                if (checked) {
                  newSet.add(stringId);
                } else {
                  newSet.delete(stringId);
                }
                return newSet;
              });
            }}
            onSelectAll={handleQuizSelectAll}
            onPageChange={setQuizPage}
            onItemsPerPageChange={(value) => setQuizItemsPerPage(parseInt(value))}
            sortBy={quizSortBy}
            sortOrder={quizSortOrder}
            onSort={handleQuizSort}
            error={quizzesError}
            onRetry={() => refetchQuizzes()}
            emptyStateIcon={<Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={quizSearchTerm || quizCategory !== 'all' ? 'No Quizzes Found' : 'No Quizzes Yet'}
            emptyStateDescription={quizSearchTerm || quizCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first quiz.'
            }
            emptyStateAction={!quizSearchTerm && quizCategory === 'all' ? (
              <Button onClick={() => navigate('/admin/content/create-quiz')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Quiz
              </Button>
            ) : undefined}
            title="Quiz Series"
            description={`${quizSeries.length} total quizzes`}
            getItemId={(quiz) => {
              console.log('🔍 DEBUG ContentManagement: Quiz getItemId called with:', quiz);
              console.log('🔍 DEBUG ContentManagement: Quiz ID string:', quiz.id);
              const parsedId = parseInt(quiz.id);
              console.log('🔍 DEBUG ContentManagement: Quiz parsed ID:', parsedId);
              return parsedId;
            }}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={categorySearchTerm}
                onSearchChange={handleCategorySearch}
                searchPlaceholder="Search categories..."
                filterValue={categoryStatus}
                onFilterChange={handleCategoryFilter}
                filterOptions={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                filterLabel="Status:"
              />
            </CardContent>
          </Card>

          {/* Category Table */}
          <DataTable
            data={categoryList}
            columns={categoryColumns}
            actions={categoryActions}
            pagination={{
              current_page: categoryPage,
              total_pages: Math.ceil(categoryList.length / categoryItemsPerPage),
              total_count: categoryList.length,
              per_page: categoryItemsPerPage
            }}
            selectedItems={new Set(Array.from(selectedCategories).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              setSelectedCategories(prev => {
                const newSet = new Set(prev);
                if (checked) {
                  newSet.add(stringId);
                } else {
                  newSet.delete(stringId);
                }
                return newSet;
              });
            }}
            onSelectAll={handleCategorySelectAll}
            onPageChange={setCategoryPage}
            onItemsPerPageChange={(value) => setCategoryItemsPerPage(parseInt(value))}
            sortBy={categorySortBy}
            sortOrder={categorySortOrder}
            onSort={handleCategorySort}
            error={categoriesError}
            onRetry={() => refetchCategories()}
            emptyStateIcon={<Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={categorySearchTerm || categoryStatus !== 'all' ? 'No Categories Found' : 'No Categories Yet'}
            emptyStateDescription={categorySearchTerm || categoryStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first category.'
            }
            emptyStateAction={!categorySearchTerm && categoryStatus === 'all' ? (
              <Button onClick={() => navigate('/admin/content/create-category')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            ) : undefined}
            title="Categories"
            description={`${categoryList.length} total categories`}
            getItemId={(category) => {
              console.log('🔍 DEBUG ContentManagement: Category getItemId called with:', category);
              console.log('🔍 DEBUG ContentManagement: Category ID string:', category.id);
              const parsedId = parseInt(category.id);
              console.log('🔍 DEBUG ContentManagement: Category parsed ID:', parsedId);
              return parsedId;
            }}
          />
        </TabsContent>
      </Tabs>


      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteType === 'tutorial' ? 'Tutorial' : deleteType === 'quiz' ? 'Quiz' : 'Category'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                // TODO: Implement delete logic
                console.log('Delete', deleteType, deleteId);
                setIsDeleteModalOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {deleteType === 'tutorial' ? 'Tutorial' : deleteType === 'quiz' ? 'Quiz' : 'Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Multiple Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isMultiDeleteModalOpen}
        onClose={() => setIsMultiDeleteModalOpen(false)}
        onConfirm={() => {
          if (multiDeleteType === 'tutorial') handleTutorialBulkDelete();
          if (multiDeleteType === 'quiz') handleQuizBulkDelete();
          if (multiDeleteType === 'category') handleCategoryBulkDelete();
        }}
        title={`Delete Multiple ${multiDeleteType === 'tutorial' ? 'Tutorials' : multiDeleteType === 'quiz' ? 'Quizzes' : 'Categories'}`}
        message={`Are you sure you want to delete ${multiDeleteType === 'tutorial' ? selectedTutorials.size : multiDeleteType === 'quiz' ? selectedQuizzes.size : selectedCategories.size} ${multiDeleteType}(s)? This action cannot be undone.`}
        type="warning"
        confirmText="Delete All"
        cancelText="Cancel"
        isLoading={confirmation.isLoading}
      />
    </div>
  );
};

export default ContentManagement;