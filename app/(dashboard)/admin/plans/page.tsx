"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plan,
  PlanLimit,
  useSubscriptionsAdmin,
} from "@/api/hooks/use-subscriptions-admin";
import { useUser } from "@/contexts/UserContext";
import { usePermission } from "@/hooks/use-permission";
import {
  FeatureCode,
  ModuleCode,
} from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextRoute } from "@/lib/route";

const ALL_MODULES: ModuleCode[] = [
  "INVENTORY",
  "SALES",
  "EMPLOYEES",
  "CATEGORIES",
  "ALERTS",
  "STOCK_COUNTS",
  "ACCOUNTING",
  "BANKING",
  "USERS",
  "ROLES",
];

const ALL_FEATURES: FeatureCode[] = [
  "INVENTORY_REPORTS",
  "INVENTORY_PROFIT_REPORT",
  "SALES_PDF_EXPORT",
  "CUSTOMER_STATEMENT_PDF",
  "ACCOUNTING_LEDGER",
  "ACCOUNTING_JOURNALS",
  "BANK_RECONCILIATION",
  "AUDIT_LOGS",
];

export default function AdminPlansPage() {
  const { user } = useUser();
  const { can } = usePermission();
  const { changeRoute } = nextRoute();
  const admin = useSubscriptionsAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  // Two-tier access:
  //  - SUPER_ADMIN: everything (create + delete + edit + modules + features + limits)
  //  - plan.update permission: read + edit details/prices only
  // Anyone else gets booted to the dashboard.
  const isSuperAdmin = user?.userRole === "SUPER_ADMIN";
  const canEdit = isSuperAdmin || can("plan.update");

  useEffect(() => {
    if (user && !canEdit) {
      changeRoute("/dashboard");
    }
  }, [user, canEdit]);

  const refresh = async () => {
    setLoading(true);
    const list = await admin.listPlans();
    setPlans(list);
    setLoading(false);
  };

  useEffect(() => {
    if (canEdit) refresh();
  }, [canEdit]);

  if (user && !canEdit) return null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">
            Define modules, premium features and resource limits per plan.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)}>+ New plan</Button>
        )}
      </div>
      {!isSuperAdmin && (
        <p className="text-xs text-muted-foreground">
          You can edit plan descriptions and prices. Creating or deleting
          plans, and changing modules / features / limits, requires
          SUPER_ADMIN access.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No plans yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              onEdit={() => setEditing(p)}
              onDeleted={refresh}
              admin={admin}
              canDelete={isSuperAdmin}
            />
          ))}
        </div>
      )}

      <PlanDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={refresh}
        admin={admin}
      />
      <PlanDialog
        open={!!editing}
        plan={editing}
        onClose={() => setEditing(null)}
        onSaved={refresh}
        admin={admin}
      />
    </div>
  );
}

