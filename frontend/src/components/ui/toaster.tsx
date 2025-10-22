import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastCountdownBar,
} from "@/components/ui/toast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  const getIcon = (variant?: string) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      default:
        return null
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration = 3000, variant, ...props }) {
        return (
          <Toast key={id} duration={duration} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {getIcon(variant)}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </div>
            <ToastCountdownBar 
              duration={duration} 
              variant={variant} 
              onComplete={() => dismiss(id)}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
