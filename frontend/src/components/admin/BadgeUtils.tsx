import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * Reusable Badge Utilities
 * 
 * This file contains utility functions for creating consistent badges
 * across different admin components (UserManagement, ContentManagement, etc.)
 * 
 * Usage Examples:
 * 
 * 1. Status Badges:
 * <StatusBadge status="published" />
 * <StatusBadge status="draft" />
 * <StatusBadge status="archived" />
 * 
 * 2. Difficulty Badges:
 * <DifficultyBadge difficulty="beginner" />
 * <DifficultyBadge difficulty="intermediate" />
 * <DifficultyBadge difficulty="advanced" />
 * 
 * 3. Role Badges:
 * <RoleBadge role="admin" />
 * <RoleBadge role="user" />
 * 
 * 4. Custom Badges:
 * <CustomBadge variant="success" text="Active" />
 * <CustomBadge variant="warning" text="Pending" />
 * <CustomBadge variant="error" text="Failed" />
 */

// Status badge component for content management
interface StatusBadgeProps {
  status: 'published' | 'draft' | 'archived' | 'active' | 'inactive';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const variants = {
    published: 'default',
    active: 'default',
    draft: 'secondary',
    archived: 'destructive',
    inactive: 'secondary'
  } as const;

  return (
    <Badge variant={variants[status] || 'default'}>
      {status}
    </Badge>
  );
};

// Difficulty badge component for content management
interface DifficultyBadgeProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const colors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Badge className={colors[difficulty] || 'bg-gray-100 text-gray-800 border-gray-200'}>
      {difficulty}
    </Badge>
  );
};

// Role badge component for user management
interface RoleBadgeProps {
  role: 'admin' | 'user';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const variants = {
    admin: 'default',
    user: 'secondary'
  } as const;

  return (
    <Badge variant={variants[role] || 'default'}>
      {role}
    </Badge>
  );
};

// Custom badge component for any other use cases
interface CustomBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  text: string;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({ variant, text }) => {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <Badge className={colors[variant] || colors.default}>
      {text}
    </Badge>
  );
};

/**
 * Future Extension Guide:
 * 
 * To add new badge types, follow this pattern:
 * 
 * 1. Create a new interface for the props:
 *    interface NewBadgeProps {
 *      type: 'type1' | 'type2' | 'type3';
 *    }
 * 
 * 2. Create the component with consistent styling:
 *    export const NewBadge: React.FC<NewBadgeProps> = ({ type }) => {
 *      const colors = {
 *        type1: 'bg-color-100 text-color-800 border-color-200',
 *        type2: 'bg-color-100 text-color-800 border-color-200',
 *        type3: 'bg-color-100 text-color-800 border-color-200'
 *      };
 *      
 *      return (
 *        <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
 *          {type}
 *        </Badge>
 *      );
 *    };
 * 
 * 3. Export it from this file and use it in your components
 * 
 * 4. Update this comment with the new badge type for documentation
 */
