
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  deleteLabel?: string;
  isLoading?: boolean;
}

const CrudModal: React.FC<CrudModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSave,
  onDelete,
  saveLabel = "Save",
  deleteLabel = "Delete",
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] animate-scale-in">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-primary">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              {deleteLabel}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {onSave && (
            <Button 
              onClick={onSave} 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Saving..." : saveLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CrudModal;
