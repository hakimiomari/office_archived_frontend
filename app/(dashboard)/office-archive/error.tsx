"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[400px]">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <h2 className="text-xl font-semibold">Something went wrong!</h2>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || "An unexpected error occurred while loading the archive."}
      </p>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
