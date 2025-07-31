import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface UseSidebarReturn {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isMobile: boolean;
}

export const useSidebar = (): UseSidebarReturn => {
  const location = useLocation();
  
  // Persistent sidebar state with localStorage - default open for desktop experience
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true; // Default open for better desktop UX
  });
  
  const [isMobile, setIsMobile] = useState(false);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Mobile detection - keep this minimal since we're focusing on desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Standard mobile breakpoint
    };
    
    checkMobile();
    
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prevState => !prevState);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    isMobile
  };
};

export default useSidebar;
