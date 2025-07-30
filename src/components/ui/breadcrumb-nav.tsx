
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from './button';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, showBackButton = true }) => {
  const location = useLocation();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="flex items-center gap-4 mb-6 animate-fade-in">
      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 text-primary hover:bg-primary/10 border-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href && index < items.length - 1 ? (
              <Link
                to={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ) : (
              <span className={index === items.length - 1 ? 'text-foreground font-medium' : ''}>
                {item.title}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default BreadcrumbNav;
