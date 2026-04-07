"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconChartInfographic,
  IconShieldLock,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/shared/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUser } from "@/contexts/UserContext";
import { usePermission } from "@/hooks/use-permission";

// Each nav item can optionally require one or more permissions.
// If `requiredPermissions` is not set, the item is always visible.
// If set, user must have at least ONE of the listed permissions.
const allNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
    // Always visible — everyone can see the dashboard
  },
  {
    title: "Office Archive",
    url: "/office-archive",
    icon: IconChartInfographic,
  },
  {
    title: "Mining Licenses",
    url: "/licenses",
    icon: IconFileDescription,
    requiredPermissions: ["license.read", "license.create"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: IconReport,
    requiredPermissions: ["report.view"],
  },
  {
    title: "Users",
    url: "/users",
    icon: IconUsers,
    requiredPermissions: ["user.read", "user.create"],
  },
  {
    title: "Roles",
    url: "/roles",
    icon: IconShieldLock,
    requiredPermissions: ["role.read", "role.create"],
  },
];

const data = {
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        { title: "Active Proposals", url: "#" },
        { title: "Archived", url: "#" },
      ],
    },
  ],
  navSecondary: [
    { title: "Settings", url: "#", icon: IconSettings },
    { title: "Get Help", url: "#", icon: IconHelp },
    { title: "Search", url: "#", icon: IconSearch },
  ],
  documents: [
    { name: "Data Library", url: "#", icon: IconDatabase },
    { name: "Reports", url: "#", icon: IconReport },
    { name: "Word Assistant", url: "#", icon: IconFileWord },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { canAny } = usePermission();

  // Filter nav items based on user permissions
  const visibleNavItems = allNavItems.filter((item) => {
    if (!item.requiredPermissions) return true;
    return canAny(...item.requiredPermissions);
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
