
import React from 'react';
import { Video } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="text-center animate-fade-in">
        <div className="relative mb-8">
          <Video className="h-16 w-16 text-primary mx-auto animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-primary mb-2">LipRead AI</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
