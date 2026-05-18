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
  IconGavel,
  IconPresentation,
  IconTrendingUp,
  IconFileText,
  IconPlane,
  IconDeviceLaptop,
  IconTool,
  IconUserCheck,
  IconBuilding,
  IconDiamond,
  IconUsersGroup,
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
import { useTranslations } from "next-intl";

// Each nav item can optionally require one or more permissions.
// If `requiredPermissions` is not set, the item is always visible.
// If set, user must have at least ONE of the listed permissions.
const getAllNavItems = (t: (key: string) => string) => [
  {
    title: t("dashboard"),
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: t("miningLicenses"),
    url: "/licenses",
    icon: IconFileDescription,
    requiredPermissions: ["license.read", "license.create", "report.view"],
    items: [
      {
        title: t("allLicenses"),
        url: "/licenses",
        icon: IconFileDescription,
      },
      {
        title: t("miningLicensesReport"),
        url: "/reports",
        icon: IconReport,
      },
    ],
  },
  {
    title: "Companies",
    url: "/companies",
    icon: IconBuilding,
    requiredPermissions: ["company.read", "company.create"],
  },
  {
    title: "Contracts",
    url: "/contracts",
    icon: IconFileText,
    requiredPermissions: ["contract.read", "contract.create"],
  },
  {
    title: "Mineral Types",
    url: "/mineral-types",
    icon: IconDiamond,
    requiredPermissions: ["mineraltype.read", "mineraltype.create"],
  },
  {
    title: t("tenders"),
    url: "/tenders",
    icon: IconGavel,
    requiredPermissions: ["tender.read", "tender.create"],
  },
  {
    title: t("tenderReports"),
    url: "/tender-reports",
    icon: IconChartBar,
    requiredPermissions: ["tender.read"],
  },
  {
    title: t("executive"),
    url: "/executive",
    icon: IconPresentation,
    requiredPermissions: ["executive.read"],
    items: [
      {
        title: t("executiveDashboard"),
        url: "/executive",
        icon: IconTrendingUp,
      },
      {
        title: t("executiveKpis"),
        url: "/executive/kpis",
        icon: IconChartBar,
      },
      {
        title: t("executiveContracts"),
        url: "/executive/contracts",
        icon: IconFileText,
      },
      {
        title: t("executiveTravels"),
        url: "/executive/travels",
        icon: IconPlane,
      },
    ],
  },
  {
    title: t("equipment"),
    url: "/equipment",
    icon: IconDeviceLaptop,
    requiredPermissions: ["equipment.read"],
    items: [
      {
        title: t("equipmentList"),
        url: "/equipment",
        icon: IconDeviceLaptop,
      },
      {
        title: t("equipmentAssignments"),
        url: "/equipment/assignments",
        icon: IconUserCheck,
      },
      {
        title: t("equipmentMaintenance"),
        url: "/equipment/maintenance",
        icon: IconTool,
      },
    ],
  },
  {
    title: t("employees"),
    url: "/employees",
    icon: IconUsersGroup,
    requiredPermissions: ["employee.read"],
    items: [
      {
        title: t("employeesList"),
        url: "/employees",
        icon: IconUsersGroup,
      },
      {
        title: t("departments"),
        url: "/employees/departments",
        icon: IconBuilding,
      },
    ],
  },
  {
    title: t("users"),
    url: "/users",
    icon: IconUsers,
    requiredPermissions: ["user.read", "user.create"],
  },
  {
    title: t("roles"),
    url: "/roles",
    icon: IconShieldLock,
    requiredPermissions: ["role.read", "role.create"],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { canAny } = usePermission();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const allNavItems = getAllNavItems(tNav);

  const navSecondary = [
    { title: tNav("settings"), url: "#", icon: IconSettings },
    { title: tNav("getHelp"), url: "#", icon: IconHelp },
    { title: tNav("search"), url: "#", icon: IconSearch },
  ];

  // const documents = [
  //   { name: "Data Library", url: "#", icon: IconDatabase },
  //   { name: tNav("reports"), url: "#", icon: IconReport },
  //   { name: "Word Assistant", url: "#", icon: IconFileWord },
  // ];

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
                <span className="text-base font-semibold">
                  {tCommon("appName")}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        {/* <NavDocuments items={documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
