
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  children?: React.ReactNode;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  children = "Back",
  className = ""
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-2 text-primary hover:bg-primary/10 border-primary/20 transition-all duration-200 hover:scale-105 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Button>
  );
};

export default BackButton;
