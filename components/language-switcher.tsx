"use client";

import { useLocale, LOCALES, type Locale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLanguage, IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations("language");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <IconLanguage className="h-4 w-4" />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className="cursor-pointer"
          >
            <span className="flex-1">{l.label}</span>
            {locale === l.code && <IconCheck className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
