
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, closeSidebar, isMobile } = useSidebar();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <Navbar 
        onToggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex pt-16 min-h-screen">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar} 
          isMobile={isMobile}
        />
        
        {/* Main Content - Flexible layout without forced positioning */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out overflow-y-auto",
          // Clean margin transition without complex calculations
          sidebarOpen && !isMobile ? "ml-72" : "ml-0"
        )}>
          <div className="p-6 min-h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-none"
            >
              {children}
            </motion.div>
          </div>
        </main>
        
        {/* Mobile backdrop overlay */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardLayout;
