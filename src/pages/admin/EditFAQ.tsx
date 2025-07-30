
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import BreadcrumbNav from '@/components/ui/breadcrumb-nav';
import { Save, Trash2 } from 'lucide-react';

const EditFAQ = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock FAQ data - replace with actual data fetching
  const [faq, setFaq] = useState({
    id: id,
    question: 'How do I improve transcription accuracy?',
    answer: 'Ensure good lighting, speak clearly, and position yourself directly facing the camera.',
    category: 'General',
    status: 'published'
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    navigate('/admin/content');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      navigate('/admin/content');
    }
  };

  const breadcrumbItems = [
    { title: 'Admin', href: '/admin' },
    { title: 'Content Management', href: '/admin/content' },
    { title: id ? 'Edit FAQ' : 'Add FAQ' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbNav items={breadcrumbItems} />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {id ? 'Edit FAQ' : 'Add New FAQ'}
        </h1>
        <p className="text-gray-600 mt-1">
          {id ? 'Update frequently asked question' : 'Create a new frequently asked question'}
        </p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">FAQ Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Question</label>
            <Input
              value={faq.question}
              onChange={(e) => setFaq({ ...faq, question: e.target.value })}
              placeholder="Enter the question"
              className="border-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Answer</label>
            <Textarea
              value={faq.answer}
              onChange={(e) => setFaq({ ...faq, answer: e.target.value })}
              placeholder="Provide a detailed answer"
              rows={4}
              className="border-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Category</label>
              <select 
                value={faq.category}
                onChange={(e) => setFaq({ ...faq, category: e.target.value })}
                className="w-full p-2 border border-primary/20 rounded-md focus:ring-2 focus:ring-primary/20"
              >
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Account">Account</option>
                <option value="Billing">Billing</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Status</label>
              <select 
                value={faq.status}
                onChange={(e) => setFaq({ ...faq, status: e.target.value })}
                className="w-full p-2 border border-primary/20 rounded-md focus:ring-2 focus:ring-primary/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <Badge className={faq.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {faq.status}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {id && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save FAQ"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditFAQ;
