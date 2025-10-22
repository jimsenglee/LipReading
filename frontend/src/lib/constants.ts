// Image path constants
export const DEFAULT_AVATAR_PATH = "/uploads/profiles/avatar.jpg";
export const UPLOADS_BASE_PATH = "/uploads";

// API base URL - can be configured per environment
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com' 
  : 'http://127.0.0.1:5000';

// Frontend base URL for images (uses proxy in development)
export const FRONTEND_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-frontend.com' 
  : 'http://127.0.0.1:8080';

// Helper function to construct image URLs
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return DEFAULT_AVATAR_PATH;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with /uploads, return as is (relative path)
  if (imagePath.startsWith('/uploads')) {
    return imagePath;
  }
  
  // Otherwise, construct the full path
  return `${UPLOADS_BASE_PATH}/${imagePath}`;
};
