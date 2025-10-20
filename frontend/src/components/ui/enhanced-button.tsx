
import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, loading = false, icon, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-200 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "disabled:hover:scale-100 disabled:cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </Button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };
export type { EnhancedButtonProps };
