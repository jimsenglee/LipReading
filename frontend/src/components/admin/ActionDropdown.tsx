import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Download } from 'lucide-react';

// Generic action item interface
export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
}

// Props for the reusable dropdown component
interface ActionDropdownProps {
  // Primary button configuration
  primaryButton: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  };
  
  // Dropdown items
  items: ActionItem[];
  
  // Optional separator after specific item index
  separatorAfter?: number;
  
  // Button styling
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * Reusable Action Dropdown Component
 * 
 * This component can be used for:
 * - Create actions (Tutorial, Quiz, Category)
 * - Export actions (CSV, Excel, PDF)
 * - Any other grouped actions
 * 
 * Usage Examples:
 * 
 * 1. Create Actions:
 * <ActionDropdown
 *   primaryButton={{ label: "Create New", icon: <Plus /> }}
 *   items={[
 *     { key: "tutorial", label: "Tutorial Series", icon: <BookOpen />, onClick: () => navigate('/create-tutorial') },
 *     { key: "quiz", label: "Quiz Series", icon: <Brain />, onClick: () => navigate('/create-quiz') },
 *     { key: "category", label: "Category", icon: <Tag />, onClick: () => navigate('/create-category') }
 *   ]}
 * />
 * 
 * 2. Export Actions:
 * <ActionDropdown
 *   primaryButton={{ label: "Export", icon: <Download /> }}
 *   items={[
 *     { key: "csv", label: "Export as CSV", onClick: () => handleExport('csv') },
 *     { key: "excel", label: "Export as Excel", onClick: () => handleExport('excel') },
 *     { key: "pdf", label: "Export as PDF", onClick: () => handleExport('pdf') }
 *   ]}
 * />
 * 
 * 3. Mixed Actions (with separator):
 * <ActionDropdown
 *   primaryButton={{ label: "Actions" }}
 *   items={[
 *     { key: "create", label: "Create New", onClick: handleCreate },
 *     { key: "import", label: "Import Data", onClick: handleImport }
 *   ]}
 *   separatorAfter={1}
 *   items={[
 *     { key: "export", label: "Export All", onClick: handleExport },
 *     { key: "archive", label: "Archive", onClick: handleArchive, variant: 'destructive' }
 *   ]}
 * />
 */
const ActionDropdown: React.FC<ActionDropdownProps> = ({
  primaryButton,
  items,
  separatorAfter,
  variant = 'default',
  size = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrimaryClick = () => {
    // Always show dropdown on click, don't execute primary action
    setIsOpen(!isOpen);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 ${className}`}
          onClick={handlePrimaryClick}
        >
          {primaryButton.icon}
          {primaryButton.label}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {items.map((item, index) => (
          <React.Fragment key={item.key}>
            <DropdownMenuItem
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={`flex items-center gap-2 ${
                item.variant === 'destructive' 
                  ? 'text-red-600 focus:text-red-600 focus:bg-red-50' 
                  : ''
              }`}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
            {separatorAfter === index && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionDropdown;
