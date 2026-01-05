import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = "Error" }: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{errorMessage}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}








