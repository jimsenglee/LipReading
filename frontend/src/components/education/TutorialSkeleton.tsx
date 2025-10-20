import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TutorialCardSkeletonProps {
  className?: string;
}

const TutorialCardSkeleton: React.FC<TutorialCardSkeletonProps> = ({ className = "" }) => {
  return (
    <Card className={`h-full border-primary/20 ${className}`}>
      <div className="relative">
        {/* Thumbnail skeleton */}
        <Skeleton className="w-full h-48 rounded-t-lg" />
        
        {/* Duration badge skeleton */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        
        {/* Bookmark button skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      <CardHeader className="p-4">
        {/* Difficulty badge and rating skeleton */}
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        
        {/* Title skeleton */}
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        {/* Description skeleton */}
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Instructor and students skeleton */}
        <div className="flex items-center justify-between text-sm mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1 mb-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        {/* Action button skeleton */}
        <Skeleton className="h-10 w-full rounded" />
      </CardContent>
    </Card>
  );
};

interface TutorialGridSkeletonProps {
  count?: number;
  className?: string;
}

const TutorialGridSkeleton: React.FC<TutorialGridSkeletonProps> = ({ 
  count = 6, 
  className = "" 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <TutorialCardSkeleton key={index} />
      ))}
    </div>
  );
};

export { TutorialCardSkeleton, TutorialGridSkeleton };
