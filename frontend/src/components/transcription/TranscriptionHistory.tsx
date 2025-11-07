import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useTranscriptions } from '@/services/transcription/transcriptionQueries';
import { useDeleteTranscription } from '@/services/transcription/transcriptionMutations';
import Pagination from '@/components/ui/pagination';
import { 
  Search,
  Eye,
  Trash2,
  FileVideo,
  Clock,
  Calendar,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

const TranscriptionHistory: React.FC = () => {
  const navigate = useNavigate();
  const feedbackToast = useFeedbackToast();
  
  // state for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'creation_date' | 'title'>('creation_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);

  // build query params - removed status filter as it's not useful for users
  const queryParams = useMemo(() => ({
    page: currentPage,
    per_page: perPage,
    search: searchTerm || undefined,
    sort_by: sortBy,
    sort_order: sortOrder
  }), [currentPage, perPage, searchTerm, sortBy, sortOrder]);

  // fetch transcriptions from backend
  const { data: transcriptionsData, isLoading, error, refetch } = useTranscriptions(queryParams);
  const deleteMutation = useDeleteTranscription();

  console.log('[DEBUG] Transcription history response:', transcriptionsData);
  console.log('[DEBUG] Loading state:', isLoading);
  console.log('[DEBUG] Error state:', error);

  // handle delete
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      feedbackToast.success('Success', 'Transcription deleted successfully');
      setDeleteDialogId(null);
      refetch();
    } catch (error: any) {
      feedbackToast.error('Error', error.message || 'Failed to delete transcription');
    }
  };

  // format duration - show proper format or empty state
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds === 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // format date - show proper format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // handle column header click for sorting (like admin panel)
  const handleSort = (column: 'creation_date' | 'title') => {
    if (sortBy === column) {
      // toggle sort order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // set new column and default to desc
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1); // reset to first page when sorting changes
  };

  // get sort icon for column header
  const getSortIcon = (column: 'creation_date' | 'title') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary" />
      : <ChevronDown className="h-4 w-4 text-primary" />;
  };

  // handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // reset to first page on search
  };

  const transcriptions = transcriptionsData?.data || [];
  const pagination = transcriptionsData?.pagination;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Transcription History
          </CardTitle>
          <CardDescription>
            View, search, and manage your past transcription sessions. Click column headers to sort.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar Only - No confusing dropdowns */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or content..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Table with Column-Header Sorting */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading transcriptions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">Error loading transcriptions</p>
                <p className="text-sm text-gray-600 mt-1">Please try again later</p>
                <Button onClick={() => refetch()} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">No transcriptions found</p>
                <p className="text-sm text-gray-600 mt-1">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Start creating transcriptions to see them here'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-primary/10 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center gap-2">
                          Title
                          {getSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead className="w-32">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Duration
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-primary/5 transition-colors w-48"
                        onClick={() => handleSort('creation_date')}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Created
                          {getSortIcon('creation_date')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transcriptions.map((transcription) => (
                      <TableRow 
                        key={transcription.id} 
                        className="hover:bg-primary/5 cursor-pointer"
                        onClick={() => navigate(`/transcription-result/${transcription.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {transcription.title || 'Untitled Transcription'}
                            </div>
                            {transcription.content_text && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {transcription.content_text.substring(0, 100)}
                                {transcription.content_text.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            {formatDuration(transcription.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            {formatDate(transcription.creation_date)}
                          </div>
                        </TableCell>
                        <TableCell 
                          className="text-right"
                          onClick={(e) => e.stopPropagation()} // prevent row click
                        >
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/transcription-result/${transcription.id}`)}
                              className="border-primary/20 text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteDialogId(transcription.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">Show</Label>
                    <Select 
                      value={perPage.toString()} 
                      onValueChange={(value) => {
                        setPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label className="text-sm font-medium text-gray-700">entries</Label>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total_count)} of{' '}
                      {pagination.total_count} entries
                    </span>
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.total_pages}
                      totalCount={pagination.total_count}
                      perPage={pagination.per_page}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogId !== null} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transcription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transcription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogId && handleDelete(deleteDialogId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TranscriptionHistory;
