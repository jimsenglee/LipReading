
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface AnimatedBreadcrumbProps {
  items: BreadcrumbItem[];
}

const AnimatedBreadcrumb: React.FC<AnimatedBreadcrumbProps> = ({ items }) => {
  return (
    <motion.nav 
      className="flex items-center space-x-1 text-sm text-muted-foreground mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="hover:text-primary transition-colors duration-200 hover:underline"
            >
              {item.title}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-primary font-medium' : ''}>
              {item.title}
            </span>
          )}
        </motion.div>
      ))}
    </motion.nav>
  );
};

export default AnimatedBreadcrumb;
