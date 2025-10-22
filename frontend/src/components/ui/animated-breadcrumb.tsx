import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  title: string;
  href?: string;
  isActive?: boolean;
}

interface AnimatedBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const AnimatedBreadcrumb: React.FC<AnimatedBreadcrumbProps> = ({
  items,
  className,
}) => {
  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm',
        className
      )}
    >
      <Home className="h-4 w-4 text-muted-foreground" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href && !item.isActive ? (
            <a
              href={item.href}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {item.title}
            </a>
          ) : (
            <span
              className={cn(
                'text-primary font-medium',
                item.isActive && 'text-primary font-medium'
              )}
            >
              {item.title}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default AnimatedBreadcrumb;
