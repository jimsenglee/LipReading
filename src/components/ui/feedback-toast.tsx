
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useFeedbackToast = () => {
  const { toast } = useToast();

  const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    duration: number = 4000
  ) => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-600" />,
      error: <AlertCircle className="h-5 w-5 text-red-600" />,
      info: <Info className="h-5 w-5 text-blue-600" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    };

    const colors = {
      success: 'border-green-200 bg-green-50',
      error: 'border-red-200 bg-red-50',
      info: 'border-blue-200 bg-blue-50',
      warning: 'border-yellow-200 bg-yellow-50',
    };

    toast({
      title: title,
      description: (
        <div className="flex items-center gap-2">
          {icons[type]}
          <span>{description}</span>
        </div>
      ),
      duration,
      className: `${colors[type]} border-l-4`,
    });
  };

  return {
    success: (title: string, description?: string) => showToast('success', title, description),
    error: (title: string, description?: string) => showToast('error', title, description),
    info: (title: string, description?: string) => showToast('info', title, description),
    warning: (title: string, description?: string) => showToast('warning', title, description),
  };
};
