import api from "@/lib/api/axios";
import type { BillingCycle } from "@/contexts/SubscriptionContext";
import type { Plan } from "./subscriptions.service";

export type PlanChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type PlanChangeRequest = {
  id: number;
  companyId: number;
  requestedPlanId: number;
  currentPlanId: number | null;
  billingCycle: BillingCycle;
  receiptUrl: string | null;
  receiptFileName: string | null;
  notes: string | null;
  status: PlanChangeRequestStatus;
  reviewedById: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  company?: { id: number; name: string; slug: string | null };
  requestedPlan?: Pick<Plan, "id" | "name" | "slug">;
  currentPlan?: Pick<Plan, "id" | "name" | "slug"> | null;
  reviewedBy?: { id: number; name: string; email: string } | null;
  createdBy?: { id: number; name: string; email: string } | null;
};

export type ListPlanRequestsResponse = {
  items: PlanChangeRequest[];
  total: number;
  page: number;
  limit: number;
};

export type CreatePlanRequestInput = {
  requestedPlanId: number;
  billingCycle: BillingCycle;
  notes?: string;
  receipt?: File | null;
};

// ─── Company-admin ──────────────────────────────────────────────

export async function createPlanRequest(
  input: CreatePlanRequestInput,
): Promise<PlanChangeRequest> {
  const fd = new FormData();
  fd.append("requestedPlanId", String(input.requestedPlanId));
  fd.append("billingCycle", input.billingCycle);
  if (input.notes) fd.append("notes", input.notes);
  if (input.receipt) fd.append("receipt", input.receipt);
  const res = await api.post("plan-requests", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listMyPlanRequests(): Promise<PlanChangeRequest[]> {
  const res = await api.get("plan-requests/mine");
  return res.data;
}

export async function getMyPendingPlanRequest(): Promise<PlanChangeRequest | null> {
  const res = await api.get("plan-requests/mine/pending");
  return res.data;
}

export async function cancelPlanRequest(
  id: number,
): Promise<PlanChangeRequest> {
  const res = await api.post(`plan-requests/${id}/cancel`);
  return res.data;
}

// ─── Reviewer ──────────────────────────────────────────────────

export async function listPlanRequests(filters?: {
  status?: PlanChangeRequestStatus;
  companyId?: number;
  page?: number;
  limit?: number;
}): Promise<ListPlanRequestsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.companyId) params.set("companyId", String(filters.companyId));
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const res = await api.get(`plan-requests${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getPlanRequest(id: number): Promise<PlanChangeRequest> {
  const res = await api.get(`plan-requests/${id}`);
  return res.data;
}

export async function getPlanRequestReceiptUrl(
  id: number,
): Promise<{ url: string } | null> {
  const res = await api.get(`plan-requests/${id}/receipt`);
  return res.data;
}

export async function approvePlanRequest(
  id: number,
  reviewNotes?: string,
): Promise<PlanChangeRequest> {
  const res = await api.post(`plan-requests/${id}/approve`, { reviewNotes });
  return res.data;
}

export async function rejectPlanRequest(
  id: number,
  reviewNotes?: string,
): Promise<PlanChangeRequest> {
  const res = await api.post(`plan-requests/${id}/reject`, { reviewNotes });
  return res.data;
}
