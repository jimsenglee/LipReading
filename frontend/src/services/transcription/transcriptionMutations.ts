import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// ============================================================================
// TRANSCRIPTION MUTATIONS
// ============================================================================

export const useUploadTranscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ videoFile, title }: { videoFile: File; title: string }) => 
      apiClient.uploadTranscription(videoFile, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
    },
  });
};

export const useDeleteTranscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTranscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
    },
  });
};

