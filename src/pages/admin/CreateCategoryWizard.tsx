import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { 
  ArrowLeft, 
  Check, 
  Save,
  AlertCircle,
  Tag,
  FolderPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive';
  displayOrder: number;
}

const CreateCategoryWizard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [categoryData, setCategoryData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: 'tag',
    color: 'blue',
    status: 'active',
    displayOrder: 1
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const breadcrumbItems = [
    { title: 'Admin Dashboard', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: 'Create Category' }
  ];

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

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!categoryData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!categoryData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalCategory = {
        ...categoryData,
        status: publishNow ? 'active' : 'inactive'
      };
      
      toast({
        title: publishNow ? "Category Created & Activated!" : "Category Created!",
        description: publishNow 
          ? "Your category is now active and available for content."
          : "Your category has been created as inactive."
      });
      
      // Navigate back to content management
      navigate('/admin/content');
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/content');
  };

  const selectedColor = colorOptions.find(color => color.value === categoryData.color);
  const selectedIcon = iconOptions.find(icon => icon.value === categoryData.icon);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <FolderPlus className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Category</h1>
        <p className="text-gray-600 mt-2">Add a new category to organize your content</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Configure the basic information and appearance for your new category
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Vowel Sounds, Advanced Techniques"
                value={categoryData.name}
                onChange={(e) => setCategoryData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what type of content belongs in this category"
                value={categoryData.description}
                onChange={(e) => setCategoryData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={errors.description ? 'border-red-300' : ''}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <Select 
                value={categoryData.icon} 
                onValueChange={(value) => setCategoryData(prev => ({ ...prev, icon: value }))}
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
                value={categoryData.color} 
                onValueChange={(value) => setCategoryData(prev => ({ ...prev, color: value }))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select 
                value={categoryData.status} 
                onValueChange={(value: 'active' | 'inactive') => 
                  setCategoryData(prev => ({ ...prev, status: value }))
                }
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
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min="1"
                value={categoryData.displayOrder}
                onChange={(e) => setCategoryData(prev => ({ 
                  ...prev, 
                  displayOrder: parseInt(e.target.value) || 1 
                }))}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedIcon?.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{categoryData.name || 'Category Name'}</h3>
                  <p className="text-sm text-gray-600">{categoryData.description || 'Category description will appear here'}</p>
                </div>
                <Badge className={selectedColor?.class || 'bg-blue-100 text-blue-800 border-blue-200'}>
                  {categoryData.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Category Guidelines</h3>
                <div className="text-sm text-blue-600 mt-1 space-y-1">
                  <p>• Categories help organize content for easier navigation</p>
                  <p>• Choose descriptive names that clearly indicate the content type</p>
                  <p>• Inactive categories won't appear in content creation forms</p>
                  <p>• Display order determines how categories appear in lists</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            Create Inactive
          </Button>
          <Button 
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create & Activate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryWizard;
