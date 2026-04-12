"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";
import { ThemeSelector } from "./theme-selector";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslations } from "next-intl";

export function SiteHeader() {
  const t = useTranslations("nav");
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{t("documents")}</h1>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
