
import React from 'react';
import { cn } from '@/lib/utils';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  className?: string;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  className,
  role,
  ariaLabel,
  ariaDescribedBy,
  tabIndex,
  onKeyDown,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter and Space as click for interactive elements
    if ((e.key === 'Enter' || e.key === ' ') && onKeyDown) {
      e.preventDefault();
      onKeyDown(e);
    }
  };

  return (
    <div
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

export { AccessibilityWrapper };
