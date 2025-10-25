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
  FileText
} from 'lucide-react';
import DataTable, { Column, Action } from '@/components/admin/DataTable';
import SearchFilterBar from '@/components/admin/SearchFilterBar';
import BulkActions from '@/components/admin/BulkActions';
import ActionDropdown from '@/components/admin/ActionDropdown';
import { StatusBadge, DifficultyBadge } from '@/components/admin/BadgeUtils';
import { formatDateForExport } from '@/lib/export-utils';
import { useContentState } from '@/hooks/use-content-state';
import { useContentOperations } from '@/hooks/use-content-operations';
import {
  mapTutorialData,
  mapQuizData,
  mapCategoryData,
  buildContentParams,
  getTableConfig
} from '@/lib/content-utils';

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
  // SHARED STATE MANAGEMENT (DRY PRINCIPLE)
  // ============================================================================

  // Active tab state
  const [activeTab, setActiveTab] = useState<'tutorials' | 'quizzes' | 'categories' | 'drafts'>('tutorials');

  // Shared state for all content types with default sorting by ID
  const [tutorialState, tutorialStateActions] = useContentState({
    sortBy: 'id',
    sortOrder: 'asc',
    itemsPerPage: 10
  });
  const [quizState, quizStateActions] = useContentState({
    sortBy: 'id',
    sortOrder: 'asc',
    itemsPerPage: 10
  });
  const [categoryState, categoryStateActions] = useContentState({
    sortBy: 'id',
    sortOrder: 'asc',
    itemsPerPage: 10
  });

  // Shared operations
  const contentOperations = useContentOperations();

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'tutorial' | 'quiz' | 'category'>('tutorial');
  const [deleteId, setDeleteId] = useState<string>('');
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [multiDeleteType, setMultiDeleteType] = useState<'tutorial' | 'quiz' | 'category'>('tutorial');

  // Preview modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<TutorialSeries | QuizSeries | Category | null>(null);
  const [previewType, setPreviewType] = useState<'tutorial' | 'quiz' | 'category'>('tutorial');

  // Draft state
  const [draftSearchValue, setDraftSearchValue] = useState('');
  const [draftSortField, setDraftSortField] = useState<string>('created_at');
  const [draftSortOrder, setDraftSortOrder] = useState<'asc' | 'desc'>('desc');
  const [draftPage, setDraftPage] = useState(1);
  const [draftPerPage, setDraftPerPage] = useState(10);
  const [selectedDraftItems, setSelectedDraftItems] = useState<Set<number>>(new Set());

  // ============================================================================
  // API QUERIES (Using Shared Utilities)
  // ============================================================================

  // Build query parameters using shared utility
  const tutorialParams: ContentParams = buildContentParams(
    tutorialState.currentPage,
    tutorialState.itemsPerPage,
    tutorialState.searchTerm,
    tutorialState.category,
    'published', // Only show published tutorials, not drafts
    tutorialState.sortBy,
    tutorialState.sortOrder
  );

  const quizParams: ContentParams = buildContentParams(
    quizState.currentPage,
    quizState.itemsPerPage,
    quizState.searchTerm,
    quizState.category,
    quizState.status,
    quizState.sortBy,
    quizState.sortOrder
  );

  const categoryParams: ContentParams = buildContentParams(
    categoryState.currentPage,
    categoryState.itemsPerPage,
    categoryState.searchTerm,
    'all', // Categories don't have category filter
    categoryState.status,
    categoryState.sortBy,
    categoryState.sortOrder
  );

  // API queries
  const { data: tutorialsResponse, error: tutorialsError, refetch: refetchTutorials } = useTutorials(tutorialParams);
  const { data: quizzesResponse, error: quizzesError, refetch: refetchQuizzes } = useQuizzes(quizParams);
  const { data: categoriesResponse, error: categoriesError, refetch: refetchCategories } = useCategories(categoryParams);

  // ============================================================================
  // DATA MAPPING (Using Shared Utilities)
  // ============================================================================

  // Map API data using shared utilities
  const tutorialData = Array.isArray(tutorialsResponse?.tutorials) ? tutorialsResponse.tutorials : (Array.isArray(tutorialsResponse?.data) ? tutorialsResponse.data : (Array.isArray(tutorialsResponse) ? tutorialsResponse : []));
  const tutorialSeries: TutorialSeries[] = tutorialData.map((tutorial, index) => {
    const mapped = mapTutorialData(tutorial, index);
    return {
      ...mapped,
      difficulty: tutorial.difficulty || 'beginner',
      totalVideos: tutorial.video_data ? JSON.parse(tutorial.video_data).length : 1,
      totalDuration: tutorial.video_data ? `${JSON.parse(tutorial.video_data).length * 10}:00` : '10:00',
      estimatedTime: `${tutorial.video_data ? JSON.parse(tutorial.video_data).length * 10 : 10} minutes`,
      status: tutorial.status || 'published',
      updatedDate: tutorial.updated_at ? new Date(tutorial.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      views: tutorial.views || 0,
      completions: 0, // This field doesn't exist in database yet
      rating: tutorial.rating || 0,
      thumbnailUrl: tutorial.thumbnail_path || 'https://via.placeholder.com/300x200',
      author: tutorial.author || 'System'
    };
  });

  const quizData = Array.isArray(quizzesResponse) ? quizzesResponse : (Array.isArray(quizzesResponse?.data) ? quizzesResponse.data : []);
  const quizSeries: QuizSeries[] = quizData.map((quiz, index) => {
    const mapped = mapQuizData(quiz, index);
    return {
      ...mapped,
      difficulty: 'beginner' as const,
      totalQuestions: 5,
      estimatedTime: '15 minutes',
      status: 'published' as const,
      updatedDate: new Date().toISOString().split('T')[0],
      attempts: 0,
      averageScore: 0,
      passingScore: 70,
      timeLimit: 15,
      thumbnailUrl: 'https://via.placeholder.com/300x200',
      author: 'System'
    };
  });

  const categoryData = Array.isArray(categoriesResponse) ? categoriesResponse : (Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []);
  const categoryList: Category[] = categoryData.map((category, index) => {
    const mapped = mapCategoryData(category, index);
    return {
      id: mapped.id,
      name: mapped.title,
      description: mapped.description,
      contentCount: 0,
      status: mapped.status as 'active' | 'inactive'
    };
  });

  // ============================================================================
  // SHARED EVENT HANDLERS (DRY PRINCIPLE)
  // ============================================================================

  // Tutorial handlers using shared state
  const handleTutorialSearch = (value: string) => tutorialStateActions.handleSearch(value);
  const handleTutorialFilter = (category: string, status: string) => tutorialStateActions.handleFilter(category, status);
  const handleTutorialSort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => tutorialStateActions.handleSort(field);
  const handleTutorialSelect = (tutorialId: string, checked: boolean) => tutorialStateActions.handleItemSelect(tutorialId, checked);
  const handleTutorialSelectAll = (checked: boolean) => tutorialStateActions.handleSelectAll(checked, tutorialSeries.map(t => t.id));

  // Quiz handlers using shared state
  const handleQuizSearch = (value: string) => quizStateActions.handleSearch(value);
  const handleQuizFilter = (category: string, status: string) => quizStateActions.handleFilter(category, status);
  const handleQuizSort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => quizStateActions.handleSort(field);
  const handleQuizSelect = (quizId: string, checked: boolean) => quizStateActions.handleItemSelect(quizId, checked);
  const handleQuizSelectAll = (checked: boolean) => quizStateActions.handleSelectAll(checked, quizSeries.map(q => q.id));

  // Category handlers using shared state
  const handleCategorySearch = (value: string) => categoryStateActions.handleSearch(value);
  const handleCategoryFilter = (status: string) => categoryStateActions.handleFilter('all', status);
  const handleCategorySort = (field: 'title' | 'category' | 'created_at' | 'updated_at') => categoryStateActions.handleSort(field);
  const handleCategorySelect = (categoryId: string, checked: boolean) => categoryStateActions.handleItemSelect(categoryId, checked);
  const handleCategorySelectAll = (checked: boolean) => categoryStateActions.handleSelectAll(checked, categoryList.map(c => c.id));

  // ============================================================================
  // SHARED EXPORT HANDLERS (DRY PRINCIPLE)
  // ============================================================================

  const handleTutorialExport = () => {
    const exportData = tutorialSeries.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      category: tutorial.category,
      status: tutorial.status,
      createdDate: tutorial.createdDate
    }));
    contentOperations.handleExport(exportData, 'tutorials');
  };

  const handleQuizExport = () => {
    const exportData = quizSeries.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      status: quiz.status,
      createdDate: quiz.createdDate
    }));
    contentOperations.handleExport(exportData, 'quizzes');
  };

  const handleCategoryExport = () => {
    const exportData = categoryList.map(category => ({
      id: category.id,
      title: category.name,
      description: category.description,
      category: 'General',
      status: category.status,
      createdDate: new Date().toISOString().split('T')[0]
    }));
    contentOperations.handleExport(exportData, 'categories');
  };

  // ============================================================================
  // SHARED DELETE HANDLERS (DRY PRINCIPLE)
  // ============================================================================

  const handleTutorialBulkDelete = async () => {
    await contentOperations.handleBulkDelete(
      tutorialState.selectedItems,
      'tutorial',
      () => {
        tutorialStateActions.resetSelection();
        refetchTutorials();
      }
    );
  };

  const handleQuizBulkDelete = async () => {
    await contentOperations.handleBulkDelete(
      quizState.selectedItems,
      'quiz',
      () => {
        quizStateActions.resetSelection();
        refetchQuizzes();
      }
    );
  };

  const handleCategoryBulkDelete = async () => {
    await contentOperations.handleBulkDelete(
      categoryState.selectedItems,
      'category',
      () => {
        categoryStateActions.resetSelection();
        refetchCategories();
      }
    );
  };

  // Draft handlers
  const handleDraftPageChange = (page: number) => setDraftPage(page);
  const handleDraftPerPageChange = (perPage: number) => {
    setDraftPerPage(perPage);
    setDraftPage(1);
  };
  const handleDraftSort = (field: string) => {
    if (draftSortField === field) {
      setDraftSortOrder(draftSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setDraftSortField(field);
      setDraftSortOrder('asc');
    }
    setDraftPage(1);
  };
  const handleDraftItemSelect = (itemId: number | string, checked: boolean) => {
    const newSelected = new Set(selectedDraftItems);
    const id = typeof itemId === 'number' ? itemId : parseInt(itemId);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedDraftItems(newSelected);
  };
  const handleDraftSelectAll = (checked: boolean) => {
    if (checked && draftsResponse?.data) {
      setSelectedDraftItems(new Set(draftsResponse.data.map((item: any) => parseInt(item.id))));
    } else {
      setSelectedDraftItems(new Set());
    }
  };
  const handleDraftSearch = () => {
    setDraftPage(1);
    refetchDrafts();
  };
  const handleDraftBulkAction = (action: string) => {
    if (action === 'delete') {
      const selectedIds = new Set(Array.from(selectedDraftItems).map(id => id.toString()));
      contentOperations.handleBulkDelete(selectedIds, 'tutorial', () => {
        setSelectedDraftItems(new Set());
        refetchDrafts();
      });
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

  // Draft columns
  const draftColumns: Column<any>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (draft: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{draft.title || 'Untitled Tutorial'}</div>
            <div className="text-sm text-gray-500">{draft.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (draft: any) => draft.category?.category_name || 'Not selected'
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      sortable: true,
      render: (draft: any) => (
        <Badge variant={draft.difficulty === 'beginner' ? 'default' : draft.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
          {draft.difficulty || 'Not set'}
        </Badge>
      )
    },
    {
      key: 'videos',
      label: 'Videos',
      render: (draft: any) => draft.videos?.length || 0
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (draft: any) => new Date(draft.created_at).toLocaleDateString()
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
        // Show preview modal
        setPreviewItem(tutorial);
        setPreviewType('tutorial');
        setIsPreviewModalOpen(true);
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (tutorial) => {
        // Navigate to tutorial creation wizard with edit mode
        navigate('/admin/content/create-tutorial', {
          state: { editMode: true, tutorialId: tutorial.id }
        });
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
        // Navigate to quiz detail page
        navigate(`/admin/content/quizzes/${quiz.id}`);
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (quiz) => {
        // Navigate to quiz creation wizard with edit mode
        navigate('/admin/content/create-quiz', {
          state: { editMode: true, quizId: quiz.id }
        });
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
        // Navigate to category creation wizard with edit mode
        navigate('/admin/content/create-category', {
          state: { editMode: true, categoryId: category.id }
        });
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

  // Draft actions
  const draftActions: Action<any>[] = [
    {
      key: 'edit',
      label: 'Continue Editing',
      icon: <Edit className="h-4 w-4" />,
      onClick: (draft: any) => continueDraft(draft),
      className: 'text-primary hover:text-primary/80'
    },
    {
      key: 'delete',
      label: 'Delete Draft',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (draft: any) => {
        setDeleteType('tutorial');
        setDeleteId(draft.id);
        setIsDeleteModalOpen(true);
      },
      variant: 'ghost',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ];

  const draftBulkActions = [
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: () => handleDraftBulkAction('delete')
    }
  ];

  // ============================================================================
  // DRAFTS MANAGEMENT
  // ============================================================================

  // Fetch drafts from server - only get draft status records
  const { data: draftsResponse, refetch: refetchDrafts, isLoading: isDraftsLoading, error: draftsError } = useTutorials({
    status: 'draft' as any, // Only fetch draft status records
    per_page: draftPerPage,
    page: draftPage
  });

  const getDraftsCount = () => {
    return draftsResponse?.data?.length || 0;
  };

  const getTutorialDrafts = () => {
    return draftsResponse?.data || [];
  };

  const getQuizDrafts = () => {
    return []; // No quiz drafts for now
  };

  const getCategoryDrafts = () => {
    return []; // No category drafts for now
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const apiClient = (await import('@/lib/api')).default;
      const result = await apiClient.deleteTutorial(parseInt(draftId));

      if (result.success) {
        toast({
          title: "Draft Deleted",
          description: "The draft has been permanently deleted."
        });
        refetchDrafts();
      } else {
        throw new Error(result.message || 'Failed to delete draft');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const continueDraft = (draft: any) => {
    // Navigate to tutorial creation with draft data
    navigate('/admin/content/create-tutorial', {
      state: { editMode: true, tutorialId: draft.id }
    });
  };

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
          {/* Bulk Actions - Using Shared State */}
          {activeTab === 'tutorials' && (
            <BulkActions
              selectedCount={tutorialState.selectedItems.size}
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
              selectedCount={quizState.selectedItems.size}
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
              selectedCount={categoryState.selectedItems.size}
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
                onClick: () => contentOperations.handleCreate('tutorial')
              },
              {
                key: "quiz",
                label: "Quiz Series",
                icon: <Brain className="h-4 w-4" />,
                onClick: () => contentOperations.handleCreate('quiz')
              },
              {
                key: "category",
                label: "Category",
                icon: <Tag className="h-4 w-4" />,
                onClick: () => contentOperations.handleCreate('category')
              }
            ]}
            variant="default"
            className="bg-primary hover:bg-primary/90 text-white"
          />
        </div>
      </div>

      {/* Tabs - Following UserManagement Pattern */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className={`grid w-full ${getDraftsCount() > 0 ? 'grid-cols-4' : 'grid-cols-3'} bg-primary/5 border border-primary/20`}>
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
          {getDraftsCount() > 0 && (
            <TabsTrigger
              value="drafts"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              <Edit className="h-4 w-4" />
              Drafts ({getDraftsCount()})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tutorial Series Tab */}
        <TabsContent value="tutorials" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={tutorialState.searchTerm}
                onSearchChange={handleTutorialSearch}
                searchPlaceholder="Search tutorials..."
                filterValue={tutorialState.category}
                onFilterChange={(category) => handleTutorialFilter(category, tutorialState.status)}
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
            pagination={tutorialsResponse?.pagination ? {
              current_page: tutorialsResponse.pagination.current_page,
              total_pages: tutorialsResponse.pagination.total_pages,
              total_count: tutorialsResponse.pagination.total_count,
              per_page: tutorialsResponse.pagination.per_page
            } : undefined}
            selectedItems={new Set(Array.from(tutorialState.selectedItems).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              tutorialStateActions.handleItemSelect(stringId, checked);
            }}
            onSelectAll={handleTutorialSelectAll}
            onPageChange={tutorialStateActions.setCurrentPage}
            onItemsPerPageChange={(value) => tutorialStateActions.setItemsPerPage(parseInt(value))}
            sortBy={tutorialState.sortBy}
            sortOrder={tutorialState.sortOrder}
            onSort={handleTutorialSort}
            error={tutorialsError}
            onRetry={() => refetchTutorials()}
            emptyStateIcon={<BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={tutorialState.searchTerm || tutorialState.category !== 'all' ? 'No Tutorials Found' : 'No Tutorials Yet'}
            emptyStateDescription={tutorialState.searchTerm || tutorialState.category !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first tutorial.'
            }
            emptyStateAction={!tutorialState.searchTerm && tutorialState.category === 'all' ? (
              <Button onClick={() => contentOperations.handleCreate('tutorial')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Tutorial
              </Button>
            ) : undefined}
            title="Tutorial Series"
            description={`${tutorialsResponse?.pagination?.total_count || 0} total tutorials`}
            getItemId={(tutorial) => parseInt(tutorial.id)}
          />
        </TabsContent>

        {/* Quiz Series Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={quizState.searchTerm}
                onSearchChange={handleQuizSearch}
                searchPlaceholder="Search quizzes..."
                filterValue={quizState.category}
                onFilterChange={(category) => handleQuizFilter(category, quizState.status)}
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
            pagination={quizzesResponse?.pagination ? {
              current_page: quizzesResponse.pagination.current_page,
              total_pages: quizzesResponse.pagination.total_pages,
              total_count: quizzesResponse.pagination.total_count,
              per_page: quizzesResponse.pagination.per_page
            } : undefined}
            selectedItems={new Set(Array.from(quizState.selectedItems).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              quizStateActions.handleItemSelect(stringId, checked);
            }}
            onSelectAll={handleQuizSelectAll}
            onPageChange={quizStateActions.setCurrentPage}
            onItemsPerPageChange={(value) => quizStateActions.setItemsPerPage(parseInt(value))}
            sortBy={quizState.sortBy}
            sortOrder={quizState.sortOrder}
            onSort={handleQuizSort}
            error={quizzesError}
            onRetry={() => refetchQuizzes()}
            emptyStateIcon={<Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={quizState.searchTerm || quizState.category !== 'all' ? 'No Quizzes Found' : 'No Quizzes Yet'}
            emptyStateDescription={quizState.searchTerm || quizState.category !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first quiz.'
            }
            emptyStateAction={!quizState.searchTerm && quizState.category === 'all' ? (
              <Button onClick={() => contentOperations.handleCreate('quiz')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Quiz
              </Button>
            ) : undefined}
            title="Quiz Series"
            description={`${quizSeries.length} total quizzes`}
            getItemId={(quiz) => parseInt(quiz.id)}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Search and Filters - Separate Section */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <SearchFilterBar
                searchTerm={categoryState.searchTerm}
                onSearchChange={handleCategorySearch}
                searchPlaceholder="Search categories..."
                filterValue={categoryState.status}
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
            pagination={categoriesResponse?.pagination ? {
              current_page: categoriesResponse.pagination.current_page,
              total_pages: categoriesResponse.pagination.total_pages,
              total_count: categoriesResponse.pagination.total_count,
              per_page: categoriesResponse.pagination.per_page
            } : undefined}
            selectedItems={new Set(Array.from(categoryState.selectedItems).map(id => parseInt(id)))}
            onItemSelect={(id, checked) => {
              const stringId = id.toString();
              categoryStateActions.handleItemSelect(stringId, checked);
            }}
            onSelectAll={handleCategorySelectAll}
            onPageChange={categoryStateActions.setCurrentPage}
            onItemsPerPageChange={(value) => categoryStateActions.setItemsPerPage(parseInt(value))}
            sortBy={categoryState.sortBy}
            sortOrder={categoryState.sortOrder}
            onSort={handleCategorySort}
            error={categoriesError}
            onRetry={() => refetchCategories()}
            emptyStateIcon={<Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
            emptyStateTitle={categoryState.searchTerm || categoryState.status !== 'all' ? 'No Categories Found' : 'No Categories Yet'}
            emptyStateDescription={categoryState.searchTerm || categoryState.status !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first category.'
            }
            emptyStateAction={!categoryState.searchTerm && categoryState.status === 'all' ? (
              <Button onClick={() => contentOperations.handleCreate('category')} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            ) : undefined}
            title="Categories"
            description={`${categoryList.length} total categories`}
            getItemId={(category) => parseInt(category.id)}
          />
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                {draftsResponse?.data && draftsResponse.data.length > 0 ? (
                  <DataTable
                    data={draftsResponse.data}
                    columns={draftColumns}
                    actions={draftActions}
                    pagination={draftsResponse.pagination}
                    onPageChange={handleDraftPageChange}
                    onItemsPerPageChange={(value) => {
                      setDraftPerPage(parseInt(value));
                      setDraftPage(1);
                    }}
                    onSort={handleDraftSort}
                    onItemSelect={handleDraftItemSelect}
                    onSelectAll={handleDraftSelectAll}
                    selectedItems={selectedDraftItems}
                    sortBy={draftSortField}
                    sortOrder={draftSortOrder}
                    error={draftsError}
                    onRetry={refetchDrafts}
                    emptyStateTitle="No Drafts Found"
                    emptyStateDescription="You haven't saved any drafts yet. Start creating content to see your drafts here."
                    emptyStateAction={
                      <Button onClick={() => navigate('/admin/content/create-tutorial')} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Tutorial
                      </Button>
                    }
                    title="Saved Drafts"
                    description={`${draftsResponse?.pagination?.total_count || 0} total drafts`}
                    getItemId={(draft) => parseInt(draft.id)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Drafts Found</h3>
                    <p className="text-gray-600 mb-6">You haven't saved any drafts yet. Start creating content to see your drafts here.</p>
                    <Button onClick={() => navigate('/admin/content/create-tutorial')} className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Tutorial
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
              onClick={async () => {
                console.log('DEBUG: Individual delete clicked', { deleteType, deleteId });
                try {
                  if (deleteType === 'tutorial') {
                    console.log('DEBUG: Deleting tutorial with ID:', deleteId);
                    // Use API client for tutorial delete
                    const apiClient = (await import('@/lib/api')).default;
                    console.log('DEBUG: Calling apiClient.deleteTutorial');
                    const result = await apiClient.deleteTutorial(parseInt(deleteId));
                    console.log('DEBUG: Tutorial delete result:', result);

                    if (result.success) {
                      console.log('DEBUG: Tutorial delete successful');
                      toast({
                        title: "Tutorial Deleted",
                        description: "The tutorial has been successfully deleted."
                      });
                      // Refresh the data
                      refetchTutorials();
                    } else {
                      console.log('DEBUG: Tutorial delete failed:', result.message);
                      throw new Error(result.message || 'Failed to delete tutorial');
                    }
                  } else if (deleteType === 'quiz') {
                    console.log('DEBUG: Deleting quiz with ID:', deleteId);
                    // Use API client for quiz delete
                    const apiClient = (await import('@/lib/api')).default;
                    console.log('DEBUG: Calling apiClient.deleteQuiz');
                    const result = await apiClient.deleteQuiz(parseInt(deleteId));
                    console.log('DEBUG: Quiz delete result:', result);

                    if (result.success) {
                      console.log('DEBUG: Quiz delete successful');
                      toast({
                        title: "Quiz Deleted",
                        description: "The quiz has been successfully deleted."
                      });
                      // Refresh the data
                      refetchQuizzes();
                    } else {
                      console.log('DEBUG: Quiz delete failed:', result.message);
                      throw new Error(result.message || 'Failed to delete quiz');
                    }
                  } else if (deleteType === 'category') {
                    console.log('DEBUG: Deleting category with ID:', deleteId);
                    // Use API client for category delete
                    const apiClient = (await import('@/lib/api')).default;
                    console.log('DEBUG: Calling apiClient.deleteCategory');
                    const result = await apiClient.deleteCategory(parseInt(deleteId));
                    console.log('DEBUG: Category delete result:', result);

                    if (result.success) {
                      console.log('DEBUG: Category delete successful');
                      toast({
                        title: "Category Deleted",
                        description: "The category has been successfully deleted."
                      });
                      // Refresh the data
                      refetchCategories();
                    } else {
                      console.log('DEBUG: Category delete failed:', result.message);
                      throw new Error(result.message || 'Failed to delete category');
                    }
                  }
                } catch (error) {
                  console.error('DEBUG: Individual delete error:', error);
                  toast({
                    variant: "destructive",
                    title: "Delete Failed",
                    description: "Failed to delete the item. Please try again."
                  });
                } finally {
                  setIsDeleteModalOpen(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {deleteType === 'tutorial' ? 'Tutorial' : deleteType === 'quiz' ? 'Quiz' : 'Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Multi-Delete Confirmation Modal */}
      <AlertDialog open={isMultiDeleteModalOpen} onOpenChange={setIsMultiDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple {multiDeleteType === 'tutorial' ? 'Tutorials' : multiDeleteType === 'quiz' ? 'Quizzes' : 'Categories'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected {multiDeleteType}s? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                console.log('DEBUG: Multi-delete confirmed', { multiDeleteType });
                try {
                  if (multiDeleteType === 'tutorial') {
                    await handleTutorialBulkDelete();
                  } else if (multiDeleteType === 'quiz') {
                    await handleQuizBulkDelete();
                  } else if (multiDeleteType === 'category') {
                    await handleCategoryBulkDelete();
                  }

                  toast({
                    title: "Items Deleted",
                    description: `Selected ${multiDeleteType}s have been deleted successfully.`,
                  });

                  setIsMultiDeleteModalOpen(false);
                } catch (error) {
                  console.error('DEBUG: Multi-delete error:', error);
                  toast({
                    title: "Delete Failed",
                    description: `Failed to delete ${multiDeleteType}s. Please try again.`,
                    variant: "destructive",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {multiDeleteType === 'tutorial' ? 'Tutorials' : multiDeleteType === 'quiz' ? 'Quizzes' : 'Categories'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Multiple Delete Confirmation */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
      />

      {/* Content Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewType === 'tutorial' ? 'Tutorial Preview' :
                previewType === 'quiz' ? 'Quiz Preview' : 'Category Preview'}
            </DialogTitle>
            <DialogDescription>
              {previewType === 'tutorial' ? 'Preview tutorial details and content' :
                previewType === 'quiz' ? 'Preview quiz details and questions' :
                  'Preview category information'}
            </DialogDescription>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-6">
              {previewType === 'tutorial' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-12 bg-primary/10 rounded flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{(previewItem as TutorialSeries).title}</h3>
                      <p className="text-gray-600 mt-1">{(previewItem as TutorialSeries).description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Category</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).category}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Difficulty</div>
                      <DifficultyBadge difficulty={(previewItem as TutorialSeries).difficulty} />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Videos</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).totalVideos}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).totalDuration}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Status</div>
                      <StatusBadge status={(previewItem as TutorialSeries).status} />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Views</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).views}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Completions</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).completions}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Rating</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).rating}/5</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Created</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).createdDate}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Author</div>
                      <div className="font-medium">{(previewItem as TutorialSeries).author}</div>
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-12 bg-primary/10 rounded flex items-center justify-center">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{(previewItem as QuizSeries).title}</h3>
                      <p className="text-gray-600 mt-1">{(previewItem as QuizSeries).description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Category</div>
                      <div className="font-medium">{(previewItem as QuizSeries).category}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Difficulty</div>
                      <DifficultyBadge difficulty={(previewItem as QuizSeries).difficulty} />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Questions</div>
                      <div className="font-medium">{(previewItem as QuizSeries).totalQuestions}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Time Limit</div>
                      <div className="font-medium">{(previewItem as QuizSeries).timeLimit} min</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Status</div>
                      <StatusBadge status={(previewItem as QuizSeries).status} />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Attempts</div>
                      <div className="font-medium">{(previewItem as QuizSeries).attempts}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Avg Score</div>
                      <div className="font-medium">{(previewItem as QuizSeries).averageScore}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Passing Score</div>
                      <div className="font-medium">{(previewItem as QuizSeries).passingScore}%</div>
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'category' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-12 bg-primary/10 rounded flex items-center justify-center">
                      <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{(previewItem as Category).name}</h3>
                      <p className="text-gray-600 mt-1">{(previewItem as Category).description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Content Count</div>
                      <div className="font-medium">{(previewItem as Category).contentCount} items</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Status</div>
                      <StatusBadge status={(previewItem as Category).status} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;