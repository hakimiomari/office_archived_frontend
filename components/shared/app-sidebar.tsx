"use client";

import * as React from "react";
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconShieldLock,
  IconPackage,
  IconBuildingWarehouse,
  IconTruck,
  IconArrowsExchange,
  IconShoppingCart,
  IconBuilding,
  IconUsersGroup,
  IconReceipt,
  IconCash,
  IconUserPlus,
  IconReportAnalytics,
  IconAlertTriangle,
  IconCategory,
  IconClipboardList,
} from "@tabler/icons-react";

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
    title: t("inventory"),
    url: "/inventory",
    icon: IconPackage,
    requiredPermissions: ["inventory.read"],
    items: [
      {
        title: t("inventoryDashboard"),
        url: "/inventory",
        icon: IconDashboard,
      },
      {
        title: t("inventoryItems"),
        url: "/inventory/items",
        icon: IconPackage,
      },
      {
        title: t("inventoryWarehouses"),
        url: "/inventory/warehouses",
        icon: IconBuildingWarehouse,
      },
      {
        title: t("inventorySuppliers"),
        url: "/inventory/suppliers",
        icon: IconTruck,
      },
      {
        title: t("inventoryMovements"),
        url: "/inventory/movements",
        icon: IconArrowsExchange,
      },
      {
        title: t("inventoryPurchases"),
        url: "/inventory/purchases",
        icon: IconShoppingCart,
      },
      {
        title: t("inventoryCategories"),
        url: "/inventory/categories",
        icon: IconCategory,
      },
      {
        title: t("inventoryStockCounts"),
        url: "/inventory/stock-counts",
        icon: IconClipboardList,
      },
      {
        title: t("inventoryAlerts"),
        url: "/inventory/alerts",
        icon: IconAlertTriangle,
      },
      {
        title: t("inventoryAnalytics"),
        url: "/inventory/reports",
        icon: IconReportAnalytics,
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
    title: t("sales"),
    url: "/sales",
    icon: IconReceipt,
    requiredPermissions: ["sale.read"],
    items: [
      {
        title: t("salesList"),
        url: "/sales",
        icon: IconReceipt,
      },
      {
        title: t("customers"),
        url: "/sales/customers",
        icon: IconUserPlus,
      },
      {
        title: t("payments"),
        url: "/sales/payments",
        icon: IconCash,
      },
      {
        title: t("overdue"),
        url: "/sales/overdue",
        icon: IconAlertTriangle,
      },
      {
        title: t("salesReports"),
        url: "/sales/reports",
        icon: IconReportAnalytics,
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
                <span className="text-base font-semibold">{tCommon("appName")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
