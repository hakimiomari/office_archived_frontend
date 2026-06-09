"use client";

import { useThemeConfig } from "./active-theme";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
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

  const options = [
    ...DEFAULT_THEMES.map((th) => ({
      value: th.value,
      label: `${t("default")} — ${th.name}`,
    })),
    ...SCALED_THEMES.map((th) => ({
      value: th.value,
      label: `${t("scaled")} — ${th.name}`,
    })),
    ...MONO_THEMES.map((th) => ({
      value: th.value,
      label: `${t("monospaced")} — ${th.name}`,
    })),
  ];

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        {t("label")}
      </Label>
      <Combobox
        value={activeTheme}
        onValueChange={setActiveTheme}
        options={options}
        placeholder={t("selectThemePlaceholder")}
        searchPlaceholder={t("selectTheme")}
        emptyMessage="No theme found."
      />
    </div>
  );
}
