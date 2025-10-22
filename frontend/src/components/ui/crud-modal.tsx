import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
  saveLabel?: string;
  deleteLabel?: string;
}

export const CrudModal: React.FC<CrudModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onDelete,
  saveLabel = 'Save',
  deleteLabel = 'Delete',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        <DialogFooter>
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              {deleteLabel}
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave}>
              {saveLabel}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CrudModal;
