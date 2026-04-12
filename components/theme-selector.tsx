"use client";

import { useThemeConfig } from "./active-theme";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const t = useTranslations("theme");

  const DEFAULT_THEMES = [
    { name: t("themeDefault"), value: "default" },
    { name: t("themeBlue"), value: "blue" },
    { name: t("themeGreen"), value: "green" },
    { name: t("themeAmber"), value: "amber" },
  ];

  const SCALED_THEMES = [
    { name: t("themeDefault"), value: "default-scaled" },
    { name: t("themeBlue"), value: "blue-scaled" },
  ];

  const MONO_THEMES = [{ name: t("themeMono"), value: "mono-scaled" }];

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        {t("label")}
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id="theme-selector"
          size="sm"
          className="justify-start *:data-[slot=select-value]:w-12"
        >
          <span className="text-muted-foreground hidden sm:block">
            {t("selectTheme")}
          </span>
          <span className="text-muted-foreground block sm:hidden">
            {t("label")}
          </span>
          <SelectValue placeholder={t("selectThemePlaceholder")} />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>{t("default")}</SelectLabel>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{t("scaled")}</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>{t("monospaced")}</SelectLabel>
            {MONO_THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
