"use client";

import toast from "react-hot-toast";
import * as svc from "../services/subscriptions.service";
import { notifySubscriptionChanged } from "@/contexts/SubscriptionContext";

export type {
  Plan,
  PlanLimit,
  Subscription,
} from "../services/subscriptions.service";

function toastError(err: any, fallback: string) {
  toast.error(err?.response?.data?.message || fallback);
}

/**
 * Admin-only hook (SUPER_ADMIN). Mirrors the pattern in `use-companies.ts`:
 * thin wrappers around the service that toast on error and dispatch the
 * `subscription:changed` event so SubscriptionContext re-fetches the
 * current snapshot — relevant when a SUPER_ADMIN edits the plan that is
 * also their currently-scoped tenant.
 */
export const useSubscriptionsAdmin = () => {
  // ─── plans ───
  const listPlans = async () => {
    try {
      return await svc.listPlans();
    } catch (err) {
      toastError(err, "Failed to load plans");
      return [];
    }
  };

  const getPlan = async (id: number) => {
    try {
      return await svc.getPlan(id);
    } catch (err) {
      toastError(err, "Failed to load plan");
      return null;
    }
  };

  const createPlan: typeof svc.createPlan = async (body) => {
    try {
      const result = await svc.createPlan(body);
      toast.success("Plan created");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to create plan");
      throw err;
    }
  };

  const updatePlan: typeof svc.updatePlan = async (id, body) => {
    try {
      const result = await svc.updatePlan(id, body);
      toast.success("Plan updated");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to update plan");
      throw err;
    }
  };

  const deletePlan: typeof svc.deletePlan = async (id) => {
    try {
      const result = await svc.deletePlan(id);
      toast.success("Plan deleted");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to delete plan");
      throw err;
    }
  };

  const setPlanModules: typeof svc.setPlanModules = async (id, codes) => {
    try {
      const result = await svc.setPlanModules(id, codes);
      toast.success("Modules updated");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to update modules");
      throw err;
    }
  };

  const setPlanFeatures: typeof svc.setPlanFeatures = async (id, codes) => {
    try {
      const result = await svc.setPlanFeatures(id, codes);
      toast.success("Features updated");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to update features");
      throw err;
    }
  };

  const setPlanLimit: typeof svc.setPlanLimit = async (id, limit) => {
    try {
      const result = await svc.setPlanLimit(id, limit);
      toast.success("Limits saved");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to save limits");
      throw err;
    }
  };

  // ─── subscriptions ───
  const listSubscriptions: typeof svc.listSubscriptions = async (filters) => {
    try {
      return await svc.listSubscriptions(filters);
    } catch (err) {
      toastError(err, "Failed to load subscriptions");
      return [];
    }
  };

  const upgrade: typeof svc.upgradeSubscription = async (
    id,
    planId,
    cycle,
    startDate,
  ) => {
    try {
      const result = await svc.upgradeSubscription(id, planId, cycle, startDate);
      toast.success("Subscription upgraded");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to upgrade");
      throw err;
    }
  };

  const downgrade: typeof svc.downgradeSubscription = async (
    id,
    planId,
    cycle,
    startDate,
  ) => {
    try {
      const result = await svc.downgradeSubscription(
        id,
        planId,
        cycle,
        startDate,
      );
      toast.success("Subscription downgraded");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to downgrade");
      throw err;
    }
  };

  const cancel: typeof svc.cancelSubscription = async (id) => {
    try {
      const result = await svc.cancelSubscription(id);
      toast.success("Subscription cancelled");
      notifySubscriptionChanged();
      return result;
    } catch (err) {
      toastError(err, "Failed to cancel");
      throw err;
    }
  };

  return {
    listPlans,
    getPlan,
    createPlan,
    updatePlan,
    deletePlan,
    setPlanModules,
    setPlanFeatures,
    setPlanLimit,
    listSubscriptions,
    upgrade,
    downgrade,
    cancel,
  };
};
