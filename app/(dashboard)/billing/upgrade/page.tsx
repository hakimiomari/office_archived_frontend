"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api/axios";
import { useUser } from "@/contexts/UserContext";
import {
  useSubscription,
  type BillingCycle,
} from "@/contexts/SubscriptionContext";
import {
  createPlanRequest,
  getMyPendingPlanRequest,
  type PlanChangeRequest,
} from "@/api/services/plan-requests.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PublicPlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  sortOrder: number;
  isActive: boolean;
  limit: {
    maxUsers: number | null;
    maxWarehouses: number | null;
    maxItems: number | null;
    maxEmployees: number | null;
  } | null;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "PERPETUAL", label: "Perpetual" },
];

const fmtLimit = (n: number | null) => (n == null ? "Unlimited" : n.toString());
const fmtPrice = (n: number) =>
  n === 0 ? "Free" : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function BillingUpgradePage() {
  const router = useRouter();
  const { user } = useUser();
  const { subscription, refresh: refreshSubscription } = useSubscription();

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [pending, setPending] = useState<PlanChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState<PublicPlan | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // SUPER_ADMIN doesn't request plans; they manage them directly.
  useEffect(() => {
    if (user && user.userRole === "SUPER_ADMIN") {
      router.replace("/admin/subscriptions");
    }
  }, [user, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [plansRes, pendingRes] = await Promise.all([
          api.get<PublicPlan[]>("plans/public"),
          getMyPendingPlanRequest().catch(() => null),
        ]);
        if (cancelled) return;
        setPlans((plansRes.data ?? []).filter((p) => p.isActive));
        setPending(pendingRes ?? null);
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? "Failed to load plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentPlanId = subscription?.plan?.id ?? null;

  // Cards sorted by tier (sortOrder) — Basic → Premium → Pro left-to-right.
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );

  // Find the company's current plan in the loaded plans list so we
  // know its sortOrder — the SubscriptionContext snapshot only carries
  // basic plan fields, not the rank.
  const currentPlan = useMemo(
    () => sortedPlans.find((p) => p.id === currentPlanId) ?? null,
    [sortedPlans, currentPlanId],
  );
  const currentSortOrder = currentPlan?.sortOrder ?? -Infinity;

  const openDialog = (plan: PublicPlan) => {
    setTarget(plan);
    setCycle("MONTHLY");
    setNotes("");
    setReceipt(null);
  };

  const submit = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      const req = await createPlanRequest({
        requestedPlanId: target.id,
        billingCycle: cycle,
        notes: notes.trim() || undefined,
        receipt: receipt ?? undefined,
      });
      toast.success(
        `Request submitted — awaiting review (#${req.id})`,
      );
      setTarget(null);
      setPending(req);
      void refreshSubscription();
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        data?.error ??
        "Failed to submit request";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading plans…</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Upgrade Plan</h1>
        <p className="text-sm text-muted-foreground">
          Pick a plan and submit a request. A reviewer will switch your
          subscription once they approve it.
        </p>
      </div>

      {/* Current-plan header — shows what the company is on today. */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Current plan
            </div>
            <div className="text-xl font-semibold">
              {currentPlan?.name ?? subscription?.plan?.name ?? "No active subscription"}
            </div>
            {subscription && (
              <div className="text-sm text-muted-foreground">
                Billing: {subscription.billingCycle.toLowerCase()}
                {subscription.endDate && (
                  <> · Renews {fmtDate(subscription.endDate)}</>
                )}
                {!subscription.endDate && subscription.billingCycle === "PERPETUAL" && (
                  <> · No expiration</>
                )}
              </div>
            )}
          </div>
          <Badge variant="default" className="self-start sm:self-auto">
            {currentPlan
              ? currentSortOrder === sortedPlans[sortedPlans.length - 1]?.sortOrder
                ? "Top tier"
                : "Active"
              : "—"}
          </Badge>
        </CardContent>
      </Card>

      {pending && (
        <Card className="border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              You have a pending request for{" "}
              <span className="font-semibold">
                {pending.requestedPlan?.name}
              </span>{" "}
              ({pending.billingCycle.toLowerCase()}). Cancel it before
              submitting a new one.
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/billing/requests">View requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedPlans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          // Tier rule: only allow moving to a HIGHER-tier plan than
          // the company's current one. Same plan (different cycle)
          // is allowed too — that's a renewal, not a downgrade.
          // If there's no current subscription, every plan is upgradeable.
          const isLowerTier =
            currentPlan != null &&
            !isCurrent &&
            p.sortOrder <= currentSortOrder;
          const blocked = isCurrent || isLowerTier || Boolean(pending);

          return (
            <Card
              key={p.id}
              className={
                isCurrent
                  ? "border-primary ring-2 ring-primary/30"
                  : isLowerTier
                    ? "opacity-60"
                    : undefined
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{p.name}</span>
                  {isCurrent ? (
                    <Badge variant="default">Current</Badge>
                  ) : isLowerTier ? (
                    <Badge variant="outline">Lower tier</Badge>
                  ) : null}
                </CardTitle>
                {p.description && (
                  <p className="text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {fmtPrice(p.monthlyPrice)}
                    {p.monthlyPrice > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                  {p.yearlyPrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      or {fmtPrice(p.yearlyPrice)}/year
                    </div>
                  )}
                </div>
                <ul className="space-y-1 text-sm">
                  <li>Users: {fmtLimit(p.limit?.maxUsers ?? null)}</li>
                  <li>Items: {fmtLimit(p.limit?.maxItems ?? null)}</li>
                  <li>
                    Warehouses: {fmtLimit(p.limit?.maxWarehouses ?? null)}
                  </li>
                  <li>
                    Employees: {fmtLimit(p.limit?.maxEmployees ?? null)}
                  </li>
                </ul>
                <Button
                  className="mt-auto"
                  disabled={blocked}
                  onClick={() => openDialog(p)}
                  variant={isCurrent ? "secondary" : "default"}
                >
                  {isCurrent
                    ? "Active plan"
                    : isLowerTier
                      ? "Downgrade not allowed"
                      : pending
                        ? "Request pending"
                        : "Request this plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request {target?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycle">Billing cycle</Label>
              <Combobox
                value={cycle}
                onValueChange={(v) => setCycle((v as BillingCycle) || "MONTHLY")}
                options={CYCLES.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Select cycle"
              />
              {target && (
                <p className="text-xs text-muted-foreground">
                  {cycle === "MONTHLY" &&
                    target.monthlyPrice > 0 &&
                    `${fmtPrice(target.monthlyPrice)} — billed every 30 days`}
                  {cycle === "YEARLY" &&
                    target.yearlyPrice > 0 &&
                    `${fmtPrice(target.yearlyPrice)} — billed once for the year`}
                  {cycle === "PERPETUAL" && "No expiration (one-time)"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receipt">Payment receipt (optional)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Image (PNG/JPG/WebP) or PDF, up to 5MB. The reviewer will
                see this attached to your request.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Anything the reviewer should know…"
                className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
