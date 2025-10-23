import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

// step definition interface
export interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
}

// step wizard props interface
export interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

const StepWizard: React.FC<StepWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onFinish,
  isLoading = false,
  title,
  description,
  className = ""
}) => {
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStepData?.isValid !== false;

  // get step status
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  // get step badge variant
  const getStepBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'current':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* header */}
      {(title || description) && (
        <div className="text-center">
          {title && (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-gray-600 mt-2">{description}</p>
          )}
        </div>
      )}

      {/* step indicator */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = index <= currentStep || steps[index - 1]?.isValid !== false;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* step circle */}
                  <div className="flex items-center">
                    <button
                      onClick={() => isClickable && onStepChange(index)}
                      disabled={!isClickable}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                        status === 'completed'
                          ? 'bg-primary border-primary text-white'
                          : status === 'current'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-gray-300 text-gray-400'
                      } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}
                    >
                      {status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </button>
                    
                    {/* step info */}
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${
                          status === 'current' ? 'text-primary' : 
                          status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h3>
                        {step.isOptional && (
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs ${
                        status === 'current' ? 'text-primary/70' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* connector line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-primary' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* current step content */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary">
                Step {currentStep + 1}: {currentStepData?.title}
              </CardTitle>
              <CardDescription>
                {currentStepData?.description}
              </CardDescription>
            </div>
            <Badge variant={getStepBadgeVariant(getStepStatus(currentStep))}>
              {getStepStatus(currentStep)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStepData?.component}
        </CardContent>
      </Card>

      {/* navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isLoading}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {isLastStep ? (
          <Button
            onClick={onFinish}
            disabled={!canProceed || isLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Finishing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Finish
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepWizard;
