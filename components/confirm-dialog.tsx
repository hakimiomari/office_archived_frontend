"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { dir } = useLocale();
  const tCommon = useTranslations("common");

  const finalTitle = title ?? tCommon("confirm");
  const finalDescription = description ?? "";
  const finalConfirmLabel = confirmLabel ?? tCommon("delete");
  const finalCancelLabel = cancelLabel ?? tCommon("cancel");

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onOpenChange(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in-0"
        onClick={() => !loading && onOpenChange(false)}
      />

      {/* Dialog box */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        dir={dir}
        className="relative z-[101] w-full max-w-md rounded-lg border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        {/* Close button */}
        <button
          onClick={() => !loading && onOpenChange(false)}
          className={cn(
            "absolute top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100",
            dir === "rtl" ? "left-4" : "right-4"
          )}
        >
          <IconX className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          {variant === "destructive" && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <IconAlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          )}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold leading-none">{finalTitle}</h2>
            <p className="text-sm text-muted-foreground">{finalDescription}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {finalCancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? tCommon("deleting") : finalConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
