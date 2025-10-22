import { useState } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  confirmText: string;
  cancelText: string;
  isLoading: boolean;
  onConfirm?: () => void;
}

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isLoading: false,
  });

  const confirm = (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        isLoading: false,
        onConfirm: () => {
          setState(prev => ({ ...prev, isLoading: true }));
          resolve(true);
        },
      });
    });
  };

  const close = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  return {
    ...state,
    confirm,
    close,
    setLoading,
  };
};