function PlanCard({
  plan,
  onEdit,
  onDeleted,
  admin,
  canDelete,
}: {
  plan: Plan;
  onEdit: () => void;
  onDeleted: () => void;
  admin: ReturnType<typeof useSubscriptionsAdmin>;
  canDelete: boolean;
}) {
  const moduleCount = plan.modules?.length ?? 0;
  const featureCount = plan.features?.length ?? 0;
  const limit = plan.limit;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{plan.name}</span>
          <Badge variant={plan.isActive ? "default" : "outline"}>
            {plan.isActive ? "Active" : "Disabled"}
          </Badge>
        </CardTitle>
        <CardDescription>{plan.description ?? "—"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-muted-foreground">Slug</div>
          <div className="font-mono">{plan.slug}</div>
          <div className="text-muted-foreground">Monthly</div>
          <div>{plan.monthlyPrice}</div>
          <div className="text-muted-foreground">Yearly</div>
          <div>{plan.yearlyPrice}</div>
          <div className="text-muted-foreground">Modules</div>
          <div>{moduleCount}</div>
          <div className="text-muted-foreground">Features</div>
          <div>{featureCount}</div>
          <div className="text-muted-foreground">Limits</div>
          <div className="text-xs">
            {limit
              ? `users ${fmtLimit(limit.maxUsers)} · whs ${fmtLimit(limit.maxWarehouses)} · items ${fmtLimit(limit.maxItems)} · emp ${fmtLimit(limit.maxEmployees)}`
              : "—"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!confirm(`Delete plan "${plan.name}"?`)) return;
                try {
                  await admin.deletePlan(plan.id);
                  onDeleted();
                } catch {
                  /* toast already shown */
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const fmtLimit = (n: number | null | undefined) => (n == null ? "∞" : n);

function PlanDialog({
  open,
  plan,
  onClose,
  onSaved,
  admin,
}: {
  open: boolean;
  plan?: Plan | null;
  onClose: () => void;
  onSaved: () => void;
  admin: ReturnType<typeof useSubscriptionsAdmin>;
}) {
  const editing = !!plan;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("0");
  const [yearlyPrice, setYearlyPrice] = useState("0");
  const [modules, setModules] = useState<Set<ModuleCode>>(new Set());
  const [features, setFeatures] = useState<Set<FeatureCode>>(new Set());
  const [limit, setLimit] = useState<{
    [K in keyof PlanLimit]?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setDescription(plan.description ?? "");
      setMonthlyPrice(String(plan.monthlyPrice ?? 0));
      setYearlyPrice(String(plan.yearlyPrice ?? 0));
      setModules(new Set(plan.modules?.map((m) => m.moduleCode) ?? []));
      setFeatures(new Set(plan.features?.map((f) => f.featureCode) ?? []));
      setLimit({
        maxUsers: nullableStr(plan.limit?.maxUsers),
        maxWarehouses: nullableStr(plan.limit?.maxWarehouses),
        maxItems: nullableStr(plan.limit?.maxItems),
        maxEmployees: nullableStr(plan.limit?.maxEmployees),
        storageGb: nullableStr(plan.limit?.storageGb),
      });
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setMonthlyPrice("0");
      setYearlyPrice("0");
      setModules(new Set());
      setFeatures(new Set());
      setLimit({});
    }
  }, [open, plan]);

  const toggle = <T,>(set: Set<T>, code: T): Set<T> => {
    const next = new Set(set);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    return next;
  };

  const limitPayload = useMemo(() => {
    const parse = (s?: string) => {
      if (s == null || s === "") return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    return {
      maxUsers: parse(limit.maxUsers),
      maxWarehouses: parse(limit.maxWarehouses),
      maxItems: parse(limit.maxItems),
      maxEmployees: parse(limit.maxEmployees),
      storageGb: parse(limit.storageGb),
    };
  }, [limit]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await admin.updatePlan(plan!.id, {
          name,
          description,
          monthlyPrice: Number(monthlyPrice) || 0,
          yearlyPrice: Number(yearlyPrice) || 0,
        });
        await admin.setPlanModules(plan!.id, Array.from(modules));
        await admin.setPlanFeatures(plan!.id, Array.from(features));
        await admin.setPlanLimit(plan!.id, limitPayload);
      } else {
        await admin.createPlan({
          name,
          slug,
          description,
          monthlyPrice: Number(monthlyPrice) || 0,
          yearlyPrice: Number(yearlyPrice) || 0,
          modules: Array.from(modules),
          features: Array.from(features),
          limit: limitPayload,
        } as any);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={editing}
              placeholder="basic / premium / pro"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Monthly price</Label>
            <Input
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Yearly price</Label>
            <Input
              type="number"
              value={yearlyPrice}
              onChange={(e) => setYearlyPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-sm">Modules</Label>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-3">
            {ALL_MODULES.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={modules.has(m)}
                  onCheckedChange={() => setModules(toggle(modules, m))}
                />
                <span className="font-mono text-xs">{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-sm">Features</Label>
          <div className="grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-2">
            {ALL_FEATURES.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={features.has(f)}
                  onCheckedChange={() => setFeatures(toggle(features, f))}
                />
                <span className="font-mono text-xs">{f}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-sm">Limits (blank = unlimited)</Label>
          <div className="grid grid-cols-2 gap-3 rounded-md border p-3 md:grid-cols-5">
            {(
              [
                "maxUsers",
                "maxWarehouses",
                "maxItems",
                "maxEmployees",
                "storageGb",
              ] as const
            ).map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{k}</Label>
                <Input
                  type="number"
                  value={limit[k] ?? ""}
                  onChange={(e) =>
                    setLimit((p) => ({ ...p, [k]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || !name} onClick={handleSave}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function nullableStr(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}
