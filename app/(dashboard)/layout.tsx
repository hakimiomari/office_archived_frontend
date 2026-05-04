"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { TenantFilterProvider } from "@/contexts/TenantFilterContext";
import { useUser } from "@/contexts/UserContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslations } from "next-intl";

interface Props {
  children: React.ReactNode;
}

export default function DashboardGroupLayout({ children }: Props) {
  const { loading } = useUser();
  const { dir, locale } = useLocale();
  const t = useTranslations("common");

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary"
            style={{ animationDuration: "0.6s" }}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {t("loadingMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantFilterProvider>
    <LicenseProvider>
      <SidebarProvider
        key={locale}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" side={dir === "rtl" ? "right" : "left"} />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </LicenseProvider>
    </TenantFilterProvider>
  );
}
