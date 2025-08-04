import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "กำลังโหลด..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[200px] space-y-4",
      className
    )}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Page-specific loading components
export function PageLoadingSpinner({ pageName }: { pageName: string }) {
  return (
    <LoadingSpinner 
      size="lg"
      text={`กำลังโหลด${pageName}...`}
      className="min-h-[400px]"
    />
  );
}