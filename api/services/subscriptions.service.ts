import api from "@/lib/api/axios";
import type {
  BillingCycle,
  FeatureCode,
  ModuleCode,
  SubscriptionStatus,
} from "@/contexts/SubscriptionContext";

/** Per-plan limit row (null = unlimited). */
export type PlanLimit = {
  id?: number;
  planId?: number;
  maxUsers: number | null;
  maxWarehouses: number | null;
  maxItems: number | null;
  maxEmployees: number | null;
  storageGb: number | null;
};

export type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  modules: { id: number; planId: number; moduleCode: ModuleCode }[];
  features: { id: number; planId: number; featureCode: FeatureCode }[];
  limit: PlanLimit | null;
  _count?: { subscriptions: number };
};

export type Subscription = {
  id: number;
  companyId: number;
  planId: number;
  startDate: string;
  endDate: string | null;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
  company?: { id: number; name: string; slug: string | null };
};

// ─── Plan CRUD ───
export async function listPlans(): Promise<Plan[]> {
  const res = await api.get("admin/plans");
  return res.data;
}

export async function getPlan(id: number): Promise<Plan> {
  const res = await api.get(`admin/plans/${id}`);
  return res.data;
}

export async function createPlan(
  body: Partial<Plan> & {
    modules?: ModuleCode[];
    features?: FeatureCode[];
    limit?: Partial<PlanLimit>;
  },
): Promise<Plan> {
  const res = await api.post("admin/plans", body);
  return res.data;
}

export async function updatePlan(
  id: number,
  body: Partial<Plan>,
): Promise<Plan> {
  const res = await api.patch(`admin/plans/${id}`, body);
  return res.data;
}

export async function deletePlan(id: number): Promise<{ ok: true }> {
  const res = await api.delete(`admin/plans/${id}`);
  return res.data;
}

export async function setPlanModules(
  id: number,
  codes: ModuleCode[],
): Promise<Plan> {
  const res = await api.put(`admin/plans/${id}/modules`, { codes });
  return res.data;
}

export async function setPlanFeatures(
  id: number,
  codes: FeatureCode[],
): Promise<Plan> {
  const res = await api.put(`admin/plans/${id}/features`, { codes });
  return res.data;
}

export async function setPlanLimit(
  id: number,
  limit: Partial<PlanLimit>,
): Promise<PlanLimit> {
  const res = await api.put(`admin/plans/${id}/limit`, limit);
  return res.data;
}

// ─── Subscription CRUD ───
export async function listSubscriptions(filters?: {
  companyId?: number;
  planId?: number;
  status?: SubscriptionStatus;
}): Promise<Subscription[]> {
  const params = new URLSearchParams();
  if (filters?.companyId) params.set("companyId", String(filters.companyId));
  if (filters?.planId) params.set("planId", String(filters.planId));
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const res = await api.get(`admin/subscriptions${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getActiveSubscriptionForCompany(
  companyId: number,
): Promise<Subscription | null> {
  const res = await api.get(`admin/subscriptions/companies/${companyId}`);
  return res.data;
}

export async function createSubscription(
  body: Pick<Subscription, "companyId" | "planId"> & {
    cycle?: BillingCycle;
    startDate?: string;
    endDate?: string | null;
    autoRenew?: boolean;
    notes?: string;
  },
): Promise<Subscription> {
  const res = await api.post("admin/subscriptions", body);
  return res.data;
}

export async function upgradeSubscription(
  id: number,
  planId: number,
  cycle: BillingCycle,
  startDate?: string,
): Promise<Subscription> {
  const res = await api.post(`admin/subscriptions/${id}/upgrade`, {
    planId,
    cycle,
    startDate,
  });
  return res.data;
}

export async function downgradeSubscription(
  id: number,
  planId: number,
  cycle: BillingCycle,
  startDate?: string,
): Promise<Subscription> {
  const res = await api.post(`admin/subscriptions/${id}/downgrade`, {
    planId,
    cycle,
    startDate,
  });
  return res.data;
}

export async function cancelSubscription(
  id: number,
): Promise<{ ok: true }> {
  const res = await api.post(`admin/subscriptions/${id}/cancel`);
  return res.data;
}
