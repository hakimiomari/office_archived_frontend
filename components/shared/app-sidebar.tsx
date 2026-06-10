"use client";

import * as React from "react";
import {
  IconDashboard,
  IconHelp,
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
import { useTenantFilter } from "@/contexts/TenantFilterContext";
import { useSubscription } from "@/hooks/use-subscription";
import type {
  FeatureCode,
  ModuleCode,
} from "@/contexts/SubscriptionContext";
import { useTranslations } from "next-intl";
import { CompanySwitcher } from "@/components/company-switcher";
import { Logo } from "@/components/logo";
import Link from "next/link";

// Each nav item can optionally require:
//  - one or more permissions (user must have at least ONE),
//  - a subscription module (active plan must include it),
//  - a premium feature inside that module.
// Items without any requirement are always visible.
type NavItem = {
  title: string;
  url: string;
  icon: any;
  requiredPermissions?: string[];
  requiredModule?: ModuleCode;
  requiredFeature?: FeatureCode;
  items?: NavItem[];
};

const getAllNavItems = (t: (key: string) => string): NavItem[] => [
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
    requiredModule: "INVENTORY",
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
        requiredModule: "CATEGORIES",
      },
      {
        title: t("inventoryStockCounts"),
        url: "/inventory/stock-counts",
        icon: IconClipboardList,
        requiredModule: "STOCK_COUNTS",
      },
      {
        title: t("inventoryAlerts"),
        url: "/inventory/alerts",
        icon: IconAlertTriangle,
        requiredModule: "ALERTS",
      },
      {
        title: t("inventoryAnalytics"),
        url: "/inventory/reports",
        icon: IconReportAnalytics,
        requiredFeature: "INVENTORY_REPORTS",
      },
    ],
  },
  {
    title: t("employees"),
    url: "/employees",
    icon: IconUsersGroup,
    requiredPermissions: ["employee.read"],
    requiredModule: "EMPLOYEES",
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
    requiredModule: "SALES",
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
  const { filterCompanyId } = useTenantFilter();
  const { canAccessModule, canAccessFeature, ready: subReady } =
    useSubscription();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");

  const allNavItems = getAllNavItems(tNav);

  // "Companies", "Plans", "Subscriptions" are SUPER_ADMIN tenant-management
  // surfaces — only shown when:
  //   1. The user is SUPER_ADMIN, AND
  //   2. They are NOT currently scoped into a specific company. While a
  //      super-admin is "acting as" a company, they get the full tenant
  //      UX (no admin entries leak through).
  const isAdminUnscoped =
    user?.userRole === "SUPER_ADMIN" && filterCompanyId == null;
  if (isAdminUnscoped) {
    allNavItems.push(
      {
        title: "Companies",
        url: "/companies",
        icon: IconBuilding,
      } as any,
      {
        title: "Plans",
        url: "/admin/plans",
        icon: IconReceipt,
      } as any,
      {
        title: "Subscriptions",
        url: "/admin/subscriptions",
        icon: IconShieldLock,
      } as any,
    );
  }

  const navSecondary = [
    { title: tNav("settings"), url: "#", icon: IconSettings },
    { title: tNav("getHelp"), url: "#", icon: IconHelp },
    { title: tNav("search"), url: "#", icon: IconSearch },
  ];

  // Compose three filters: permission → subscription module → subscription
  // feature. Applied to both top-level items and their `items` children.
  const isItemVisible = (item: NavItem): boolean => {
    if (item.requiredPermissions && !canAny(...item.requiredPermissions)) {
      return false;
    }
    if (item.requiredModule && !canAccessModule(item.requiredModule)) {
      return false;
    }
    if (item.requiredFeature && !canAccessFeature(item.requiredFeature)) {
      return false;
    }
    return true;
  };

  // While the subscription snapshot is loading, surface only items that
  // don't depend on it (no requiredModule / requiredFeature). This keeps
  // the sidebar from flashing every item then collapsing.
  const visibleNavItems = allNavItems
    .filter((item) =>
      subReady
        ? isItemVisible(item)
        : !item.requiredModule && !item.requiredFeature
          ? isItemVisible(item)
          : false,
    )
    .map((item) => ({
      ...item,
      items: item.items?.filter((child) =>
        subReady
          ? isItemVisible(child)
          : !child.requiredModule && !child.requiredFeature
            ? isItemVisible(child)
            : false,
      ),
    }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Logo className="!size-6" />
                <span className="text-base font-semibold">{tCommon("appName")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* SUPER_ADMIN-only company picker; renders nothing for tenants. */}
          <CompanySwitcher />
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
