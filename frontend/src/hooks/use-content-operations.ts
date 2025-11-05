import { useToast } from '@/hooks/use-toast';
import { useConfirmation } from '@/hooks/use-confirmation';
import { useNavigate } from 'react-router-dom';
import { 
  useDeleteTutorial,
  useDeleteQuiz,
  useDeleteCategory
} from '@/services';
import { exportToCSV } from '@/lib/export-utils';

// ============================================================================
// SHARED CONTENT OPERATIONS
// ============================================================================

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdDate: string;
}

export interface ContentOperations {
  handleExport: (items: ContentItem[], type: 'tutorials' | 'quizzes' | 'categories') => void;
  handleBulkDelete: (
    selectedItems: Set<string>,
    type: 'tutorial' | 'quiz' | 'category',
    onSuccess: () => void
  ) => Promise<void>;
  handleCreate: (type: 'tutorial' | 'quiz' | 'category' | 'practice-word') => void;
}

export const useContentOperations = (): ContentOperations => {
  const { toast } = useToast();
  const confirmation = useConfirmation();
  const navigate = useNavigate();
  
  const deleteTutorialMutation = useDeleteTutorial();
  const deleteQuizMutation = useDeleteQuiz();
  const deleteCategoryMutation = useDeleteCategory();

  const handleExport = (items: ContentItem[], type: 'tutorials' | 'quizzes' | 'categories') => {
    if (items.length === 0) {
      toast({
        title: "No Data to Export",
        description: `There are no ${type} to export.`,
        variant: "destructive",
      });
      return;
    }

    let headers: string[];
    let data: any[][];
    let filename: string;

    switch (type) {
      case 'tutorials':
        headers = ['Title', 'Description', 'Category', 'Status', 'Created'];
        data = items.map(item => [
          item.title,
          item.description,
          item.category,
          item.status,
          item.createdDate
        ]);
        filename = 'tutorials';
        break;
      case 'quizzes':
        headers = ['Title', 'Description', 'Category', 'Status', 'Created'];
        data = items.map(item => [
          item.title,
          item.description,
          item.category,
          item.status,
          item.createdDate
        ]);
        filename = 'quizzes';
        break;
      case 'categories':
        headers = ['Name', 'Description', 'Status'];
        data = items.map(item => [
          item.title, // For categories, title is the name
          item.description,
          item.status
        ]);
        filename = 'categories';
        break;
      default:
        return;
    }

    const exportData = { headers, data, filename };
    exportToCSV(exportData);
    
    toast({
      title: "Export Successful",
      description: `${type} data has been exported to CSV.`,
    });
  };

  const handleBulkDelete = async (
    selectedItems: Set<string>,
    type: 'tutorial' | 'quiz' | 'category',
    onSuccess: () => void
  ) => {
    if (selectedItems.size === 0) {
      toast({
        title: `No ${type}s Selected`,
        description: `Please select ${type}s to delete.`,
        variant: "destructive",
      });
      return;
    }

    try {
      for (const itemId of selectedItems) {
        switch (type) {
          case 'tutorial':
            await deleteTutorialMutation.mutateAsync(parseInt(itemId));
            break;
          case 'quiz':
            await deleteQuizMutation.mutateAsync(parseInt(itemId));
            break;
          case 'category':
            await deleteCategoryMutation.mutateAsync(parseInt(itemId));
            break;
        }
      }
      
      toast({
        title: `${type === 'tutorial' ? 'Tutorials' : type === 'quiz' ? 'Quizzes' : 'Categories'} Deleted`,
        description: `${selectedItems.size} ${type}(s) have been deleted successfully.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Delete Failed",
        description: `Some ${type}s could not be deleted. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleCreate = (type: 'tutorial' | 'quiz' | 'category' | 'practice-word') => {
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
      case 'practice-word':
        navigate('/admin/content/create-practice-word');
        break;
    }
  };

  return {
    handleExport,
    handleBulkDelete,
    handleCreate
  };
};

