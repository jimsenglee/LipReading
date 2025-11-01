import { useQuery } from '@tanstack/react-query';
import apiClient, { ApiTranscription } from '@/lib/api';

// ============================================================================
// TRANSCRIPTION INTERFACES
// ============================================================================

export interface TranscriptionParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  sort_by?: 'creation_date' | 'title' | 'processed_at';
  sort_order?: 'asc' | 'desc';
}

export interface TranscriptionResponse {
  success: boolean;
  data: ApiTranscription[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================================================
// TRANSCRIPTION QUERIES
// ============================================================================

export const useTranscriptions = (params: TranscriptionParams = {}) => {
  return useQuery({
    queryKey: ['transcriptions', params],
    queryFn: async (): Promise<TranscriptionResponse> => {
      return apiClient.getTranscriptions(params);
    },
  });
};

export const useTranscriptionById = (id: number) => {
  return useQuery({
    queryKey: ['transcription', id],
    queryFn: async () => {
      const response = await apiClient.getTranscription(id);
      return response.data;
    },
    enabled: !!id,
  });
};

