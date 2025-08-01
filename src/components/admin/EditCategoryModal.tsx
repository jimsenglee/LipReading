import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  contentCount: number;
  status: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (updatedCategory: Category) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSave
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    icon: 'tag',
    color: 'blue',
    displayOrder: 1
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const iconOptions = [
    { value: 'tag', label: 'Tag', icon: '🏷️' },
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'sound', label: 'Sound', icon: '🔊' },
    { value: 'speech', label: 'Speech', icon: '💬' },
    { value: 'practice', label: 'Practice', icon: '🎯' },
    { value: 'advanced', label: 'Advanced', icon: '⚡' },
    { value: 'beginner', label: 'Beginner', icon: '🌱' }
  ];

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  ];

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
        icon: category.icon || 'tag',
        color: category.color || 'blue',
        displayOrder: category.displayOrder || 1
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !category) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedCategory: Category = {
        ...category,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        icon: formData.icon,
        color: formData.color,
        displayOrder: formData.displayOrder
      };
      
      onSave(updatedCategory);
      
      toast({
        title: "Category Updated",
        description: `${formData.name} has been updated successfully.`
      });
      
      onClose();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedColor = colorOptions.find(color => color.value === formData.color);
  const selectedIcon = iconOptions.find(icon => icon.value === formData.icon);

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category information and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Warning */}
          {category.contentCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Content Associated</p>
                  <p className="text-orange-600">
                    This category has {category.contentCount} content items. 
                    Changes may affect existing content organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={errors.description ? 'border-red-300' : ''}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <Select 
                value={formData.icon} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{selectedIcon?.icon}</span>
                      <span>{selectedIcon?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <span>{icon.icon}</span>
                        <span>{icon.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category Color</Label>
              <Select 
                value={formData.color} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${selectedColor?.class.split(' ')[0]} border`}></div>
                      <span>{selectedColor?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.class.split(' ')[0]} border`}></div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">Display Order</Label>
              <Input
                id="edit-displayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  displayOrder: parseInt(e.target.value) || 1 
                }))}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedIcon?.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{formData.name}</h3>
                  <p className="text-sm text-gray-600">{formData.description}</p>
                </div>
                <Badge className={selectedColor?.class || 'bg-blue-100 text-blue-800 border-blue-200'}>
                  {formData.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
