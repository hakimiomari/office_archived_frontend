"use client";

import { useMemo } from "react";
import {
  useSubscription as useSubscriptionContext,
  type FeatureCode,
  type ModuleCode,
} from "@/contexts/SubscriptionContext";
import { useUser } from "@/contexts/UserContext";
import { useTenantFilter } from "@/contexts/TenantFilterContext";

/**
 * Frontend helper that wraps the SubscriptionContext with the same
 * "unscoped SUPER_ADMIN bypasses every gate" rule the backend guards
 * use. The bypass is a UX convenience — admins viewing the dashboard
 * without a tenant scope see everything regardless of plan.
 */
export function useSubscription() {
  const ctx = useSubscriptionContext();
  const { user } = useUser();
  const { filterCompanyId } = useTenantFilter();

  const isUnscopedSuper = useMemo(
    () => user?.userRole === "SUPER_ADMIN" && filterCompanyId == null,
    [user, filterCompanyId],
  );

  const canAccessModule = (code: ModuleCode) => {
    if (isUnscopedSuper) return true;
    if (!ctx.ready) return false; // hide UI until snapshot loads
    return ctx.modules.has(code);
  };

  const canAccessFeature = (code: FeatureCode) => {
    if (isUnscopedSuper) return true;
    if (!ctx.ready) return false;
    return ctx.features.has(code);
  };

  const limit = ctx.subscription?.limit ?? null;
  const usage = ctx.usage ?? null;

  const atLimit = (key: keyof NonNullable<typeof limit>) => {
    const max = limit?.[key];
    if (max == null) return false;
    const used = usage
      ? key === "maxUsers"
        ? usage.users
        : key === "maxWarehouses"
          ? usage.warehouses
          : key === "maxItems"
            ? usage.items
            : key === "maxEmployees"
              ? usage.employees
              : 0
      : 0;
    return used >= max;
  };

  return {
    ...ctx,
    isUnscopedSuper,
    plan: ctx.subscription?.plan ?? null,
    canAccessModule,
    canAccessFeature,
    isAtUserLimit: () => atLimit("maxUsers"),
    isAtWarehouseLimit: () => atLimit("maxWarehouses"),
    isAtItemLimit: () => atLimit("maxItems"),
    isAtEmployeeLimit: () => atLimit("maxEmployees"),
  };
}
