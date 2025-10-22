import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlashMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  onClose?: () => void;
  className?: string;
}

const FlashMessage: React.FC<FlashMessageProps> = ({
  type,
  message,
  field,
  onClose,
  className
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 border rounded-lg animate-fade-in',
        colors[type],
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[type])} />
      <div className="flex-1 min-w-0">
        {field && field !== 'general' && (
          <div className="text-sm font-medium mb-1 capitalize">
            {field.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        )}
        <div className="text-sm">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default FlashMessage;
