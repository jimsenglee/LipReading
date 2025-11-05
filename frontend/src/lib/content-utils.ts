// ============================================================================
// SHARED CONTENT UTILITIES
// ============================================================================

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdDate: string;
}

export interface ContentParams {
  page: number;
  per_page: number;
  search?: string;
  category?: string;
  status?: 'all' | 'active' | 'inactive';
  sort_by: 'title' | 'category' | 'created_at' | 'updated_at';
  sort_order: 'asc' | 'desc';
}

// ============================================================================
// DATA MAPPING UTILITIES
// ============================================================================

export const mapTutorialData = (tutorial: any, index: number): ContentItem => {
  const tutorialId = tutorial.id?.toString() || `tutorial-${index}`;
  return {
    id: tutorialId,
    title: tutorial.title || 'Untitled Tutorial',
    description: tutorial.description || '',
    category: tutorial.category?.category_name || tutorial.category_name || 'General',
    status: tutorial.status || 'published',
    createdDate: tutorial.created_at ? new Date(tutorial.created_at).toISOString().split('T')[0] : (tutorial.createdDate || new Date().toISOString().split('T')[0])
  };
};

export const mapQuizData = (quiz: any, index: number): ContentItem => {
  const quizId = quiz.id?.toString() || `quiz-${index}`;
  return {
    id: quizId,
    title: quiz.title || 'Untitled Quiz',
    description: quiz.description || quiz.short_description || '',
    category: quiz.category?.category_name || quiz.category_name || 'General',
    status: quiz.status || 'published',
    createdDate: quiz.created_at ? new Date(quiz.created_at).toISOString().split('T')[0] : (quiz.createdDate || new Date().toISOString().split('T')[0])
  };
};

export const mapCategoryData = (category: any, index: number): ContentItem => {
  const categoryId = category.id?.toString() || `category-${index}`;
  return {
    id: categoryId,
    title: category.category_name || category.name || 'Untitled Category',
    description: category.description || '',
    category: 'General',
    status: category.status || 'active',
    createdDate: category.created_at ? new Date(category.created_at).toISOString().split('T')[0] : (category.createdDate || new Date().toISOString().split('T')[0])
  };
};

// ============================================================================
// PARAMETER BUILDING UTILITIES
// ============================================================================

export const buildContentParams = (
  page: number,
  per_page: number,
  search: string,
  category: string,
  status: string,
  sort_by: string,
  sort_order: 'asc' | 'desc'
): ContentParams => ({
  page,
  per_page,
  search: search || undefined,
  category: category !== 'all' ? category : undefined,
  status: status !== 'all' ? (status as 'active' | 'inactive') : undefined,
  sort_by: sort_by as 'title' | 'category' | 'created_at' | 'updated_at',
  sort_order
});

// ============================================================================
// TABLE CONFIGURATION UTILITIES
// ============================================================================

export const getTableConfig = (type: 'tutorial' | 'quiz' | 'category') => {
  const configs = {
    tutorial: {
      title: 'Tutorial Series',
      description: 'tutorials',
      icon: 'BookOpen',
      emptyTitle: 'No Tutorials Yet',
      emptyDescription: 'Get started by creating your first tutorial.',
      searchPlaceholder: 'Search tutorials...',
      filterLabel: 'Category:',
      filterOptions: [
        { value: 'all', label: 'All Categories' },
        { value: 'general', label: 'General' },
        { value: 'advanced', label: 'Advanced' }
      ]
    },
    quiz: {
      title: 'Quiz Series',
      description: 'quizzes',
      icon: 'Brain',
      emptyTitle: 'No Quizzes Yet',
      emptyDescription: 'Get started by creating your first quiz.',
      searchPlaceholder: 'Search quizzes...',
      filterLabel: 'Category:',
      filterOptions: [
        { value: 'all', label: 'All Categories' },
        { value: 'general', label: 'General' },
        { value: 'advanced', label: 'Advanced' }
      ]
    },
    category: {
      title: 'Categories',
      description: 'categories',
      icon: 'Tag',
      emptyTitle: 'No Categories Yet',
      emptyDescription: 'Get started by creating your first category.',
      searchPlaceholder: 'Search categories...',
      filterLabel: 'Status:',
      filterOptions: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  };

  return configs[type];
};
