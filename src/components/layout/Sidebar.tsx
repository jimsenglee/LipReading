
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Video, 
  BookOpen, 
  BarChart3, 
  Users, 
  Settings,
  FileText,
  Activity,
  TrendingUp,
  MessageSquare,
  Shield,
  UserCog,
  FolderKanban,
  PieChart,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Enhanced navigation with descriptions
  const userNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      description: 'Overview and quick access'
    },
    { 
      name: 'Transcription', 
      href: '/transcription', 
      icon: Video,
      description: 'Real-time & video transcription'
    },
    { 
      name: 'Education', 
      href: '/education', 
      icon: BookOpen,
      description: 'Learn lip-reading skills'
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: BarChart3,
      description: 'Progress tracking & analytics'
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: Settings,
      description: 'Account & accessibility settings'
    },
  ];

  const adminNavigation = [
    { 
      name: 'Admin Panel', 
      href: '/admin', 
      icon: Shield,
      description: 'Administrator dashboard'
    },
    { 
      name: 'Admin Dashboard', 
      href: '/admin/dashboard', 
      icon: Home,
      description: 'System overview & metrics'
    },
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: Users,
      description: 'Manage user accounts'
    },
    { 
      name: 'Content Management', 
      href: '/admin/content', 
      icon: FileText,
      description: 'Tutorials, quizzes & categories'
    },
    { 
      name: 'System Analytics', 
      href: '/admin/analytics', 
      icon: Activity,
      description: 'System performance metrics'
    },
    { 
      name: 'User Learning Analytics', 
      href: '/admin/user-analytics', 
      icon: TrendingUp,
      description: 'Learning performance insights'
    },
    { 
      name: 'Content & Feedback Analytics', 
      href: '/admin/content-analytics', 
      icon: MessageSquare,
      description: 'Content interaction analysis'
    },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : userNavigation;

  // Prevent body scroll when mobile sidebar is open and handle keyboard navigation
  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 z-50",
          "bg-background/95 backdrop-blur-md shadow-xl border-r border-border",
          "overflow-hidden"
        )}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { x: 0 },
          closed: { x: "-100%" }
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -10 }}
            transition={{ delay: isOpen ? 0.1 : 0, duration: 0.2 }}
          >
            <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {user?.role === 'admin' ? 'Admin Console' : 'Navigation'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role === 'admin' ? 'System Management' : 'Lip-Reading Platform'}
            </p>
          </motion.div>
          
          {/* Close button for mobile */}
          {isMobile && (
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <div className="space-y-1">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: isOpen ? 1 : 0, 
                    x: isOpen ? 0 : -10 
                  }}
                  transition={{ 
                    delay: isOpen ? index * 0.05 + 0.1 : 0,
                    duration: 0.2 
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={cn(
                      'group flex flex-col px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      'hover:scale-[1.02] hover:shadow-sm',
                      isActive
                        ? 'bg-gradient-to-r from-primary/15 to-secondary/15 text-primary shadow-sm border-l-3 border-primary'
                        : 'text-foreground hover:bg-primary/5 hover:text-primary hover:border-l-3 hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 h-5 w-5 transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                          )}
                        />
                      </motion.div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className={cn(
                      'text-xs mt-1 ml-8 transition-colors',
                      isActive ? 'text-primary/70' : 'text-muted-foreground group-hover:text-primary/70'
                    )}>
                      {item.description}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* User Info Footer */}
        <motion.div 
          className="p-3 border-t border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 }}
          transition={{ delay: isOpen ? 0.2 : 0, duration: 0.2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role} Account
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Sidebar;
