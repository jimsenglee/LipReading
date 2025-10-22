import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ToastDemo = () => {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "This is a success message with green styling and countdown bar.",
      variant: "success",
      duration: 3000,
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Error!",
      description: "This is an error message with red styling and countdown bar.",
      variant: "destructive",
      duration: 4000,
    });
  };

  const showWarningToast = () => {
    toast({
      title: "Warning!",
      description: "This is a warning message with yellow styling and countdown bar.",
      variant: "warning",
      duration: 5000,
    });
  };

  const showInfoToast = () => {
    toast({
      title: "Info!",
      description: "This is an info message with blue styling and countdown bar.",
      variant: "info",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary text-center">
            Toast Demo
          </CardTitle>
          <CardDescription className="text-center">
            Test the enhanced toast notifications with countdown bars and icons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={showSuccessToast}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Show Success Toast (3s)
          </Button>
          
          <Button 
            onClick={showErrorToast}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Show Error Toast (4s)
          </Button>
          
          <Button 
            onClick={showWarningToast}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Show Warning Toast (5s)
          </Button>
          
          <Button 
            onClick={showInfoToast}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Show Info Toast (3s)
          </Button>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Features:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Color-coded backgrounds and borders</li>
              <li>• Relevant icons for each type</li>
              <li>• Animated countdown bars</li>
              <li>• Customizable duration</li>
              <li>• Smooth animations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToastDemo;
