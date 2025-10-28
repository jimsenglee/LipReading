/**
 * shared styling utilities for education components
 * ensures consistent design across all education components
 */

// consistent difficulty color mapping
export const getDifficultyColor = (level: string) => {
  const normalizedLevel = level.toLowerCase();
  switch (normalizedLevel) {
    case 'beginner':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: 'text-green-600'
      };
    case 'intermediate':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: 'text-yellow-600'
      };
    case 'advanced':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: 'text-red-600'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        icon: 'text-gray-600'
      };
  }
};

// consistent card styling classes
export const cardStyles = {
  container: 'group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300',
  header: 'p-4 pb-2',
  content: 'p-4 pt-2',
  footer: 'p-4 pt-2 border-t border-gray-100',
  thumbnail: 'aspect-video w-full rounded-md bg-gray-100 object-cover',
  title: 'text-lg font-semibold text-gray-900 line-clamp-2',
  description: 'text-sm text-gray-600 line-clamp-2',
  meta: 'flex items-center gap-2 text-xs text-gray-500',
  badge: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  button: 'w-full rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
};

// consistent progress styling
export const progressStyles = {
  container: 'space-y-2',
  bar: 'h-2 rounded-full bg-gray-200',
  fill: 'h-2 rounded-full bg-blue-600 transition-all duration-300',
  text: 'text-xs text-gray-600',
  percentage: 'text-sm font-medium text-gray-900'
};

// consistent rating styling
export const ratingStyles = {
  container: 'flex items-center gap-1',
  star: 'h-4 w-4',
  filled: 'text-yellow-400',
  empty: 'text-gray-300',
  text: 'text-sm text-gray-600'
};

// consistent animation variants
export const animationVariants = {
  cardHover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  cardTap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  fadeIn: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
  fadeOut: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  }
};
