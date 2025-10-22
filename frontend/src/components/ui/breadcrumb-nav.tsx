import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  // prefer title to match usage across app; keep label for backward compat
  title?: string;
  label?: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  className,
}) => {
  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm text-muted-foreground',
        className
      )}
    >
      <Home className="h-4 w-4" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.isActive ? (
            <a
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title ?? item.label}
            </a>
          ) : (
            <span
              className={cn(
                item.isActive && 'text-foreground font-medium'
              )}
            >
              {item.title ?? item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;
