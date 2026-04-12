"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  AFGHANISTAN_PROVINCES,
  provinceKey,
} from "@/lib/constants/provinces";

interface ProvinceSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** When true, includes an "All" option that returns an empty string */
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const ALL_VALUE = "__all__";

export function ProvinceSelect({
  value,
  onValueChange,
  placeholder,
  required,
  includeAll = false,
  allLabel,
  className,
  id,
  disabled,
}: ProvinceSelectProps) {
  const tProvinces = useTranslations("provinces");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const finalAllLabel = allLabel ?? tCommon("all");
  const finalPlaceholder = placeholder ?? tProvinces("selectProvince");

  // Determine display label for the trigger
  const triggerLabel = (() => {
    if (!value) return includeAll ? finalAllLabel : finalPlaceholder;
    try {
      return tProvinces(provinceKey(value) as any);
    } catch {
      return value;
    }
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {triggerLabel}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        style={{ maxHeight: "320px" }}
      >
        <Command
          filter={(itemValue, search) => {
            // Custom filter: search both the canonical English code and the translated name
            const code = itemValue.toLowerCase();
            const searchLower = search.toLowerCase();
            if (code.includes(searchLower)) return 1;
            // Also try translation
            try {
              const translated = tProvinces(
                provinceKey(itemValue) as any
              ).toLowerCase();
              if (translated.includes(searchLower)) return 1;
            } catch {}
            return 0;
          }}
        >
          <CommandInput placeholder={tProvinces("searchPlaceholder")} />
          <CommandList
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <CommandEmpty>{tProvinces("noProvinceFound")}</CommandEmpty>
            <CommandGroup>
              {includeAll && (
                <CommandItem
                  value={ALL_VALUE}
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {finalAllLabel}
                </CommandItem>
              )}
              {AFGHANISTAN_PROVINCES.map((p) => (
                <CommandItem
                  key={p}
                  value={p}
                  onSelect={() => {
                    onValueChange(p);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "me-2 h-4 w-4",
                      value === p ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tProvinces(provinceKey(p) as any)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
