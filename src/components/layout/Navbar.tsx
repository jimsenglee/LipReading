
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Video, Menu, X } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-primary/10 fixed top-0 left-0 right-0 z-50">
      {/* Full width container - stick to walls */}
      <div className="flex justify-between items-center h-16 px-4">
        {/* Left side - Burger + Logo moved to far left */}
        <div className="flex items-center space-x-3">
          {/* Enhanced Hamburger Menu Button */}
          <motion.button
            onClick={onToggleSidebar}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30",
              "border border-transparent",
              sidebarOpen 
                ? 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 border-red-200/50 shadow-lg shadow-red-100/50' 
                : 'bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 text-gray-700 hover:text-primary border-primary/10 shadow-lg shadow-primary/5'
            )}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            {/* Brand Logo - closer to burger button */}
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <Video className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.span 
                className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                LipRead AI
              </motion.span>
            </Link>
        </div>

        {/* Right side - User menu moved to far right */}
        <div className="flex items-center space-x-4">
            {user ? (
              <>
                <motion.span 
                  className="text-sm text-gray-700 hidden sm:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome, {user.name}
                </motion.span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:scale-110 transition-transform">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border-primary/20" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:bg-primary/10">
                      <User className="mr-2 h-4 w-4 text-primary" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="hover:bg-primary/10">
                      <Settings className="mr-2 h-4 w-4 text-primary" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="hover:bg-primary/10 hover:text-primary">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-primary hover:bg-primary/90">
                  Sign Up
                </Button>
              </div>
            )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
