
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";

interface InputWithValidationProps extends React.ComponentProps<"input"> {
  label: string;
  id: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
}

const InputWithValidation = React.forwardRef<HTMLInputElement, InputWithValidationProps>(
  ({ className, label, id, error, success, helperText, required, ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = !!success && !error;

    return (
      <div className="space-y-2 animate-fade-in">
        <Label 
          htmlFor={id} 
          className={cn(
            "text-sm font-medium transition-colors",
            hasError ? "text-red-600" : "text-gray-700",
            required && "after:content-['*'] after:text-red-500 after:ml-1"
          )}
        >
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            className={cn(
              "transition-all duration-200 focus:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-1",
              hasError && "border-red-300 focus:border-red-500 focus:ring-red-500",
              hasSuccess && "border-green-300 focus:border-green-500 focus:ring-green-500",
              className
            )}
            {...props}
          />
          {(hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>
        {(error || success || helperText) && (
          <div className="flex items-start gap-1 animate-fade-in">
            {error && (
              <>
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </>
            )}
            {success && !error && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-600">{success}</p>
              </>
            )}
            {helperText && !error && !success && (
              <p className="text-sm text-gray-500 ml-5">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

InputWithValidation.displayName = "InputWithValidation";

export { InputWithValidation };
export type { InputWithValidationProps };
