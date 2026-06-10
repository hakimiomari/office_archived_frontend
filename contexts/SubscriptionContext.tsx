"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "@/lib/api/axios";
import { useUser } from "@/contexts/UserContext";

/**
 * String unions kept in sync with the backend's ModuleCode / FeatureCode
 * Prisma enums. Hand-typed instead of imported so the frontend doesn't
 * depend on the @prisma/client package.
 */
export type ModuleCode =
  | "INVENTORY"
  | "SALES"
  | "EMPLOYEES"
  | "CATEGORIES"
  | "ALERTS"
  | "STOCK_COUNTS"
  | "ACCOUNTING"
  | "BANKING"
  | "USERS"
  | "ROLES";

export type FeatureCode =
  | "INVENTORY_REPORTS"
  | "INVENTORY_PROFIT_REPORT"
  | "SALES_PDF_EXPORT"
  | "CUSTOMER_STATEMENT_PDF"
  | "ACCOUNTING_LEDGER"
  | "ACCOUNTING_JOURNALS"
  | "BANK_RECONCILIATION"
  | "AUDIT_LOGS";

export type SubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PAST_DUE";

export type BillingCycle = "MONTHLY" | "YEARLY" | "PERPETUAL";

export type SubscriptionPlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
};

export type SubscriptionLimit = {
  maxUsers: number | null;
  maxWarehouses: number | null;
  maxItems: number | null;
  maxEmployees: number | null;
  storageGb: number | null;
};

export type SubscriptionUsage = {
  users: number;
  warehouses: number;
  items: number;
  employees: number;
};

export type SubscriptionSnapshot = {
  subscriptionId: number;
  companyId: number;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  plan: SubscriptionPlan;
  modules: ModuleCode[];
  features: FeatureCode[];
  limit: SubscriptionLimit | null;
};

type State = {
  loading: boolean;
  ready: boolean;
  subscription: SubscriptionSnapshot | null;
  usage: SubscriptionUsage | null;
  modules: Set<ModuleCode>;
  features: Set<FeatureCode>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<State>({
  loading: false,
  ready: false,
  subscription: null,
  usage: null,
  modules: new Set(),
  features: new Set(),
  refresh: async () => {},
});

/**
 * Custom event broadcast from any component that mutates a plan or a
 * subscription so other contexts can re-fetch without prop-drilling.
 */
export const SUBSCRIPTION_CHANGED_EVENT = "subscription:changed";

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [subscription, setSubscription] =
    useState<SubscriptionSnapshot | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);

  const refresh = useCallback(async () => {
    // Unauthenticated or SUPER_ADMIN-without-scope → no subscription
    // applies. We still mark ready=true so gates render their default.
    if (!user) {
      setSubscription(null);
      setUsage(null);
      setReady(true);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("subscriptions/current");
      const sub: SubscriptionSnapshot | null = res.data?.subscription ?? null;
      const u: SubscriptionUsage | null = res.data?.usage ?? null;
      setSubscription(sub);
      setUsage(u);
    } catch {
      // Fail open in the UI — the backend guards are the source of truth.
      setSubscription(null);
      setUsage(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [user]);

  // Re-fetch on user change AND on subscription-mutation events.
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener(SUBSCRIPTION_CHANGED_EVENT, handler);
    return () =>
      window.removeEventListener(SUBSCRIPTION_CHANGED_EVENT, handler);
  }, [refresh]);

  const modules = useMemo(
    () => new Set<ModuleCode>(subscription?.modules ?? []),
    [subscription],
  );
  const features = useMemo(
    () => new Set<FeatureCode>(subscription?.features ?? []),
    [subscription],
  );

  const value = useMemo<State>(
    () => ({
      loading,
      ready,
      subscription,
      usage,
      modules,
      features,
      refresh,
    }),
    [loading, ready, subscription, usage, modules, features, refresh],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

/**
 * Imperative helper from any component / hook to bust the cached
 * snapshot after a plan or subscription mutation.
 */
export function notifySubscriptionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SUBSCRIPTION_CHANGED_EVENT));
  }
}
