"use client";

import { useEffect, useState } from "react";
import {
  Plan,
  Subscription,
  useSubscriptionsAdmin,
} from "@/api/hooks/use-subscriptions-admin";
import type { BillingCycle } from "@/contexts/SubscriptionContext";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nextRoute } from "@/lib/route";

export default function AdminSubscriptionsPage() {
  const { user } = useUser();
  const { changeRoute } = nextRoute();
  const admin = useSubscriptionsAdmin();

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  const [changing, setChanging] = useState<{
    sub: Subscription;
    direction: "upgrade" | "downgrade";
  } | null>(null);

  useEffect(() => {
    if (user && user.userRole !== "SUPER_ADMIN") {
      changeRoute("/dashboard");
    }
  }, [user]);

  const refresh = async () => {
    setLoading(true);
    const [list, planList] = await Promise.all([
      admin.listSubscriptions({
        status:
          statusFilter !== "ALL"
            ? (statusFilter as Subscription["status"])
            : undefined,
        planId: planFilter !== "ALL" ? Number(planFilter) : undefined,
      }),
      admin.listPlans(),
    ]);
    setSubs(list);
    setPlans(planList);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [statusFilter, planFilter]);

  if (user && user.userRole !== "SUPER_ADMIN") return null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Company Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Move tenants between plans; cache invalidates on save.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Combobox
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "EXPIRED", label: "Expired" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "PAST_DUE", label: "Past due" },
          ]}
          triggerClassName="h-9 w-[180px]"
          searchPlaceholder="Search..."
          emptyMessage="No status."
        />
        <Combobox
          value={planFilter}
          onValueChange={setPlanFilter}
          options={[
            { value: "ALL", label: "All plans" },
            ...plans.map((p) => ({ value: String(p.id), label: p.name })),
          ]}
          triggerClassName="h-9 w-[200px]"
          searchPlaceholder="Search plans..."
          emptyMessage="No plan."
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : subs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No subscriptions match.
                </TableCell>
              </TableRow>
            ) : (
              subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.company?.name ?? `#${s.companyId}`}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">
                      {s.plan?.slug ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {s.billingCycle}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        s.status === "ACTIVE"
                          ? "default"
                          : s.status === "CANCELLED"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(s.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === "ACTIVE" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            setChanging({ sub: s, direction: "upgrade" })
                          }
                        >
                          Upgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setChanging({ sub: s, direction: "downgrade" })
                          }
                        >
                          Downgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm("Cancel this subscription?")) return;
                            try {
                              await admin.cancel(s.id);
                              refresh();
                            } catch {
                              /* toast already shown */
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChangePlanDialog
        change={changing}
        plans={plans}
        onClose={() => setChanging(null)}
        admin={admin}
        onSaved={refresh}
      />
    </div>
  );
}

function ChangePlanDialog({
  change,
  plans,
  onClose,
  admin,
  onSaved,
}: {
  change: { sub: Subscription; direction: "upgrade" | "downgrade" } | null;
  plans: Plan[];
  onClose: () => void;
  admin: ReturnType<typeof useSubscriptionsAdmin>;
  onSaved: () => void;
}) {
  const [planId, setPlanId] = useState<string>("");
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [startDate, setStartDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlanId("");
    setCycle("MONTHLY");
    setStartDate("");
  }, [change]);

  if (!change) return null;

  // Derive a preview of the resulting endDate so the admin can see what
  // they're about to commit before clicking Confirm. Mirrors the
  // backend's day-math: +30 days / +365 days / null.
  const previewEndDate = (() => {
    if (cycle === "PERPETUAL") return null;
    const start = startDate ? new Date(startDate) : new Date();
    if (isNaN(start.getTime())) return null;
    const days = cycle === "MONTHLY" ? 30 : 365;
    return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
  })();

  const handleSubmit = async () => {
    if (!planId) return;
    setSaving(true);
    try {
      const sd = startDate || undefined;
      if (change.direction === "upgrade") {
        await admin.upgrade(change.sub.id, Number(planId), cycle, sd);
      } else {
        await admin.downgrade(change.sub.id, Number(planId), cycle, sd);
      }
      onSaved();
      onClose();
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {change.direction === "upgrade" ? "Upgrade" : "Downgrade"} —{" "}
            {change.sub.company?.name ?? `Company #${change.sub.companyId}`}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Current plan:{" "}
          <span className="font-mono">{change.sub.plan?.slug ?? "?"}</span> ·{" "}
          <span className="font-mono">{change.sub.billingCycle}</span>
        </p>

        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">New plan</label>
            <Combobox
              value={planId}
              onValueChange={setPlanId}
              options={plans
                .filter((p) => p.isActive && p.id !== change.sub.planId)
                .map((p) => ({ value: String(p.id), label: p.name }))}
              placeholder="Pick the new plan"
              searchPlaceholder="Search plans..."
              emptyMessage="No other plan available."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Billing cycle
            </label>
            <Combobox
              value={cycle}
              onValueChange={(v) => setCycle(v as BillingCycle)}
              options={[
                { value: "MONTHLY", label: "Monthly (30 days)" },
                { value: "YEARLY", label: "Yearly (365 days)" },
                { value: "PERPETUAL", label: "Perpetual (no end date)" },
              ]}
              searchPlaceholder="Search..."
              emptyMessage="No option."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Start date (optional — defaults to now)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            End date preview:{" "}
            <span className="font-mono">
              {previewEndDate
                ? previewEndDate.toLocaleDateString()
                : "— (open-ended)"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!planId || saving} onClick={handleSubmit}>
            {saving ? "Saving…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
