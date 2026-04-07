"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { LicenseProvider } from "@/contexts/LicenseContext";

interface Props {
  children: React.ReactNode;
}

export default function DashboardGroupLayout({ children }: Props) {
  return (
    <LicenseProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
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
  );
}
